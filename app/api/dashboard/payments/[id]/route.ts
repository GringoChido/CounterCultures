import { NextResponse, type NextRequest } from "next/server";
import { getPaymentDetail } from "@/app/lib/odoo-sheets";

export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  try {
    const detail = await getPaymentDetail(id);
    if (!detail) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (err) {
    console.error("[payment detail API] error:", err);
    return NextResponse.json({ error: "Failed to load payment" }, { status: 500 });
  }
};
