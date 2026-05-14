"use client";

import { useState, useRef, useEffect } from "react";
import { Check, Plus } from "lucide-react";
import {
  CONTACT_CLASSIFICATIONS,
  CLASSIFICATION_COLORS,
  type ContactClassification,
} from "@/app/lib/contact-classifications";
import { ClassificationBadge } from "./classification-badge";

interface ClassificationPickerProps {
  value: ContactClassification[];
  onChange: (next: ContactClassification[]) => void;
  disabled?: boolean;
}

const ClassificationPicker = ({
  value,
  onChange,
  disabled,
}: ClassificationPickerProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const toggle = (c: ContactClassification) => {
    const next = value.includes(c)
      ? value.filter((v) => v !== c)
      : [...value, c];
    onChange(next);
  };

  return (
    <div ref={ref} className="relative">
      <div className="flex flex-wrap items-center gap-1.5">
        {value.length === 0 ? (
          <button
            type="button"
            onClick={() => !disabled && setOpen(!open)}
            disabled={disabled}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-dash-text-muted border border-dashed border-dash-border hover:border-dash-accent hover:text-dash-accent transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-3 h-3" />
            Unclassified
          </button>
        ) : (
          <>
            {value.map((c) => (
              <ClassificationBadge key={c} classification={c} />
            ))}
            <button
              type="button"
              onClick={() => !disabled && setOpen(!open)}
              disabled={disabled}
              className="inline-flex items-center justify-center w-5 h-5 rounded-full text-dash-text-muted border border-dashed border-dash-border hover:border-dash-accent hover:text-dash-accent transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Edit classifications"
            >
              <Plus className="w-3 h-3" />
            </button>
          </>
        )}
      </div>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-50 w-56 bg-dash-surface border border-dash-border rounded-lg shadow-lg py-1">
          {CONTACT_CLASSIFICATIONS.map((c) => {
            const selected = value.includes(c);
            const colors = CLASSIFICATION_COLORS[c];
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggle(c)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-dash-surface-2 transition-colors text-left cursor-pointer"
              >
                <span
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    selected
                      ? `${colors.bg} ${colors.text} border-current`
                      : "border-dash-border"
                  }`}
                >
                  {selected && <Check className="w-3 h-3" />}
                </span>
                <span className={selected ? "font-medium" : "text-dash-text-secondary"}>
                  {c}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export { ClassificationPicker };
