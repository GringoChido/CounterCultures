/**
 * Strip Odoo-authored HTML to plain text for safe display.
 *
 * Odoo stores rich-text fields (`note`, `body`, etc.) as HTML. Rendering
 * that string directly leaks `<p style="…">` into the UI. Parse-as-text
 * via a textarea is XSS-safe (no scripts execute) and turns `&nbsp;` +
 * entities into real characters.
 */
export const stripHtml = (input: string | null | undefined): string => {
  if (!input) return "";
  const withBreaks = input
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*\/p\s*>/gi, "\n");
  // Strip remaining tags, then decode entities via DOMParser-free trick
  const stripped = withBreaks.replace(/<[^>]+>/g, "");
  if (typeof document !== "undefined") {
    const ta = document.createElement("textarea");
    ta.innerHTML = stripped;
    return ta.value.replace(/\n{3,}/g, "\n\n").trim();
  }
  // SSR fallback — decode the handful of common entities
  return stripped
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};
