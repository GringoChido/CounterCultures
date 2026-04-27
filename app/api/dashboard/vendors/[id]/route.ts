import { NextResponse, type NextRequest } from "next/server";
import { getVendorProfile } from "@/app/lib/odoo-sheets";
import { requireFeature, FeatureDeniedError } from "@/app/lib/auth";

export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> => {
  try {
    await requireFeature("view_vendors");
    const { id } = await params;
    const profile = await getVendorProfile(id);
    if (!profile) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }
    return NextResponse.json(profile);
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json(
        { error: "Forbidden", feature: err.feature },
        { status: 403 }
      );
    }
    const msg = err instanceof Error ? err.message : "vendor_failed";
    console.error("[/api/dashboard/vendors/[id]]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
};
