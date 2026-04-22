import { NextRequest, NextResponse } from "next/server";
import { getMessagesFor, getMessagesForPartner } from "@/app/lib/odoo-sheets";

export const GET = async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const resModel = searchParams.get("resModel");
  const resId = searchParams.get("resId");
  const partnerId = searchParams.get("partnerId");

  try {
    if (partnerId) {
      const items = await getMessagesForPartner(partnerId);
      return NextResponse.json({ items });
    }
    if (!resModel || !resId) {
      return NextResponse.json(
        { error: "resModel and resId (or partnerId) are required" },
        { status: 400 }
      );
    }
    const items = await getMessagesFor(resModel, resId);
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[Messages API] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
};
