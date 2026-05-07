"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Check, Search, X } from "lucide-react";
import { SAT_CODES, searchSATCodes, type SATCode } from "@/app/lib/sat-codes";

interface SATCodeComboboxProps {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
}

const SATCodeCombobox = ({ value, onChange, disabled }: SATCodeComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hits = useMemo(
    () => (query ? searchSATCodes(query, 12) : SAT_CODES.slice(0, 12)),
    [query]
  );

  const selected = useMemo(
    () => (value ? SAT_CODES.find((c) => c.code === value) : undefined),
    [value]
  );

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const pick = (code: SATCode) => {
    onChange(code.code);
    setOpen(false);
  };

  const clear = () => {
    onChange("");
    setOpen(false);
  };

  if (disabled) {
    return (
      <div className="text-xs text-dash-text-secondary">
        {selected ? (
          <span>
            <span className="font-mono">{selected.code}</span>{" "}
            <span className="text-dash-text-secondary">{selected.description}</span>
          </span>
        ) : (
          "—"
        )}
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs bg-dash-bg border border-dash-border rounded-lg text-left hover:border-brand-copper/50 transition-colors cursor-pointer"
      >
        {selected ? (
          <>
            <span className="font-mono text-dash-text shrink-0">{selected.code}</span>
            <span className="text-dash-text-secondary truncate flex-1">
              {selected.description}
            </span>
            <X
              className="w-3.5 h-3.5 text-dash-text-secondary hover:text-dash-text shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                clear();
              }}
            />
          </>
        ) : (
          <span className="text-dash-text-secondary flex-1">Assign SAT code…</span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-dash-surface border border-dash-border rounded-lg shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-dash-border">
            <Search className="w-3.5 h-3.5 text-dash-text-secondary shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by code or description…"
              className="flex-1 text-xs bg-transparent text-dash-text placeholder:text-dash-text-secondary/60 focus:outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {hits.length === 0 ? (
              <div className="px-3 py-4 text-xs text-dash-text-secondary text-center">
                No matching SAT codes
              </div>
            ) : (
              hits.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => pick(c)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-dash-bg transition-colors cursor-pointer ${
                    value === c.code ? "bg-brand-copper/5" : ""
                  }`}
                >
                  <span className="font-mono text-dash-text shrink-0 w-[72px]">
                    {c.code}
                  </span>
                  <span className="text-dash-text-secondary truncate flex-1">
                    {c.description}
                  </span>
                  {value === c.code && (
                    <Check className="w-3.5 h-3.5 text-brand-copper shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export { SATCodeCombobox };
