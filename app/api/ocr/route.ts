import { NextRequest, NextResponse } from "next/server";

function extractEmails(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return [...new Set(text.match(emailRegex) || [])];
}

function extractPhones(text: string): string[] {
  const found = new Set<string>();

  // Indian mobile: +91 or 91 prefix followed by 10 digits
  const indiaPattern = /(?:\+?91[\s.-]?)?\d{5}[\s.-]?\d{5}/g;
  // International: +<country> followed by digits
  const intlPattern = /\+\d{1,3}[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
  // Generic 10-digit
  const tenDigit = /(?<!\d)\d{10}(?!\d)/g;

  for (const pattern of [indiaPattern, intlPattern, tenDigit]) {
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

function parseJobDetails(text: string) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  let job_title: string | null = null;
  let company_name: string | null = null;
  let location: string | null = null;

  // Job title heuristics: labelled lines
  for (const line of lines) {
    const titleMatch = line.match(/^(?:role|position|title|job title)[:\s]+(.+)/i);
    if (titleMatch) { job_title = titleMatch[1].trim(); break; }
  }
  // Fallback: first short line (likely heading)
  if (!job_title && lines[0] && lines[0].length < 80) {
    job_title = lines[0];
  }

  // Company heuristics
  for (const line of lines) {
    const compMatch = line.match(
      /^(?:company|employer|organization|hiring company)[:\s]+(.+)/i
    );
    if (compMatch) { company_name = compMatch[1].trim(); break; }
  }
  if (!company_name) {
    const atMatch = text.match(/(?:at|@|with)\s+([A-Z][A-Za-z0-9\s&.,'-]{2,40})(?:\s|,|\.)/);
    if (atMatch) company_name = atMatch[1].trim();
  }

  // Location heuristics
  for (const line of lines) {
    const locMatch = line.match(/^(?:location|based in|place|city)[:\s]+(.+)/i);
    if (locMatch) { location = locMatch[1].trim(); break; }
  }
  if (!location) {
    const remoteMatch = text.match(/\b(remote|hybrid|on[\s-]?site|wfh)\b/i);
    if (remoteMatch) location = remoteMatch[1];
  }

  return { job_title, company_name, location };
}

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();
    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Cloud Vision API key not configured" },
        { status: 500 }
      );
    }

    const base64 = image.replace(/^data:image\/\w+;base64,/, "");

    const visionRes = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64 },
              features: [
                { type: "DOCUMENT_TEXT_DETECTION", maxResults: 1 },
              ],
            },
          ],
        }),
      }
    );

    if (!visionRes.ok) {
      const errText = await visionRes.text();
      console.error("Vision API error:", errText);
      return NextResponse.json({ error: "OCR service error" }, { status: 500 });
    }

    const visionData = await visionRes.json();
    const raw_text =
      visionData.responses?.[0]?.fullTextAnnotation?.text ||
      visionData.responses?.[0]?.textAnnotations?.[0]?.description ||
      "";

    const emails = extractEmails(raw_text);
    const phones = extractPhones(raw_text);
    const { job_title, company_name, location } = parseJobDetails(raw_text);

    return NextResponse.json({ raw_text, emails, phones, job_title, company_name, location });
  } catch (error) {
    console.error("OCR route error:", error);
    return NextResponse.json({ error: "Failed to process image" }, { status: 500 });
  }
}
