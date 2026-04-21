import { NextResponse, type NextRequest } from "next/server";
import { getInvoiceDetail } from "@/app/lib/odoo-sheets";

export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  try {
    const detail = await getInvoiceDetail(id);
    if (!detail) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (err) {
    console.error("[invoice detail API] error:", err);
    return NextResponse.json(
      { error: "Failed to load invoice" },
      { status: 500 }
    );
  }
};
