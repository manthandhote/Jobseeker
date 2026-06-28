import { Profile } from "@/types";

export interface EmailDraftInput {
  profile: Partial<Profile> | null;
  recruiterName?: string;
  jobTitle?: string | null;
  companyName?: string | null;
  /** auth email, used only to derive a name if full_name is missing */
  fallbackEmail?: string | null;
}

/**
 * Builds a short, personalized application email following the
 * "lead with a measurable, stack-relevant achievement" format.
 * No fluff, no "I hope this email finds you well".
 */
export function buildEmailDraft({
  profile,
  recruiterName,
  jobTitle,
  companyName,
  fallbackEmail,
}: EmailDraftInput): { subject: string; body: string } {
  const name =
    profile?.full_name?.trim() || fallbackEmail?.split("@")[0] || "";
  const firstName = name.split(/\s+/)[0] || name;
  const headline = profile?.headline?.trim() || "Software Developer";
  const years = profile?.years_experience?.trim() || "";
  const skills = profile?.key_skills?.trim() || "";
  const achievement = profile?.key_achievement?.trim() || "";
  const phone = profile?.phone?.trim() || "";
  const linkedin = profile?.linkedin_url?.trim() || "";
  const portfolio = profile?.portfolio_url?.trim() || "";

  const role = (jobTitle || "").trim();
  const company = (companyName || "").trim();

  // ── Subject (kept short) ──
  const firstSkill = skills.split(/[,/|]/)[0]?.trim() || "";
  let credential = "";
  if (years && firstSkill) credential = `, ${years} yrs ${firstSkill}`;
  else if (years) credential = `, ${years} yrs`;
  else if (firstSkill) credential = `, ${firstSkill}`;
  const subject = `${headline} – ${firstName}${credential}`.trim();

  // ── Greeting ──
  const greeting = `Hi ${recruiterName?.trim() || "there"},`;

  // ── Intro: who you are + the specific role ──
  let intro = `I'm a ${headline.toLowerCase()}`;
  if (years) intro += ` with ${years} years' experience`;
  if (skills) intro += ` in ${skills}`;
  intro += `, reaching out about the ${role || "open"} role`;
  if (company) intro += ` at ${company}`;
  intro += `.`;

  // ── Achievement: strongest, quantified, stack-relevant ──
  const achievementLine =
    achievement ||
    `[Add your strongest, measurable achievement — e.g. "At my last company I built a checkout flow that cut load time by 40%."]`;

  // ── Clear, easy call to action ──
  let cta =
    `Would you be open to a quick 15-minute call this week? I've attached my resume`;
  if (portfolio) cta += ` and you can see my work at ${portfolio}`;
  cta += `.`;

  // ── Signature ──
  const sigParts = [name, phone, linkedin, portfolio].filter(Boolean);
  const signature = `Best,\n${sigParts.join(" · ")}`;

  const body = [greeting, "", intro, "", achievementLine, "", cta, "", signature].join("\n");

  return { subject, body };
}
