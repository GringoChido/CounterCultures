import { NextResponse, type NextRequest } from "next/server";
import {
  getOrderList,
  type OrderStateFilter,
  type InvoiceStatusFilter,
  type OrderListFilters,
} from "@/app/lib/odoo-sheets";

const VALID_STATES: OrderStateFilter[] = ["all", "quote", "draft", "sent", "sale", "done", "cancel"];
const VALID_INVOICE_STATUSES: InvoiceStatusFilter[] = ["all", "no", "to invoice", "invoiced", "upselling"];

export const GET = async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const stateRaw = sp.get("state");
  const invStatusRaw = sp.get("invoiceStatus");

  const filters: OrderListFilters = {
    q: sp.get("q") ?? "",
    state: VALID_STATES.includes(stateRaw as OrderStateFilter)
      ? (stateRaw as OrderStateFilter)
      : "all",
    invoiceStatus: VALID_INVOICE_STATUSES.includes(invStatusRaw as InvoiceStatusFilter)
      ? (invStatusRaw as InvoiceStatusFilter)
      : "all",
    partnerId: sp.get("partnerId") ?? undefined,
    staleOnly: sp.get("staleOnly") === "true",
    limit: Math.min(Number(sp.get("limit") ?? 200), 1000),
    offset: Math.max(Number(sp.get("offset") ?? 0), 0),
    sort: (sp.get("sort") ?? "date_desc") as OrderListFilters["sort"],
  };

  try {
    const result = await getOrderList(filters);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[orders API] error:", err);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
};
