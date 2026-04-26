import { NextResponse, type NextRequest } from "next/server";
import { visualSearch, MAX_IMAGE_BYTES } from "@/app/lib/visual-search";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;
type AllowedType = (typeof ALLOWED_TYPES)[number];

/**
 * POST /api/products/visual-search — public multipart upload of a single
 * fixture image. Claude vision extracts attributes and we match to the 354k
 * catalog. Public per the architect-on-site use case; rate-limited by file
 * size and MIME type so it can't be abused as a generic vision proxy.
 */
export const POST = async (req: NextRequest) => {
  try {
    const form = await req.formData();
    const file = form.get("image");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No image uploaded — expected multipart field 'image'" },
        { status: 400 }
      );
    }
    if (!ALLOWED_TYPES.includes(file.type as AllowedType)) {
      return NextResponse.json(
        { error: `Unsupported type ${file.type || "unknown"} — use JPEG, PNG, WebP, or GIF.` },
        { status: 400 }
      );
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        {
          error: `Image too large (${(file.size / 1_000_000).toFixed(1)} MB) — max ${MAX_IMAGE_BYTES / 1_000_000} MB.`,
        },
        { status: 400 }
      );
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const base64 = buf.toString("base64");

    const result = await visualSearch(base64, file.type as AllowedType);
    return NextResponse.json({
      filename: file.name,
      ...result,
    });
  } catch (err) {
    console.error("[visual-search] error:", err);
    const message = err instanceof Error ? err.message : "Visual search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};
