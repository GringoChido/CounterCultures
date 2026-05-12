"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Check, UserPlus } from "lucide-react";
import { useDebouncedFetch } from "@/app/lib/use-debounced-fetch";

interface CustomerHit {
  id: string;
  name: string;
  display_name?: string;
  email?: string;
  city?: string;
}

interface CustomerComboboxProps {
  value: string;
  onChange: (value: string, matched?: CustomerHit) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

/**
 * Typeahead picker over /api/dashboard/customers (Odoo partners).
 * Lets Roger avoid typos and duplicate customer entries on walk-in deals
 * by suggesting existing partners that match what he's typing.
 *
 * Users can still type a brand-new company name — if no hit is picked,
 * the raw text is returned and treated as a new customer.
 */
const CustomerCombobox = ({
  value,
  onChange,
  placeholder,
  autoFocus,
  className = "",
}: CustomerComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [matchedId, setMatchedId] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const trimmed = value.trim();
  const fetchUrl =
    open && trimmed.length >= 2
      ? `/api/dashboard/customers?q=${encodeURIComponent(trimmed)}&limit=8&sort=name&type=customer`
      : null;
  const { data: hitsResponse, loading } = useDebouncedFetch<{
    customers?: CustomerHit[];
    rows?: CustomerHit[];
  }>(fetchUrl, 200);
  const hits: CustomerHit[] = (hitsResponse?.customers ?? hitsResponse?.rows ?? []).slice(0, 8);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const select = (hit: CustomerHit) => {
    setMatchedId(hit.id);
    onChange(hit.display_name || hit.name, hit);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <input
        autoFocus={autoFocus}
        type="text"
        value={value}
        onChange={(e) => {
          setMatchedId(null);
          onChange(e.target.value);
          if (!open) setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg text-dash-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-1 focus:ring-brand-copper"
        autoComplete="off"
      />
      {matchedId && (
        <span
          className="absolute right-2 top-1/2 -translate-y-1/2 text-dash-success pointer-events-none"
          title="Matches existing customer"
        >
          <Check className="w-4 h-4" />
        </span>
      )}
      {loading && !matchedId && (
        <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-text-secondary animate-spin" />
      )}

      {open && value.trim().length >= 2 && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-dash-surface border border-dash-border rounded-lg shadow-lg max-h-[280px] overflow-y-auto">
          {hits.length > 0 ? (
            hits.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => select(h)}
                className="w-full text-left px-3 py-2 text-xs border-b border-dash-border/60 last:border-b-0 hover:bg-dash-bg transition-colors cursor-pointer"
              >
                <div className="font-medium text-dash-text truncate">
                  {h.display_name || h.name}
                </div>
                <div className="text-[10px] text-dash-text-secondary mt-0.5 flex items-center gap-2">
                  {h.city && <span>{h.city}</span>}
                  {h.email && <span className="truncate">{h.email}</span>}
                </div>
              </button>
            ))
          ) : loading ? (
            <div className="px-3 py-3 text-xs text-dash-text-secondary text-center">
              Searching…
            </div>
          ) : (
            <div className="px-3 py-2 text-xs text-dash-text-secondary flex items-center gap-2">
              <UserPlus className="w-3.5 h-3.5" />
              No existing customer matches — "<span className="text-dash-text">{value}</span>" will be created as new.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { CustomerCombobox };
