import { NextResponse, type NextRequest } from "next/server";
import { getDescription } from "@/app/lib/product-descriptions";

/**
 * Admin read — returns the row regardless of status so Roger can review
 * pending generations before flipping to "approved" in the sheet.
 */
export const GET = async (req: NextRequest) => {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ row: null });
  try {
    const row = await getDescription(id);
    return NextResponse.json({ row });
  } catch (err) {
    console.error("[dashboard/products/description] error:", err);
    return NextResponse.json({ row: null });
  }
};
