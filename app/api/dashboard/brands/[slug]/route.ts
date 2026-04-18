import { NextResponse, type NextRequest } from "next/server";
import {
  getBrandBySlug,
  updateBrand,
  type BrandPatch,
} from "@/app/lib/brand-kit-sheets";

type Ctx = { params: Promise<{ slug: string }> };

export const GET = async (_req: NextRequest, { params }: Ctx) => {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  if (!brand) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }
  return NextResponse.json({ brand });
};

export const PATCH = async (req: NextRequest, { params }: Ctx) => {
  const { slug } = await params;
  try {
    const body = (await req.json()) as BrandPatch;
    const updated = await updateBrand(slug, body, "portal");
    if (!updated) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }
    return NextResponse.json({ brand: updated });
  } catch (err) {
    console.error(`[Brands PATCH ${slug}]`, err);
    return NextResponse.json(
      { error: "Failed to update brand" },
      { status: 500 }
    );
  }
};
