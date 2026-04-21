/**
 * Unit test for whatsapp module — isWhatsAppEnabled + sendWhatsAppTemplate
 * in dry-run and live (mocked fetch) modes.
 *
 * Run: npx tsx scripts/_test-whatsapp-send.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

let passed = 0, failed = 0;
const assert = (cond: unknown, msg: string) => {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.error(`  ❌ ${msg}`); }
};

const main = async () => {
  // Reset any ambient env first so feature-detection is clean
  const origEnabled = process.env.WHATSAPP_ENABLED;
  const origToken = process.env.WHATSAPP_API_TOKEN;
  const origPhone = process.env.WHATSAPP_PHONE_ID;

  delete process.env.WHATSAPP_ENABLED;
  delete process.env.WHATSAPP_API_TOKEN;
  delete process.env.WHATSAPP_PHONE_ID;

  const { isWhatsAppEnabled, sendWhatsAppTemplate } = await import("../app/lib/whatsapp");

  // ----- Feature detection -----
  console.log("\n→ isWhatsAppEnabled() feature detection");
  assert(isWhatsAppEnabled() === false, `no env vars → false`);
  process.env.WHATSAPP_API_TOKEN = "test_token";
  process.env.WHATSAPP_PHONE_ID = "12345";
  assert(isWhatsAppEnabled() === false, `token+phone set but no flag → false`);
  process.env.WHATSAPP_ENABLED = "true";
  assert(isWhatsAppEnabled() === true, `all three → true`);
  process.env.WHATSAPP_ENABLED = "false";
  assert(isWhatsAppEnabled() === false, `flag=false → false`);

  // ----- Dry-run: logs + returns dry_run without hitting network -----
  console.log("\n→ sendWhatsAppTemplate() dry-run path");
  {
    delete process.env.WHATSAPP_ENABLED;
    const r = await sendWhatsAppTemplate({
      to: "+5214150000000",
      templateName: "cc_test_v1",
      languageCode: "en",
      components: [{ type: "body", parameters: [{ type: "text", text: "hi" }] }],
    });
    assert(r.status === "dry_run", `status=dry_run (got ${r.status})`);
  }

  // ----- Live path: mock global fetch, assert URL + body shape -----
  console.log("\n→ sendWhatsAppTemplate() live path (mocked fetch)");
  {
    process.env.WHATSAPP_ENABLED = "true";
    process.env.WHATSAPP_API_TOKEN = "t_abc";
    process.env.WHATSAPP_PHONE_ID = "phone_xyz";

    let lastCall: { url?: string; body?: unknown; auth?: string | null } = {};
    const origFetch = global.fetch;
    global.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      lastCall.url = String(url);
      lastCall.body = init?.body ? JSON.parse(init.body as string) : null;
      lastCall.auth = (init?.headers as Record<string, string>)?.Authorization ?? null;
      return new Response(
        JSON.stringify({ messages: [{ id: "wamid.ABC123" }] }),
        { status: 200 }
      );
    }) as typeof fetch;

    try {
      const r = await sendWhatsAppTemplate({
        to: "+5214151112222",
        templateName: "cc_c_03_deposit_received_v1",
        languageCode: "es_MX",
        components: [
          { type: "body", parameters: [{ type: "text", text: "Proyecto X" }] },
        ],
      });
      assert(r.status === "sent", `status=sent (got ${r.status})`);
      assert(r.messageId === "wamid.ABC123", `messageId captured`);
      assert(lastCall.url?.includes("/v21.0/phone_xyz/messages"), `correct URL (got ${lastCall.url})`);
      assert(lastCall.auth === "Bearer t_abc", `bearer header`);
      const body = lastCall.body as { type?: string; to?: string; template?: { name?: string; language?: { code?: string } } };
      assert(body.type === "template", `body.type=template`);
      assert(body.to === "+5214151112222", `body.to carries the recipient`);
      assert(body.template?.name === "cc_c_03_deposit_received_v1", `template.name`);
      assert(body.template?.language?.code === "es_MX", `language code`);
    } finally {
      global.fetch = origFetch;
    }
  }

  // ----- Live path: Meta returns 400 → returns "failed" not throws -----
  console.log("\n→ sendWhatsAppTemplate() handles Meta 400 gracefully");
  {
    const origFetch = global.fetch;
    global.fetch = (async () =>
      new Response(
        JSON.stringify({ error: { message: "template not approved" } }),
        { status: 400 }
      )) as typeof fetch;
    try {
      const r = await sendWhatsAppTemplate({
        to: "+5214151112222",
        templateName: "unapproved_v1",
        languageCode: "en",
      });
      assert(r.status === "failed", `status=failed on 400`);
      assert(!!r.error, `error message captured`);
    } finally {
      global.fetch = origFetch;
    }
  }

  // Restore env
  if (origEnabled === undefined) delete process.env.WHATSAPP_ENABLED;
  else process.env.WHATSAPP_ENABLED = origEnabled;
  if (origToken === undefined) delete process.env.WHATSAPP_API_TOKEN;
  else process.env.WHATSAPP_API_TOKEN = origToken;
  if (origPhone === undefined) delete process.env.WHATSAPP_PHONE_ID;
  else process.env.WHATSAPP_PHONE_ID = origPhone;

  console.log(`\n${failed === 0 ? "✅" : "❌"} whatsapp: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
};

main().catch((e) => { console.error("\n❌ FAILED:", e?.stack || e?.message || e); process.exit(1); });
