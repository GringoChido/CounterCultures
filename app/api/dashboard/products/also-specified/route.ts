import { NextResponse, type NextRequest } from "next/server";
import { getAlsoSpecifiedWith } from "@/app/lib/catalog-signals";

export const GET = async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const id = sp.get("id");
  if (!id) return NextResponse.json({ items: [] });
  const limit = Math.min(Math.max(Number(sp.get("limit") ?? 8), 1), 24);
  try {
    const items = await getAlsoSpecifiedWith(id, limit);
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[products/also-specified] error:", err);
    return NextResponse.json({ items: [] });
  }
};
