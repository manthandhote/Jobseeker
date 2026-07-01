import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { to_email, subject, body, job_posting_id } = await request.json();

    if (!to_email) {
      return NextResponse.json(
        { error: "Recipient email required" },
        { status: 400 }
      );
    }
    if (!subject?.trim() || !body?.trim()) {
      return NextResponse.json(
        { error: "Subject and message are required" },
        { status: 400 }
      );
    }

    // Fetch profile (includes Gmail credentials) and default resume in parallel
    const [{ data: profile }, { data: resume }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("resumes")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .single(),
    ]);

    // Require Gmail credentials
    if (!profile?.gmail_user || !profile?.gmail_app_password) {
      return NextResponse.json(
        {
          error:
            "Gmail not configured. Go to Profile → Email Settings and add your Gmail address and App Password.",
        },
        { status: 400 }
      );
    }

    // ── Send-rate limiting ──────────────────────────────────────
    // Recipient mail servers (e.g. Hostinger) throttle bursts and bounce
    // messages with "451 4.7.1 Ratelimit ... exceeded". Sending too fast
    // can also get the user's Gmail account flagged. Space sends out using
    // the user's own recent email_logs so we never create those bursts.
    const RATE_LIMIT = {
      minGapSeconds: 20, // minimum spacing between two sends
      perMinute: 4, // max sends in any rolling 60s
      perHour: 40, // max sends in any rolling 60m
    };

    const nowMs = Date.now();
    const hourAgoIso = new Date(nowMs - 60 * 60 * 1000).toISOString();
    const { data: recentLogs } = await supabase
      .from("email_logs")
      .select("sent_at")
      .eq("user_id", user.id)
      .eq("status", "sent")
      .gte("sent_at", hourAgoIso)
      .order("sent_at", { ascending: false });

    const sentTimes = (recentLogs ?? [])
      .map((l) => new Date(l.sent_at as string).getTime())
      .filter((t) => !Number.isNaN(t));
    const sentLastMinute = sentTimes.filter((t) => t > nowMs - 60_000).length;
    const gapSeconds = sentTimes.length
      ? (nowMs - sentTimes[0]) / 1000
      : Infinity;

    let retryAfter = 0;
    if (gapSeconds < RATE_LIMIT.minGapSeconds) {
      retryAfter = Math.ceil(RATE_LIMIT.minGapSeconds - gapSeconds);
    } else if (sentLastMinute >= RATE_LIMIT.perMinute) {
      retryAfter = 60;
    } else if (sentTimes.length >= RATE_LIMIT.perHour) {
      retryAfter = 15 * 60;
    }

    if (retryAfter > 0) {
      const wait =
        retryAfter >= 60
          ? `${Math.ceil(retryAfter / 60)} minute(s)`
          : `${retryAfter} seconds`;
      return NextResponse.json(
        {
          error: `You're sending applications too quickly. To avoid recipient mail servers rate-limiting and bouncing your emails, please wait ${wait} before sending the next one.`,
        },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const senderName = profile.full_name || user.email!.split("@")[0];

    // Build an HTML version from the plain-text body:
    // escape HTML, auto-link URLs, preserve line breaks.
    const escapeHtml = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const linkified = escapeHtml(body).replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" style="color:#2563eb">$1</a>'
    );
    const htmlBody = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#1f2937;white-space:pre-wrap">${linkified}</div>`;

    // Build transporter with user's Gmail credentials
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: profile.gmail_user,
        pass: profile.gmail_app_password,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mailOptions: any = {
      from: `"${senderName}" <${profile.gmail_user}>`,
      to: to_email,
      subject,
      text: body,
      html: htmlBody,
    };

    // Attach resume if available
    if (resume?.file_url) {
      try {
        const resumeRes = await fetch(resume.file_url);
        if (resumeRes.ok) {
          const buffer = Buffer.from(await resumeRes.arrayBuffer());
          mailOptions.attachments = [
            { filename: resume.file_name, content: buffer },
          ];
        }
      } catch (e) {
        console.warn("Could not fetch resume for attachment:", e);
      }
    }

    await transporter.sendMail(mailOptions);

    // Log the send
    await supabase.from("email_logs").insert({
      user_id: user.id,
      job_posting_id: job_posting_id || null,
      to_email,
      subject,
      status: "sent",
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Send email error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to send email";

    // Friendly Gmail-specific errors
    if (message.includes("Invalid login") || message.includes("Username and Password not accepted")) {
      return NextResponse.json(
        {
          error:
            "Gmail login failed. Make sure you entered a valid App Password (not your regular Gmail password). See Profile → Email Settings for instructions.",
        },
        { status: 400 }
      );
    }

    // Rate-limit / throttling responses (SMTP 421/451, 4.7.x). Some servers
    // reject synchronously instead of accepting and bouncing later.
    if (
      /\b4(21|50|51|52)\b/.test(message) ||
      /rate ?limit/i.test(message) ||
      message.includes("4.7.1") ||
      message.includes("Too many")
    ) {
      return NextResponse.json(
        {
          error:
            "The mail server is temporarily rate-limiting messages. Please wait a few minutes before sending more applications, then try again.",
        },
        { status: 429, headers: { "Retry-After": "300" } }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
