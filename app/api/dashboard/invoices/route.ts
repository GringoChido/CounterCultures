import { NextResponse, type NextRequest } from "next/server";
import {
  getInvoiceList,
  type MoveTypeFilter,
  type PaymentStateFilter,
  type AgingBucket,
  type InvoiceListFilters,
} from "@/app/lib/odoo-sheets";

const AGING_BUCKETS: AgingBucket[] = ["current", "0-30", "30-60", "60-90", "90+"];
const VALID_MOVE_TYPES: MoveTypeFilter[] = ["all", "customer", "vendor", "refund"];
const VALID_PAYMENT_STATES: PaymentStateFilter[] = ["all", "open", "paid", "overdue"];

export const GET = async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const moveTypeRaw = sp.get("moveType");
  const paymentStateRaw = sp.get("paymentState");
  const agingBucketRaw = sp.get("agingBucket");

  const filters: InvoiceListFilters = {
    q: sp.get("q") ?? "",
    moveType: VALID_MOVE_TYPES.includes(moveTypeRaw as MoveTypeFilter)
      ? (moveTypeRaw as MoveTypeFilter)
      : "customer",
    paymentState: VALID_PAYMENT_STATES.includes(paymentStateRaw as PaymentStateFilter)
      ? (paymentStateRaw as PaymentStateFilter)
      : "all",
    agingBucket: AGING_BUCKETS.includes(agingBucketRaw as AgingBucket)
      ? (agingBucketRaw as AgingBucket)
      : undefined,
    partnerId: sp.get("partnerId") ?? undefined,
    limit: Math.min(Number(sp.get("limit") ?? 200), 1000),
    offset: Math.max(Number(sp.get("offset") ?? 0), 0),
    sort: (sp.get("sort") ?? "date_desc") as InvoiceListFilters["sort"],
  };

  try {
    const result = await getInvoiceList(filters);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[invoices API] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
};
