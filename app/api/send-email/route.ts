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

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
