import { NextResponse, type NextRequest } from "next/server";
import { getDescription } from "@/app/lib/product-descriptions";

/**
 * Public read endpoint — returns approved descriptions only. Pending and
 * rejected rows are intentionally hidden from public surfaces.
 */
export const GET = async (req: NextRequest) => {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ description: null });
  try {
    const row = await getDescription(id);
    if (!row || row.status !== "approved") {
      return NextResponse.json({ description: null });
    }
    return NextResponse.json({
      description: {
        descriptionEn: row.descriptionEn,
        descriptionEs: row.descriptionEs,
      },
    });
  } catch (err) {
    console.error("[products/description] error:", err);
    return NextResponse.json({ description: null });
  }
};
