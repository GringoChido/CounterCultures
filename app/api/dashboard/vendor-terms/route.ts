/**
 * R2-6: read the canonical Vendors sheet (or seed fallback) so the AP
 * queue and PO send flow can dispatch on each vendor's billing trigger.
 */

import { NextResponse, type NextRequest } from "next/server";
import { getAllVendorTerms, getVendorTerms } from "@/app/lib/vendor-terms";
import { requireFeature, FeatureDeniedError } from "@/app/lib/auth";

export const GET = async (request: NextRequest): Promise<Response> => {
  try {
    await requireFeature("view_vendors");
    const key = request.nextUrl.searchParams.get("vendor");
    if (key) {
      const one = await getVendorTerms(key);
      return NextResponse.json({ vendor: one });
    }
    const vendors = await getAllVendorTerms();
    return NextResponse.json({ vendors });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json(
        { error: "Forbidden", feature: err.feature },
        { status: 403 }
      );
    }
    const msg = err instanceof Error ? err.message : "vendor_terms_failed";
    console.error("[/api/dashboard/vendor-terms]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
};
