"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";

export interface ChatToolChipProps {
  name: string;
  status: "running" | "ok" | "error";
  input?: unknown;
  preview?: string;
}

const tone = {
  running: "bg-brand-copper/5 border-brand-copper/20 text-brand-copper",
  ok: "bg-dash-bg border-dash-border text-dash-text-secondary",
  error: "bg-dash-danger/5 border-dash-danger/20 text-dash-danger",
} as const;

export const ChatToolChip = ({
  name,
  status,
  input,
  preview,
}: ChatToolChipProps) => {
  const [open, setOpen] = useState(false);

  const inputStr =
    typeof input === "object" && input !== null
      ? JSON.stringify(input, null, 2)
      : String(input ?? "");

  return (
    <div
      className={`text-[10px] rounded border ${tone[status]}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-2 py-1 flex items-center gap-1.5 cursor-pointer text-left"
      >
        {open ? (
          <ChevronDown className="w-2.5 h-2.5 opacity-60 shrink-0" />
        ) : (
          <ChevronRight className="w-2.5 h-2.5 opacity-60 shrink-0" />
        )}
        <span className="opacity-60">🔧</span>
        <span className="font-mono">{name}</span>
        {status === "running" && (
          <Loader2 className="w-2.5 h-2.5 animate-spin" />
        )}
        {preview && status === "ok" && (
          <span className="opacity-70 truncate">· {preview.slice(0, 60)}</span>
        )}
      </button>
      {open && (
        <div className="border-t border-current/10 px-2 py-1.5 space-y-1">
          {inputStr && inputStr !== "{}" && (
            <div>
              <p className="opacity-60 text-[9px] uppercase tracking-wider mb-0.5">
                Input
              </p>
              <pre className="font-mono text-[10px] whitespace-pre-wrap break-all">
                {inputStr}
              </pre>
            </div>
          )}
          {preview && (
            <div>
              <p className="opacity-60 text-[9px] uppercase tracking-wider mb-0.5">
                Result
              </p>
              <pre className="font-mono text-[10px] whitespace-pre-wrap break-all">
                {preview}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
