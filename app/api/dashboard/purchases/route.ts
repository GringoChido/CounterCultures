import { NextResponse, type NextRequest } from "next/server";
import {
  getPurchaseOrderList,
  type POStateFilter,
  type POInvoiceFilter,
  type POListFilters,
} from "@/app/lib/odoo-sheets";

const VALID_STATES: POStateFilter[] = ["all", "draft", "sent", "purchase", "done", "cancel"];
const VALID_INV: POInvoiceFilter[] = ["all", "no", "to invoice", "invoiced"];

export const GET = async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const s = sp.get("state");
  const inv = sp.get("invoiceStatus");

  const filters: POListFilters = {
    q: sp.get("q") ?? "",
    state: VALID_STATES.includes(s as POStateFilter) ? (s as POStateFilter) : "all",
    invoiceStatus: VALID_INV.includes(inv as POInvoiceFilter) ? (inv as POInvoiceFilter) : "all",
    vendorId: sp.get("vendorId") ?? undefined,
    stuckOnly: sp.get("stuckOnly") === "true",
    limit: Math.min(Number(sp.get("limit") ?? 200), 1000),
    offset: Math.max(Number(sp.get("offset") ?? 0), 0),
    sort: (sp.get("sort") ?? "date_desc") as POListFilters["sort"],
  };
  try {
    const result = await getPurchaseOrderList(filters);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[purchases API] error:", err);
    return NextResponse.json({ error: "Failed to fetch POs" }, { status: 500 });
  }
};
