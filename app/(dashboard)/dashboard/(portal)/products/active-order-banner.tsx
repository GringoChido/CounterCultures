"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ShoppingBag, ExternalLink, X } from "lucide-react";
import { useActiveOrderStore } from "@/app/lib/stores/active-order-store";

/**
 * Sticky banner shown when Roger has an active order context.
 * Subsequent product-adds go to this deal automatically.
 */
const ActiveOrderBanner = () => {
  const active = useActiveOrderStore((s) => s.active);
  const clear = useActiveOrderStore((s) => s.clear);
  const refresh = useActiveOrderStore((s) => s.refresh);

  // On mount (and when the active dealId changes), resync counts from
  // the server so a stale localStorage value doesn't lie to the user.
  useEffect(() => {
    if (active?.dealId) void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.dealId]);

  if (!active) return null;

  return (
    <div className="sticky top-0 z-20 -mt-6 mb-4">
      <div className="bg-brand-copper text-white rounded-lg px-4 py-3 flex items-center gap-3 shadow-sm">
        <div className="flex items-center gap-2 shrink-0">
          <ShoppingBag className="w-4 h-4" />
          <span className="text-[11px] uppercase tracking-wider font-semibold">
            Active order
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">
            {active.company || active.name}
          </div>
          <div className="text-[11px] opacity-90 flex items-center gap-2">
            <span>
              {active.itemCount} item{active.itemCount === 1 ? "" : "s"}
            </span>
            {active.totalQuoted > 0 && (
              <>
                <span>·</span>
                <span>
                  {active.currency}{" "}
                  {active.totalQuoted.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </>
            )}
          </div>
        </div>
        <Link
          href={`/dashboard/pipeline?deal=${encodeURIComponent(active.dealId)}`}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-md text-xs font-medium transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open deal
        </Link>
        <button
          type="button"
          onClick={clear}
          className="flex items-center gap-1.5 px-2 py-1.5 bg-white/10 hover:bg-white/20 rounded-md text-xs transition-colors cursor-pointer"
          title="Done with this order"
        >
          <X className="w-3.5 h-3.5" />
          Done
        </button>
      </div>
    </div>
  );
};

export { ActiveOrderBanner };
