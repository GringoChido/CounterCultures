import { NextRequest, NextResponse } from "next/server";
import { getAttachmentsFor } from "@/app/lib/odoo-sheets";

export const GET = async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const resModel = searchParams.get("resModel");
  const resId = searchParams.get("resId");
  if (!resModel || !resId) {
    return NextResponse.json(
      { error: "resModel and resId are required" },
      { status: 400 }
    );
  }
  try {
    const items = await getAttachmentsFor(resModel, resId);
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[Attachments API] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch attachments" },
      { status: 500 }
    );
  }
};
