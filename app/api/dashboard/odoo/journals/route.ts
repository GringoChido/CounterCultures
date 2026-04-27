/**
 * GET /api/dashboard/odoo/journals?type=bank,cash
 *
 * Returns Odoo journals from the Sheets mirror, filtered by type. Used by
 * the "Mark Paid" modal on the invoice detail page to populate the journal
 * dropdown.
 */

import { NextResponse, type NextRequest } from "next/server";
import { getOdooJournals } from "@/app/lib/odoo-sheets";
import { requireFeature, FeatureDeniedError } from "@/app/lib/auth";

export const GET = async (req: NextRequest): Promise<Response> => {
  try {
    // The journals list is broadly useful for any feature that touches
    // money, so gate on register_payment as the most common consumer.
    await requireFeature("register_payment");
    const typesParam = req.nextUrl.searchParams.get("type");
    const allowed = (typesParam ?? "bank,cash")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const journals = await getOdooJournals();
    const filtered = journals
      .filter((j) => allowed.includes(j.type))
      .map((j) => ({
        id: Number(j.id),
        name: j.name,
        code: j.code,
        type: j.type,
        currency_id: j.currency_id,
      }))
      .filter((j) => Number.isFinite(j.id) && j.id > 0)
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ journals: filtered });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json(
        { error: "Forbidden", feature: err.feature },
        { status: 403 }
      );
    }
    const msg = err instanceof Error ? err.message : "journals_failed";
    console.error("[/api/dashboard/odoo/journals]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
};
