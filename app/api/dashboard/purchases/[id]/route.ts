import { NextResponse, type NextRequest } from "next/server";
import { getPurchaseOrderDetail } from "@/app/lib/odoo-sheets";

export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  try {
    const detail = await getPurchaseOrderDetail(id);
    if (!detail) return NextResponse.json({ error: "PO not found" }, { status: 404 });
    return NextResponse.json(detail);
  } catch (err) {
    console.error("[purchase detail API] error:", err);
    return NextResponse.json({ error: "Failed to load PO" }, { status: 500 });
  }
};
