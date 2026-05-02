/**
 * Cash bucket — payments where Fiscal_Disposition === "cash_bucket".
 * Owner-only by default (`view_cash_bucket` feature is not in the finance
 * or sales role defaults). Roger can grant access to a specific user via
 * `+view_cash_bucket` in the Users sheet feature_overrides column.
 *
 * GET response:
 *   {
 *     payments: DealPaymentRecord[],   // already filtered to cash_bucket
 *     monthSummary: {
 *       month: "2026-04",              // current month
 *       byEarmark: Record<string, { count, total }>,
 *       totalMxn: number,
 *     }
 *   }
 */

import { NextResponse, type NextRequest } from "next/server";
import { readSheet } from "@/app/lib/dashboard-sheets";
import { requireFeature, FeatureDeniedError } from "@/app/lib/auth";

interface DealPaymentRow extends Record<string, string> {
  Payment_ID: string;
  Deal_ID: string;
  Amount: string;
  Currency: string;
  Status: string;
  Paid_Date: string;
  Fiscal_Disposition: string;
  Cash_Earmark: string;
}

const monthKey = (iso: string): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

export const GET = async (request: NextRequest): Promise<Response> => {
  try {
    await requireFeature("view_cash_bucket");

    const monthParam = request.nextUrl.searchParams.get("month") ?? "";
    const now = new Date();
    const currentMonth =
      monthParam ||
      `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

    const all = await readSheet<DealPaymentRow>("Deal_Payments");
    const cashBucket = all.filter(
      (p) => (p.Fiscal_Disposition ?? "").trim().toLowerCase() === "cash_bucket"
    );
    const thisMonth = cashBucket.filter(
      (p) => monthKey(p.Paid_Date) === currentMonth
    );

    const byEarmark: Record<string, { count: number; total: number }> = {};
    let totalMxn = 0;
    for (const p of thisMonth) {
      const earmark = (p.Cash_Earmark ?? "").trim() || "unspecified";
      const amount = Number.parseFloat(p.Amount ?? "0") || 0;
      // Treat USD as 1:1 placeholder — Roger's cash-bucket flow is MXN-only
      // in practice, but the column carries Currency for traceability.
      totalMxn += amount;
      const cur = byEarmark[earmark] ?? { count: 0, total: 0 };
      cur.count += 1;
      cur.total += amount;
      byEarmark[earmark] = cur;
    }

    // Return only this-month rows — older months balloon the payload and
    // aren't part of this view. Page can request a different month with
    // ?month=YYYY-MM.
    return NextResponse.json({
      payments: thisMonth,
      monthSummary: { month: currentMonth, byEarmark, totalMxn },
    });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json(
        { error: "Forbidden", feature: err.feature },
        { status: 403 }
      );
    }
    const msg = err instanceof Error ? err.message : "cash_bucket_failed";
    console.error("[/api/dashboard/finance/cash-bucket]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
};
