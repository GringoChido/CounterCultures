"use client";

/**
 * <EmailTemplatePicker /> — dropdown that injects a bilingual email
 * template into a Compose or Reply form. Auto-fills `{user_first_name}`
 * + `{user_full_name}` from the connected Gmail address; leaves all
 * other `{vars}` as bracketed placeholders for Roger to fill before
 * sending.
 *
 * Two modes:
 *   - `mode="compose"` — replaces both subject + body
 *   - `mode="reply"`   — replaces body only (subject is fixed by thread)
 */

import { useEffect, useRef, useState } from "react";
import { ChevronDown, FileText } from "lucide-react";
import {
  EMAIL_TEMPLATES,
  TEMPLATE_LABELS,
  applyTemplate,
  guessFirstNameFromEmail,
  guessFullNameFromEmail,
  type TemplateId,
  type TemplateLocale,
} from "@/app/lib/email-templates";

interface BaseProps {
  userEmail: string | undefined;
  className?: string;
}

interface ComposeProps extends BaseProps {
  mode: "compose";
  onApply: (next: { subject: string; body: string }) => void;
}

interface ReplyProps extends BaseProps {
  mode: "reply";
  onApply: (next: { body: string }) => void;
}

type Props = ComposeProps | ReplyProps;

const TEMPLATE_IDS: TemplateId[] = [
  "quote-follow-up",
  "deposit-reminder",
  "shipment-update",
  "delay-notice",
  "delivery-scheduled",
];

export const EmailTemplatePicker = (props: Props) => {
  const { userEmail, className = "", mode } = props;
  const [open, setOpen] = useState(false);
  const [locale, setLocale] = useState<TemplateLocale>("en");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const insert = (id: TemplateId) => {
    const tpl = EMAIL_TEMPLATES.find((t) => t.id === id && t.locale === locale);
    if (!tpl) return;
    const applied = applyTemplate(tpl, {
      user_first_name: guessFirstNameFromEmail(userEmail),
      user_full_name: guessFullNameFromEmail(userEmail),
    });
    if (mode === "compose") {
      props.onApply({ subject: applied.subject, body: applied.body });
    } else {
      props.onApply({ body: applied.body });
    }
    setOpen(false);
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium border border-dash-border rounded-lg text-dash-text-secondary hover:text-brand-copper hover:border-brand-copper/40 transition-colors cursor-pointer"
        title="Insert a template (auto-fills your name; bracketed variables are placeholders for you to fill before sending)"
      >
        <FileText className="w-3 h-3" />
        Templates
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <div className="absolute z-50 right-0 mt-1 w-72 bg-dash-surface border border-dash-border rounded-lg shadow-2xl overflow-hidden">
          <div className="flex border-b border-dash-border">
            <button
              type="button"
              onClick={() => setLocale("en")}
              className={`flex-1 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
                locale === "en"
                  ? "bg-brand-copper/10 text-brand-copper"
                  : "text-dash-text-secondary hover:bg-dash-bg"
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLocale("es")}
              className={`flex-1 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
                locale === "es"
                  ? "bg-brand-copper/10 text-brand-copper"
                  : "text-dash-text-secondary hover:bg-dash-bg"
              }`}
            >
              Español
            </button>
          </div>
          <ul className="py-1 max-h-80 overflow-y-auto">
            {TEMPLATE_IDS.map((id) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => insert(id)}
                  className="w-full text-left px-3 py-2 text-xs text-dash-text hover:bg-dash-bg cursor-pointer"
                >
                  {TEMPLATE_LABELS[id][locale]}
                </button>
              </li>
            ))}
          </ul>
          <div className="px-3 py-2 text-[10px] text-dash-text-secondary border-t border-dash-border bg-dash-bg/40">
            Bracketed {"{vars}"} are placeholders — replace before sending.
          </div>
        </div>
      )}
    </div>
  );
};
