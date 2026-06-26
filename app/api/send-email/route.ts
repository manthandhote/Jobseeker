import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { to_email, job_title, company_name, job_posting_id } =
      await request.json();

    if (!to_email) {
      return NextResponse.json({ error: "Recipient email required" }, { status: 400 });
    }

    const [{ data: profile }, { data: resume }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("resumes")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .single(),
    ]);

    const senderName = profile?.full_name || user.email!.split("@")[0];
    const senderEmail = user.email!;
    const senderPhone = profile?.phone || "";
    const linkedIn = profile?.linkedin_url || "";

    const jobTitleStr = job_title || "the advertised position";
    const companyStr = company_name || "your organisation";
    const subject = `Application for ${jobTitleStr} – ${senderName}`;

    const htmlBody = `<!DOCTYPE html>
<html>
<body style="font-family:Arial,Helvetica,sans-serif;line-height:1.7;color:#333;max-width:620px;margin:0 auto;padding:24px">
  <p>Dear Hiring Manager,</p>

  <p>
    I hope this message finds you well. I am writing to express my keen interest
    in the <strong>${jobTitleStr}</strong> opportunity at <strong>${companyStr}</strong>.
    Having reviewed the job posting, I am confident that my skills and professional
    experience align closely with the requirements of this role.
  </p>

  <p>
    I am enthusiastic about the possibility of contributing to ${companyStr}'s
    continued growth and success. Please find my resume attached for your review.
  </p>

  <p>
    I would welcome the opportunity to discuss how my background can add value to
    your team. Please feel free to reach out at your convenience — I am available
    for a call or interview at a time that suits you.
  </p>

  <p>Thank you for your time and consideration. I look forward to hearing from you.</p>

  <p>
    Warm regards,<br/>
    <strong>${senderName}</strong><br/>
    ${senderEmail}${senderPhone ? `<br/>${senderPhone}` : ""}${
      linkedIn
        ? `<br/><a href="${linkedIn}" style="color:#2563EB">${linkedIn}</a>`
        : ""
    }
  </p>
</body>
</html>`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const emailPayload: any = {
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: [to_email],
      reply_to: senderEmail,
      subject,
      html: htmlBody,
    };

    if (resume?.file_url) {
      try {
        const resumeRes = await fetch(resume.file_url);
        if (resumeRes.ok) {
          const arrayBuffer = await resumeRes.arrayBuffer();
          emailPayload.attachments = [
            {
              filename: resume.file_name,
              content: Buffer.from(arrayBuffer),
            },
          ];
        }
      } catch (e) {
        console.warn("Could not fetch resume for attachment:", e);
      }
    }

    const { data, error } = await resend.emails.send(emailPayload);

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.from("email_logs").insert({
      user_id: user.id,
      job_posting_id: job_posting_id || null,
      to_email,
      subject,
      status: "sent",
    });

    return NextResponse.json({ success: true, email_id: data?.id });
  } catch (error) {
    console.error("Send email route error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
