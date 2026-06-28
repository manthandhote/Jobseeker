import { NextRequest, NextResponse } from "next/server";
import { extractEmails, extractPhones, parseJobDetails } from "@/lib/ocr-utils";

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
      const errJson = await visionRes.json().catch(() => null);
      const errText = errJson?.error?.message || `HTTP ${visionRes.status}`;
      console.error("Vision API error:", errJson);
      return NextResponse.json({ error: `Google Vision: ${errText}` }, { status: 500 });
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
