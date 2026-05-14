import { NextResponse } from "next/server";
import { getPurchaseOrderList, type EntityCompany } from "@/app/lib/odoo-sheets";
import {
  getAllVendorTerms,
  computeQueuedPayments,
  type VendorTerms,
  type QueuedPayment,
} from "@/app/lib/vendor-terms";

interface APQueueRow extends QueuedPayment {
  poId: string;
  poName: string;
  vendorName: string;
  vendorKey: string;
  poAmount: number;
  currency: string;
  company: EntityCompany;
}

const matchVendor = (
  partnerName: string,
  vendors: VendorTerms[]
): VendorTerms | null => {
  const target = partnerName.trim().toLowerCase();
  if (!target) return null;
  let best: { vendor: VendorTerms; score: number } | null = null;
  for (const v of vendors) {
    const name = v.name.trim().toLowerCase();
    const key = v.vendor.trim().toLowerCase();
    if (!name && !key) continue;
    let score = 0;
    if (name && (target.includes(name) || name.includes(target))) {
      score = name.length;
    } else if (key && target.includes(key)) {
      score = key.length;
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { vendor: v, score };
    }
  }
  return best?.vendor ?? null;
};

export const GET = async (): Promise<Response> => {
  try {
    const [poResult, vendors] = await Promise.all([
      getPurchaseOrderList({
        state: "all",
        limit: 500,
        sort: "date_desc",
      }),
      getAllVendorTerms(),
    ]);

    const activePOs = poResult.orders.filter(
      (po) => po.state === "draft" || po.state === "sent" || po.state === "purchase"
    );

    const rows: APQueueRow[] = [];
    for (const po of activePOs) {
      const terms = matchVendor(po.vendorName, vendors);
      if (!terms) continue;
      const queued = computeQueuedPayments(terms, {
        poDate: po.dateOrder,
      });
      for (const q of queued) {
        rows.push({
          ...q,
          poId: po.id,
          poName: po.name,
          vendorName: po.vendorName,
          vendorKey: terms.vendor,
          poAmount: po.amountTotal,
          currency: po.currency,
          company: po.company,
        });
      }
    }

    rows.sort((a, b) => {
      if (a.blocksSend !== b.blocksSend) return a.blocksSend ? -1 : 1;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });

    return NextResponse.json({
      queue: rows,
      total: rows.length,
      blockingCount: rows.filter((r) => r.blocksSend).length,
    });
  } catch (err) {
    console.error("[ap-queue]", err);
    return NextResponse.json({ error: "Failed to compute AP queue" }, { status: 500 });
  }
};
