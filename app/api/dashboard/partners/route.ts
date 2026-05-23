import { NextRequest, NextResponse } from "next/server";
import { getOdooPartners } from "@/app/lib/odoo-sheets";
import { requireFeature, FeatureDeniedError } from "@/app/lib/auth";

interface PartnerDirectoryRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  isCompany: boolean;
  customerRank: number;
  supplierRank: number;
  vat: string;
  category: string;
}

export const GET = async (req: NextRequest): Promise<Response> => {
  try {
    await requireFeature("view_contacts");
    const partners = await getOdooPartners();

    const sp = req.nextUrl.searchParams;
    const q = sp.get("q")?.toLowerCase().trim() ?? "";

    let rows: PartnerDirectoryRow[] = partners.map((p) => ({
      id: p.id,
      name: p.name || p.display_name,
      email: p.email,
      phone: p.phone || p.mobile,
      city: p.city,
      country: p.country_id,
      isCompany: p.is_company === "True" || p.is_company === "true",
      customerRank: Number(p.customer_rank) || 0,
      supplierRank: Number(p.supplier_rank) || 0,
      vat: p.vat,
      category: p.category_id,
    }));

    if (q) {
      rows = rows.filter((r) => {
        const hay = `${r.name} ${r.email} ${r.phone} ${r.vat} ${r.city} ${r.country}`.toLowerCase();
        return hay.includes(q);
      });
    }

    rows.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ partners: rows, total: rows.length });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json(
        { error: "Forbidden", feature: err.feature },
        { status: 403 }
      );
    }
    const msg = err instanceof Error ? err.message : "partners_failed";
    console.error("[/api/dashboard/partners]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
};
