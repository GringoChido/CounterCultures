import { NextResponse } from "next/server";
import { getBrands } from "@/app/lib/brand-kit-sheets";

export const GET = async () => {
  try {
    const brands = await getBrands();
    return NextResponse.json({ brands });
  } catch (err) {
    console.error("[Brands API] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch brands" },
      { status: 500 }
    );
  }
};
