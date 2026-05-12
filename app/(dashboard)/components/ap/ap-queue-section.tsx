"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, ShieldAlert } from "lucide-react";

export interface APQueueRow {
  label: string;
  dueDate: string;
  fraction: number;
  blocksSend: boolean;
  source: "auto" | "manual";
  poId: string;
  poName: string;
  vendorName: string;
  vendorKey: string;
  poAmount: number;
  currency: string;
}

const fmt = (n: number, cur = "MXN") =>
  !n ? "—" : `$${Math.round(n).toLocaleString()} ${cur}`;

const APQueueSection = () => {
  const [rows, setRows] = useState<APQueueRow[]>([]);
  const [blockingCount, setBlockingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/ap-queue")
      .then((r) => (r.ok ? r.json() : { queue: [] }))
      .then((data: { queue?: APQueueRow[]; blockingCount?: number }) => {
        setRows(data.queue ?? []);
        setBlockingCount(data.blockingCount ?? 0);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (rows.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-brand-copper" />
        <h2 className="font-display text-sm uppercase tracking-wider text-dash-text">
          AP Queue
        </h2>
        <span className="text-[10px] text-dash-text-secondary">
          {rows.length} pending
          {blockingCount > 0 && (
            <span className="text-brand-terracotta ml-1">
              · {blockingCount} blocking PO send
            </span>
          )}
        </span>
      </div>
      <div className="bg-dash-surface border border-dash-border rounded overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_1fr_0.8fr_0.7fr_auto] gap-px text-[10px] uppercase tracking-wider text-dash-text-secondary px-4 py-2 border-b border-dash-border bg-dash-bg">
          <div>Vendor</div>
          <div>PO</div>
          <div>Trigger</div>
          <div>Amount</div>
          <div>Due</div>
          <div>Status</div>
        </div>
        {rows.map((r, i) => (
          <div
            key={`${r.poId}-${i}`}
            className={`grid grid-cols-[1fr_1fr_1fr_0.8fr_0.7fr_auto] gap-px px-4 py-2.5 text-sm border-b border-dash-border last:border-b-0 ${
              r.blocksSend ? "bg-brand-terracotta/5" : ""
            }`}
          >
            <div className="text-dash-text font-medium text-xs">{r.vendorName}</div>
            <div>
              <Link
                href={`/dashboard/purchases/${r.poId}`}
                className="font-mono text-xs hover:text-dash-accent"
              >
                {r.poName}
              </Link>
            </div>
            <div className="text-xs text-dash-text-secondary">{r.label}</div>
            <div className="font-mono text-xs text-dash-text">
              {r.fraction < 1
                ? `${Math.round(r.fraction * 100)}% of ${fmt(r.poAmount, r.currency)}`
                : fmt(r.poAmount, r.currency)}
            </div>
            <div className="text-xs text-dash-text">
              {r.dueDate || <span className="text-dash-text-secondary">—</span>}
            </div>
            <div>
              {r.blocksSend ? (
                <span className="inline-flex items-center gap-1 text-[10px] text-brand-terracotta">
                  <ShieldAlert className="w-3 h-3" />
                  blocks send
                </span>
              ) : r.source === "manual" ? (
                <span className="text-[10px] text-dash-text-secondary">manual</span>
              ) : (
                <span className="text-[10px] text-dash-text-secondary">queued</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default APQueueSection;
