import { NextResponse } from "next/server";
import { getVendorList } from "@/app/lib/odoo-sheets";
import { requireFeature, FeatureDeniedError } from "@/app/lib/auth";

export const GET = async (): Promise<Response> => {
  try {
    await requireFeature("view_vendors");
    const vendors = await getVendorList();
    return NextResponse.json({ vendors });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json(
        { error: "Forbidden", feature: err.feature },
        { status: 403 }
      );
    }
    const msg = err instanceof Error ? err.message : "vendors_failed";
    console.error("[/api/dashboard/vendors]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
};
