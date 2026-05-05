"use client";

/**
 * Inbox surface for the vendor confirmation pattern (R2-6). When a thread's
 * sender matches a vendor in the Vendors sheet, render a chip telling Roger
 * what to expect: vendors that send confirmation emails get a positive chip
 * (this is probably that confirmation), vendors that don't get a muted chip
 * (no confirmation expected — this is something else).
 *
 * The fetch is cached at module level so a 50-thread inbox doesn't fire 50
 * requests; vendor terms change on the order of weeks.
 */

import { useEffect, useState } from "react";
import { CheckCircle2, MinusCircle } from "lucide-react";

interface VendorTermsLite {
  vendor: string;
  name: string;
  confirmationPattern: "sends-confirmation" | "no-confirmation";
}

let vendorsPromise: Promise<VendorTermsLite[]> | null = null;

const loadVendors = (): Promise<VendorTermsLite[]> => {
  if (vendorsPromise) return vendorsPromise;
  vendorsPromise = fetch("/api/dashboard/vendor-terms", { credentials: "include" })
    .then((r) => (r.ok ? r.json() : { vendors: [] }))
    .then((data: { vendors?: VendorTermsLite[] }) => data.vendors ?? [])
    .catch(() => []);
  return vendorsPromise;
};

const matchVendor = (
  sender: string,
  vendors: VendorTermsLite[]
): VendorTermsLite | null => {
  const target = sender.trim().toLowerCase();
  if (!target) return null;
  let best: { vendor: VendorTermsLite; score: number } | null = null;
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

interface VendorConfirmationChipProps {
  from: string;
  fromEmail?: string;
}

export const VendorConfirmationChip = ({
  from,
  fromEmail,
}: VendorConfirmationChipProps) => {
  const [match, setMatch] = useState<VendorTermsLite | null>(null);

  useEffect(() => {
    let alive = true;
    loadVendors().then((vendors) => {
      if (!alive) return;
      const haystack = `${from} ${fromEmail ?? ""}`;
      setMatch(matchVendor(haystack, vendors));
    });
    return () => {
      alive = false;
    };
  }, [from, fromEmail]);

  if (!match) return null;

  if (match.confirmationPattern === "sends-confirmation") {
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-dash-success/10 text-dash-success"
        title={`${match.name} sends confirmation emails — this thread may be that confirmation`}
      >
        <CheckCircle2 className="w-2.5 h-2.5" />
        confirmation expected
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-dash-text-muted/10 text-dash-text-secondary"
      title={`${match.name} doesn't send confirmation emails — this thread is unlikely to be a PO confirmation`}
    >
      <MinusCircle className="w-2.5 h-2.5" />
      no confirmation
    </span>
  );
};
