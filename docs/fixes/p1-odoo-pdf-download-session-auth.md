# p1 — Make the Odoo PDF download actually work (session cookie + /report/pdf)

**Read `AGENTS.md` first, then execute. One branch, one commit.** Replaces the broken `30ea8ad` approach.

## Why the current code fails
`app/api/dashboard/odoo-report/route.ts:51-56` calls `ir.actions.report._render_qweb_pdf` via `execute_kw`. Odoo's external API **rejects any method whose name starts with `_`** (private methods can't be called remotely — true on SaaS and self-hosted). So it always throws → `odoo_pdf_unavailable` → the "use Print Preview" toast. No PDF ever comes back.

## The working approach
Do what a browser does — establish a **web session**, then hit Odoo's **report controller**:
1. `POST {ODOO_URL}/web/session/authenticate` with `{ params: { db, login, password } }` where **password = the API key** (Odoo ≥14 accepts an API key wherever a password is expected, incl. web-session auth). Response JSON has `result.uid` (truthy on success) and a `Set-Cookie: session_id=…`.
2. `GET {ODOO_URL}/report/pdf/{report}/{recordId}` with header `Cookie: session_id=…`. Returns the rendered PDF bytes (`Content-Type: application/pdf`).

Env vars already exist (`app/lib/odoo/client.ts:1-4`): `ODOO_URL`, `ODOO_DB`, `ODOO_USERNAME`, `ODOO_API_KEY`. Netlify runs Node 22, so `Response.headers.getSetCookie()` is available.

## Replace the `try` block in `route.ts` (lines 45-81) with roughly:
```ts
const ODOO_URL = process.env.ODOO_URL ?? "";
const ODOO_DB = process.env.ODOO_DB ?? "";
const ODOO_LOGIN = process.env.ODOO_USERNAME ?? "";
const ODOO_API_KEY = process.env.ODOO_API_KEY ?? "";
const ODOO_PASSWORD = process.env.ODOO_PASSWORD ?? ""; // optional fallback (see "If auth fails")

const fail = (detail: string) =>
  NextResponse.json({ error: "odoo_pdf_unavailable", detail }, { status: 502 });

try {
  // 1) Establish a web session — API key as password; fall back to real password if provided.
  const tryAuth = async (password: string) => {
    const r = await fetch(`${ODOO_URL}/web/session/authenticate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", params: { db: ODOO_DB, login: ODOO_LOGIN, password } }),
    });
    const j = await r.json().catch(() => null);
    return { uid: j?.result?.uid, setCookies: r.headers.getSetCookie?.() ?? [] };
  };

  let { uid, setCookies } = await tryAuth(ODOO_API_KEY);
  if (!uid && ODOO_PASSWORD) ({ uid, setCookies } = await tryAuth(ODOO_PASSWORD));
  if (!uid) {
    console.warn("[odoo-report] web-session auth returned no uid");
    return fail("web session auth failed (API key not accepted for /web/session/authenticate)");
  }

  const sessionCookie =
    setCookies.find((c) => c.startsWith("session_id="))?.split(";")[0];
  if (!sessionCookie) return fail("no session_id cookie returned");

  // 2) Fetch the rendered PDF with the session cookie.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);
  let pdfRes: Response;
  try {
    pdfRes = await fetch(`${ODOO_URL}/report/pdf/${report}/${recordId}`, {
      headers: { Cookie: sessionCookie },
      signal: controller.signal,
    });
  } finally { clearTimeout(timer); }

  const ct = pdfRes.headers.get("content-type") ?? "";
  if (!pdfRes.ok || !ct.includes("application/pdf")) {
    console.warn("[odoo-report] report fetch not a pdf:", pdfRes.status, ct);
    return fail(`report fetch ${pdfRes.status} ${ct || "no content-type"}`);
  }

  const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());
  return new Response(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${report}-${id}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
} catch (err) {
  console.error("[odoo-report] Error:", err instanceof Error ? err.message : err);
  return fail(err instanceof Error ? err.message : "Unknown error");
}
```
Keep the existing `ALLOWED_REPORTS` allow-list + the early validation. You can drop the now-unused `authenticate`/`execute` imports (keep `isConfigured`). The existing button already shows the graceful "use Print Preview" toast on `odoo_pdf_unavailable`, so any failure path stays safe.

## If auth fails (the one real risk)
The only uncertainty is whether **this SaaS instance accepts the API key for `/web/session/authenticate`**. The `result.uid` check tells us immediately:
- **uid present →** it works; PDF downloads. Done.
- **uid null/false →** the instance wants a real password for web sessions. Add `ODOO_PASSWORD` (the API user's actual password) to Netlify env; the code already falls back to it. (Don't print it anywhere; it's read from env only.)
- If web-session login is blocked entirely (unlikely), the button keeps falling back to Print Preview — which now produces the corrected template from `a1de0a8`, so there's always a clean PDF path.

## Confirm the report name
`ALLOWED_REPORTS` lists `sale.report_saleorder` (standard quotation report). If Counter Cultures uses a **custom** quotation report in Odoo, its `report_name` differs — verify in Odoo → Settings → Technical → Reports (or read `ir.actions.report` for the sale.order report via the existing client) and use that exact name so the downloaded PDF matches Roger's reference (logo, bank-deposit block, etc.).

## Acceptance criteria
- Clicking the download button on **S01856** (and S00179, S01840) returns Odoo's actual PDF — the same layout Roger validated — not a toast.
- A bad/forbidden report or a failed auth still returns `odoo_pdf_unavailable` → graceful toast (no crash, no HTML-as-PDF).

## Verification
- `npm run build` green.
- Deploy, then download a real order's PDF; confirm `Content-Type: application/pdf` and the content matches the Odoo reference.
- Check the function log: `result.uid` is present (auth path that worked: API key vs password).

## Sacred Surface / §0
Read-only report fetch; additive; no pricing/cart/factura change. **§0 YES (Joshua, 2026-05-27 — requested this).** Never log secret values (api key / password / session cookie).

## Rollback
Revert the commit; isolated to `app/api/dashboard/odoo-report/route.ts`.
