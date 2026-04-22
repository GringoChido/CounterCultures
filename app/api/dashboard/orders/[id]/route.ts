import { NextResponse, type NextRequest } from "next/server";
import { getOrderDetail } from "@/app/lib/odoo-sheets";

export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  try {
    const detail = await getOrderDetail(id);
    if (!detail) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (err) {
    console.error("[order detail API] error:", err);
    return NextResponse.json({ error: "Failed to load order" }, { status: 500 });
  }
};
