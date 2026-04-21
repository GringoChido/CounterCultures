/**
 * W8 catalog test — ALERT_TEMPLATES must have all 31 IDs × 2 locales.
 *
 *   - 10 customer (C-01..C-10) with bilingual subject+body AND WhatsApp body
 *   - 14 Roger (R-01..R-14) with bilingual subject+body (no WhatsApp
 *     requirement — Roger gets dashboard first, WhatsApp free-text optional)
 *   - 7 Finance (F-01..F-07) with bilingual subject+body
 *   - renderAlertTemplate() substitutes vars correctly per channel
 *
 * Run: npx tsx scripts/_test-template-catalog.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

const EXPECTED = {
  customer: [
    "C-01-quote-approved", "C-02-deposit-invoice", "C-03-deposit-received",
    "C-04-order-placed", "C-05-production-confirmed", "C-06-shipped",
    "C-07-in-customs", "C-08-customs-cleared", "C-09-delivered", "C-10-complete",
  ],
  roger: [
    "R-01-quote-approved", "R-02-deposit-pending-3d", "R-03-deposit-received",
    "R-04-ordering-sla-breach", "R-05-in-production", "R-06-shipped",
    "R-07-in-customs", "R-08-customs-cleared", "R-09-received-at-cc",
    "R-10-delivery-scheduled", "R-11-delivered", "R-12-balance-pending-reminder",
    "R-13-complete", "R-14-issue",
  ],
  finance: [
    "F-01-deposit-cfdi-request", "F-02-deposit-received-ar-update",
    "F-03-po-fx-prep", "F-04-fx-processing", "F-05-customs-duties-due",
    "F-06-broker-invoice-expected", "F-07-balance-cfdi-request",
  ],
};

let passed = 0, failed = 0;
const assert = (cond: unknown, msg: string) => {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.error(`  ❌ ${msg}`); }
};

const main = async () => {
  const mod = await import("../app/lib/email-templates");
  const ALERT_TEMPLATES = (mod as unknown as {
    ALERT_TEMPLATES: Record<string, {
      id: string;
      audience: "customer" | "roger" | "finance";
      locales: { en: { subject: string; body: string }; es: { subject: string; body: string } };
      whatsapp?: { en: string; es: string; metaTemplateName?: string };
    }>;
  }).ALERT_TEMPLATES;
  const renderAlertTemplate = (mod as unknown as {
    renderAlertTemplate: (
      id: string,
      vars: Record<string, string | number>,
      locale?: "en" | "es",
      channel?: "email" | "whatsapp" | "dashboard"
    ) => { subject: string; body: string } | { body: string } | null;
  }).renderAlertTemplate;

  // Catalog shape
  console.log("\n→ Catalog shape");
  const expectedTotal = EXPECTED.customer.length + EXPECTED.roger.length + EXPECTED.finance.length;
  assert(Object.keys(ALERT_TEMPLATES).length >= expectedTotal, `>= ${expectedTotal} templates (got ${Object.keys(ALERT_TEMPLATES).length})`);

  // Every ID present
  console.log("\n→ Customer templates (C-01..C-10)");
  for (const id of EXPECTED.customer) {
    const t = ALERT_TEMPLATES[id];
    assert(!!t, `${id} exists`);
    if (!t) continue;
    assert(t.audience === "customer", `${id} audience=customer`);
    assert(t.locales.en.subject.length > 0 && t.locales.en.body.length > 0, `${id} has EN`);
    assert(t.locales.es.subject.length > 0 && t.locales.es.body.length > 0, `${id} has ES`);
    assert(!!t.whatsapp && t.whatsapp.en.length > 0 && t.whatsapp.es.length > 0, `${id} has WhatsApp bodies`);
  }

  console.log("\n→ Roger templates (R-01..R-14)");
  for (const id of EXPECTED.roger) {
    const t = ALERT_TEMPLATES[id];
    assert(!!t, `${id} exists`);
    if (!t) continue;
    assert(t.audience === "roger", `${id} audience=roger`);
    assert(t.locales.en.body.length > 0, `${id} has EN body`);
    assert(t.locales.es.body.length > 0, `${id} has ES body`);
  }

  console.log("\n→ Finance templates (F-01..F-07)");
  for (const id of EXPECTED.finance) {
    const t = ALERT_TEMPLATES[id];
    assert(!!t, `${id} exists`);
    if (!t) continue;
    assert(t.audience === "finance", `${id} audience=finance`);
    assert(t.locales.en.subject.length > 0 && t.locales.en.body.length > 0, `${id} EN`);
    assert(t.locales.es.subject.length > 0 && t.locales.es.body.length > 0, `${id} ES`);
  }

  // renderAlertTemplate var substitution
  console.log("\n→ renderAlertTemplate var substitution");
  {
    const r = renderAlertTemplate(
      "C-03-deposit-received",
      { project_name: "Casa Atelier", brand_list: "Kohler, Dornbracht", eta_delivered: "2026-05-30" },
      "es",
      "email"
    );
    assert(r !== null, `returns non-null`);
    if (r && "subject" in r) {
      assert(r.subject.length > 0, `subject populated`);
      assert(!r.body.includes("{project_name}"), `{project_name} substituted`);
      assert(r.body.includes("Casa Atelier"), `project_name value present`);
    }
  }

  console.log("\n→ renderAlertTemplate channel=whatsapp returns body only");
  {
    const r = renderAlertTemplate(
      "C-06-shipped",
      { project_name: "Test", brand_list: "Kohler", tracking_link: "https://example.com/track", eta_border: "2026-05-01" },
      "en",
      "whatsapp"
    );
    assert(r !== null, `non-null`);
    if (r) {
      assert("body" in r, `has body`);
      assert(!("subject" in r) || !(r as { subject?: string }).subject, `no subject for whatsapp`);
    }
  }

  console.log("\n→ renderAlertTemplate missing id → null");
  {
    const r = renderAlertTemplate("DOES-NOT-EXIST", {});
    assert(r === null, `returns null for unknown id`);
  }

  console.log(`\n${failed === 0 ? "✅" : "❌"} template catalog: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
};

main().catch((e) => { console.error("\n❌ FAILED:", e?.stack || e?.message || e); process.exit(1); });
