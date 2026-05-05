"use client";

/**
 * <EmailBody /> — renders a Gmail message body. Prefers HTML when present
 * (gmail.ts already swaps cid: references for inline portal URLs), falls
 * back to plaintext snippet. HTML is sanitized with DOMPurify before
 * being injected via dangerouslySetInnerHTML — third-party email content
 * is untrusted by default.
 *
 * Sanitization config keeps semantic tags + img/a/table so layout-heavy
 * marketing emails still render, but strips script/iframe/object/embed,
 * inline event handlers, and non-http(s)/mailto/cid hrefs.
 */

import { useMemo } from "react";
import DOMPurify from "dompurify";

interface Props {
  bodyHtml: string | null;
  bodyText: string;
  fallbackSnippet: string;
}

const FORBID_ATTR = ["style"];

const sanitize = (html: string): string =>
  DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input"],
    FORBID_ATTR,
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ["target", "rel"],
  });

export const EmailBody = ({ bodyHtml, bodyText, fallbackSnippet }: Props) => {
  const cleanHtml = useMemo(() => {
    if (!bodyHtml) return null;
    if (typeof window === "undefined") return null; // DOMPurify needs DOM
    return sanitize(bodyHtml);
  }, [bodyHtml]);

  if (cleanHtml) {
    return (
      <div
        className="email-body text-sm text-dash-text leading-relaxed max-w-none [&_a]:text-brand-copper [&_a]:underline [&_a:hover]:text-brand-copper/80 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded [&_table]:max-w-full [&_table]:overflow-x-auto [&_blockquote]:border-l-2 [&_blockquote]:border-dash-border [&_blockquote]:pl-3 [&_blockquote]:text-dash-text-secondary [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />
    );
  }

  return (
    <div className="text-sm text-dash-text leading-relaxed whitespace-pre-wrap">
      {bodyText || fallbackSnippet || "(no body)"}
    </div>
  );
};
