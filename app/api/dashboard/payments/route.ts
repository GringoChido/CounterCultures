import { NextResponse, type NextRequest } from "next/server";
import {
  getPaymentList,
  type PaymentTypeFilter,
  type PaymentStateFilterPay,
  type PaymentListFilters,
} from "@/app/lib/odoo-sheets";

const VALID_TYPES: PaymentTypeFilter[] = ["all", "inbound", "outbound"];
const VALID_STATES: PaymentStateFilterPay[] = ["all", "draft", "posted", "cancel", "sent"];

export const GET = async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const typeRaw = sp.get("paymentType");
  const stateRaw = sp.get("state");

  const filters: PaymentListFilters = {
    q: sp.get("q") ?? "",
    paymentType: VALID_TYPES.includes(typeRaw as PaymentTypeFilter)
      ? (typeRaw as PaymentTypeFilter)
      : "all",
    state: VALID_STATES.includes(stateRaw as PaymentStateFilterPay)
      ? (stateRaw as PaymentStateFilterPay)
      : "all",
    journalId: sp.get("journalId") ?? undefined,
    partnerId: sp.get("partnerId") ?? undefined,
    currency: sp.get("currency") ?? undefined,
    since: sp.get("since") ?? undefined,
    until: sp.get("until") ?? undefined,
    limit: Math.min(Number(sp.get("limit") ?? 200), 1000),
    offset: Math.max(Number(sp.get("offset") ?? 0), 0),
    sort: (sp.get("sort") ?? "date_desc") as PaymentListFilters["sort"],
  };

  try {
    const result = await getPaymentList(filters);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[payments API] error:", err);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
};
