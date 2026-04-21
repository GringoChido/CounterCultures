import { NextResponse, type NextRequest } from "next/server";
import { getCustomerProfile } from "@/app/lib/odoo-sheets";

export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  try {
    const profile = await getCustomerProfile(id);
    if (!profile) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    return NextResponse.json(profile);
  } catch (err) {
    console.error("[customer profile API] error:", err);
    return NextResponse.json(
      { error: "Failed to load customer" },
      { status: 500 }
    );
  }
};
