"use client";

import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";

type StageSelectorProps = {
  currentStage: string;
  stages: readonly string[];
  onChange: (newStage: string) => void | Promise<void>;
  disabled?: boolean;
  className?: string;
};

const StageSelector = ({
  currentStage,
  stages,
  onChange,
  disabled = false,
  className = "",
}: StageSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  const handleSelect = async (stage: string) => {
    if (stage === currentStage) {
      setOpen(false);
      return;
    }
    setPending(stage);
    try {
      await onChange(stage);
      setOpen(false);
    } finally {
      setPending(null);
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-dash-accent-soft text-dash-accent hover:bg-dash-accent/20 transition disabled:opacity-50"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{currentStage}</span>
        <ChevronDown size={12} className={open ? "rotate-180 transition" : "transition"} />
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <ul
            role="listbox"
            className="absolute z-50 mt-1 min-w-[200px] max-h-72 overflow-auto bg-dash-surface border border-dash-border rounded-lg shadow-lg py-1"
          >
            {stages.map((stage) => {
              const isCurrent = stage === currentStage;
              const isPending = pending === stage;
              return (
                <li key={stage}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isCurrent}
                    onClick={() => handleSelect(stage)}
                    disabled={isPending}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-dash-surface-2 transition ${
                      isCurrent ? "text-dash-accent font-medium" : "text-dash-text"
                    } ${isPending ? "opacity-50" : ""}`}
                  >
                    <span>{stage}</span>
                    {isCurrent ? <Check size={12} /> : null}
                    {isPending ? <span className="text-dash-text-muted">…</span> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </div>
  );
};

export { StageSelector };
export type { StageSelectorProps };
