import { NextResponse, type NextRequest } from "next/server";
import {
  extractFromPdf,
  matchExtractions,
  MAX_PDF_BYTES,
  type PdfMatch,
} from "@/app/lib/pdf-extraction";

/**
 * POST /api/products/extract-pdf — multipart upload of a single spec PDF.
 *
 * Public-readable: architects browsing /shop/catalog can drop a PDF without
 * authentication. The endpoint is intentionally rate-limited by file size
 * (20 MB) and only accepts application/pdf so it can't be abused as a
 * generic Claude proxy. Cost ceiling: ~$0.02 per call on Haiku 4.5.
 */
export const POST = async (req: NextRequest) => {
  try {
    const form = await req.formData();
    const file = form.get("pdf");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No PDF uploaded — expected multipart field 'pdf'" },
        { status: 400 }
      );
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: `Expected application/pdf, got ${file.type || "unknown"}` },
        { status: 400 }
      );
    }
    if (file.size > MAX_PDF_BYTES) {
      return NextResponse.json(
        { error: `PDF too large (${(file.size / 1_000_000).toFixed(1)} MB) — max 20 MB.` },
        { status: 400 }
      );
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const base64 = buf.toString("base64");

    const extractions = await extractFromPdf(base64);
    if (extractions.length === 0) {
      return NextResponse.json({
        extractions: [],
        matches: [],
        message: "No products found in this PDF.",
      });
    }

    const matches: PdfMatch[] = await matchExtractions(extractions);
    return NextResponse.json({
      filename: file.name,
      extractions,
      matches,
      stats: {
        total: matches.length,
        high: matches.filter((m) => m.confidence === "high").length,
        medium: matches.filter((m) => m.confidence === "medium").length,
        low: matches.filter((m) => m.confidence === "low").length,
        none: matches.filter((m) => m.confidence === "none").length,
      },
    });
  } catch (err) {
    console.error("[extract-pdf] error:", err);
    const message = err instanceof Error ? err.message : "Extraction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};
