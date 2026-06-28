import { ExtractedJobData } from "@/types";

export function extractEmails(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return [...new Set(text.match(emailRegex) || [])];
}

export function extractPhones(text: string): string[] {
  const found = new Set<string>();

  const patterns = [
    /\+?91[\s.-]?\d{5}[\s.-]?\d{5}/g,           // Indian: +91 XXXXX XXXXX
    /\+\d{1,3}[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g, // International
    /(?<!\d)\d{10}(?!\d)/g,                        // Plain 10-digit
  ];

  for (const pattern of patterns) {
    const matches = text.match(pattern) || [];
    matches.forEach((m) => {
      const digits = m.replace(/\D/g, "");
      if (digits.length >= 10 && digits.length <= 13) {
        found.add(m.trim());
      }
    });
  }
  return [...found];
}

export function parseJobDetails(text: string): Pick<ExtractedJobData, "job_title" | "company_name" | "location"> {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  let job_title: string | null = null;
  let company_name: string | null = null;
  let location: string | null = null;

  // LinkedIn UI noise patterns to skip
  const noisePattern = /follow|connect|3rd\+|2nd\+|1st\+|connections?|mutual|message|like|comment|share|repost|reaction|view|ago|^\d+[hmd]\b/i;

  // Labelled job title
  for (const line of lines) {
    const m = line.match(/^(?:role|position|title|job title|opening|hiring for)[:\s]+(.+)/i);
    if (m) { job_title = m[1].trim(); break; }
  }
  // Fallback: first non-noise short line
  if (!job_title) {
    const first = lines.find((l) => l.length > 5 && l.length < 80 && !noisePattern.test(l));
    if (first) job_title = first;
  }

  // Labelled company
  for (const line of lines) {
    const m = line.match(/^(?:company|employer|organization|at)[:\s]+(.+)/i);
    if (m) { company_name = m[1].trim(); break; }
  }
  if (!company_name) {
    const m = text.match(/(?:at|@|with)\s+([A-Z][A-Za-z0-9\s&.,'-]{2,40})(?:\s|,|\.)/);
    if (m) company_name = m[1].trim();
  }

  // Location
  for (const line of lines) {
    const m = line.match(/^(?:location|based in|place|city|work location)[:\s]+(.+)/i);
    if (m) { location = m[1].trim(); break; }
  }
  if (!location) {
    const m = text.match(/\b(remote|hybrid|on[\s-]?site|wfh|work from home)\b/i);
    if (m) location = m[1];
  }

  return { job_title, company_name, location };
}
