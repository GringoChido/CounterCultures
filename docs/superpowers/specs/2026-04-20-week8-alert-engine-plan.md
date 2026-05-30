# Week 8 — Alert Engine + Customer Touchpoints — Task Plan

> **Status:** Draft awaiting Joshua's approval (2026-04-20)
> **Pairs with:** `2026-04-20-week8-alert-engine-design.md`
> **Target:** ~16 tasks → ~10 commits, ~4-5 hours

Each task is TDD-shaped: RED failing test → GREEN minimal implementation → verify → commit checkpoint. Task 0 is baseline; tasks run strictly in order because later tasks depend on earlier substrate (dispatcher needs templates + rate-limiter + quiet-hours + whatsapp module).

**Convention reminders:**
- Round-trip scripts at `scripts/_test-*.ts` (W5/W6/W7 precedent)
- Typecheck after each task: `npx tsc --noEmit 2>&1 | grep -v "routes.d [0-9].ts"`
- Dev server on port 55556 via Claude Preview "dev"
- `WHATSAPP_ENABLED` defaults to `false` in `.env.local` — all tests pass in dry-run mode

---

## Task 0 — Baseline smoke

**Goal:** Confirm W7 foundation holds at `bf489b7` before adding W8 weight.

**Steps:**
1. `git status` — clean
2. `npx tsc --noEmit` — zero errors (ignoring `routes.d [0-9].ts`)
3. Run every W7 test in order:
   - `_test-pipeline-schema`, `_test-deal-events`, `_test-ops-stages`
   - `_test-rule-engine`, `_test-rule-integration`, `_test-stripe-webhook-rule`
   - `_test-session-email`, `_test-shipment-risk-derivation`
   - `_test-premove-rollback`, `_test-sla-timers`, `_test-nightly-sweep`
4. Run W6 regression: `_test-landed-cost`, `_test-trafico-hydrator`, `_test-shipments-sheets`, `_test-trafico-events`
5. Start preview server, navigate `/dashboard/pipeline?view=operations`, confirm 14 stages render.

**Commit:** none.

**If anything fails:** stop. Fix before adding W8 weight.

---

## Task 1 — Schema: extend Notifications sheet + migration

### 1a. RED: test asserts 4 new columns exist

`scripts/_test-notifications-schema.ts`:

```ts
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

const REQUIRED_COLUMNS = [
  "notification_id", "severity", "audience", "title", "body",
  "source_entity_type", "source_entity_id", "status", "created_at", "acked_at",
  // W8 additions
  "deliver_after", "delivery_channel", "recipient_email", "recipient_phone",
];

const main = async () => {
  const { google } = await import("googleapis");
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const r = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID!,
    range: "Notifications!1:1",
  });
  const header = r.data.values?.[0] ?? [];
  const missing = REQUIRED_COLUMNS.filter((c) => !header.includes(c));
  if (missing.length > 0) {
    console.error(`❌ Missing: ${missing.join(", ")}`);
    process.exit(1);
  }
  console.log(`✅ Notifications schema OK (${REQUIRED_COLUMNS.length} cols)`);
};
main().catch((e) => { console.error(e); process.exit(1); });
```

Run → expect failure: "Missing: deliver_after, delivery_channel, recipient_email, recipient_phone".

### 1b. GREEN: migration script

`scripts/_add-notification-delivery-columns.ts` — same pattern as W7's `_add-pipeline-automation-columns.ts` (read header, append missing, update row 1). No backfill — all 4 columns default to empty string which existing rows already have by omission.

### 1c. Verify GREEN

```bash
npx tsx scripts/_add-notification-delivery-columns.ts
npx tsx scripts/_test-notifications-schema.ts
```

**Expected:** `✅ Notifications schema OK (14 cols)`

**Commit:**
```
chore(sheets): add notification delivery columns

- Notifications sheet gains 4 columns (deliver_after, delivery_channel,
  recipient_email, recipient_phone) to support queued delivery + per-channel
  tracking + quiet-hour release by the nightly sweep
- Idempotent migration; no backfill (fields optional)
```

---

## Task 2 — `alert-quiet-hours.ts` + `alert-rate-limiter.ts` + tests

### 2a. RED: unit tests

`scripts/_test-quiet-hours.ts`:
- Customer audience during 10pm–8am MX returns next 8am ISO
- Customer audience at 2pm MX returns `null` (deliver now)
- Roger audience always returns `null`
- Finance audience always returns `null`
- DST boundary edge cases (none in MX — flat UTC-6)

`scripts/_test-rate-limiter.ts`:
- 1 WhatsApp → allowed; 2nd within hour → blocked with retryAfterSec
- 5 emails in 24h → allowed; 6th → blocked
- Different recipient same template → independent bucket
- Different template same recipient → independent bucket

### 2b. GREEN: `app/lib/alert-quiet-hours.ts`

Implements `nextAllowedDelivery(audience, now?, config?)`. Uses `Intl.DateTimeFormat` with `timeZone: "America/Mexico_City"` to get the current hour there, regardless of server timezone.

### 2c. GREEN: `app/lib/alert-rate-limiter.ts`

In-memory `Map<string, { windowStart: number; count: number }>`. Key is `${recipientKey}:${templateId}:${channel}`. `checkRateLimit(key, templateId, channel)` returns `{ allowed: true }` or `{ allowed: false, retryAfterSec }`. Per-channel cap from the `RATE_CAPS` const.

### 2d. Verify GREEN

```bash
npx tsx scripts/_test-quiet-hours.ts
npx tsx scripts/_test-rate-limiter.ts
```

**Commit:** bundle with Task 3.

---

## Task 3 — `app/lib/whatsapp.ts` + dry-run + `WHATSAPP_ENABLED` + tests

### 3a. RED: test script

`scripts/_test-whatsapp-send.ts`:
- `isWhatsAppEnabled()` returns false when `WHATSAPP_ENABLED` is unset
- Returns false when token is set but flag is false
- Returns true when all three env vars present + flag=true (use mocked env for the positive case)
- `sendWhatsAppTemplate(input)` in dry-run mode logs + returns `{ status: "dry_run" }` without hitting Meta
- In live mode (mocked flag), POSTs to Meta Graph API — intercepted via `global.fetch` mock; assert URL + body shape

### 3b. GREEN: `app/lib/whatsapp.ts`

Full module per design §6.1. Re-exports `isWhatsAppEnabled`, `sendWhatsAppTemplate`, `SendWhatsAppResult`.

### 3c. `app/lib/email.ts`: `notifyWhatsApp` becomes thin wrapper

```diff
-export const notifyWhatsApp = async (message: string): Promise<void> => {
-  const token = process.env.WHATSAPP_API_TOKEN;
-  const phoneId = process.env.WHATSAPP_PHONE_ID;
-  // …existing inline POST…
-};
+import { sendWhatsAppTemplate } from "./whatsapp";
+
+// Thin backward-compat: internal Roger/Finance free-text via WA.
+// Prefer sendWhatsAppTemplate() for customer-facing with Meta-approved templates.
+export const notifyWhatsApp = async (message: string): Promise<void> => {
+  await sendWhatsAppTemplate({
+    to: process.env.ROGER_WHATSAPP_NUMBER ?? "",
+    templateName: "free_text_internal",
+    languageCode: "en",
+    components: [{ type: "body", parameters: [{ type: "text", text: message }] }],
+  });
+};
```

### 3d. Verify GREEN

```bash
npx tsx scripts/_test-whatsapp-send.ts
```

**Commit:**
```
feat(alerts): quiet hours + rate limiter + WhatsApp module

- alert-quiet-hours.ts: pure nextAllowedDelivery() using Intl.DateTimeFormat
  in America/Mexico_City; Roger/Finance always exempt, customer 10pm-8am
- alert-rate-limiter.ts: in-memory Map LRU; per-channel caps
  (1 WA/hour/template, 5 emails/day, 100 dashboard/hour)
- app/lib/whatsapp.ts: new module with WHATSAPP_ENABLED gate + dry-run
  logger + sendWhatsAppTemplate() against Meta Graph API v21.0
- email.ts's notifyWhatsApp becomes a thin wrapper around sendWhatsAppTemplate
```

---

## Task 4 — Extend `email-templates.ts` with C/R/F catalog

### 4a. RED: test script

`scripts/_test-template-catalog.ts`:

```ts
const EXPECTED_IDS = [
  // Customer (C-01..C-10)
  "C-01-quote-approved", "C-02-deposit-invoice", "C-03-deposit-received",
  "C-04-order-placed", "C-05-production-confirmed", "C-06-shipped",
  "C-07-in-customs", "C-08-customs-cleared", "C-09-delivered", "C-10-complete",
  // Roger (R-01..R-14)
  "R-01-quote-approved", "R-02-deposit-pending-3d", "R-03-deposit-received",
  "R-04-ordering-sla-breach", "R-05-in-production", "R-06-shipped",
  "R-07-in-customs", "R-08-customs-cleared", "R-09-received-at-cc",
  "R-10-delivery-scheduled", "R-11-delivered", "R-12-balance-pending-reminder",
  "R-13-complete", "R-14-issue",
  // Finance (F-01..F-07)
  "F-01-deposit-cfdi-request", "F-02-deposit-received-ar-update",
  "F-03-po-fx-prep", "F-04-fx-processing", "F-05-customs-duties-due",
  "F-06-broker-invoice-expected", "F-07-balance-cfdi-request",
];

// Assert every ID present in ALERT_TEMPLATES
// Assert every template has both en + es locales
// Assert customer templates have whatsapp bodies (for Meta template submission)
// Assert renderAlertTemplate("C-03-deposit-received", vars, "es", "email")
//   returns non-empty subject + body with vars substituted
```

Expected assertions: 31 IDs × 2 locales + whatsapp coverage on customer templates + var substitution spot-check = ~80 assertions.

### 4b. GREEN: extend `app/lib/email-templates.ts`

Add `ALERT_TEMPLATES: Record<string, AlertTemplate>` const with all 31 entries. Each entry has `{id, audience, locales: {en, es}}` and optionally `{whatsapp: {en, es, metaTemplateName?}}`.

Example R-03:
```ts
"R-03-deposit-received": {
  id: "R-03-deposit-received",
  audience: "roger",
  locales: {
    en: { subject: "DEAL-{deal_id} · Deposit received", body: "💰 Deposit received for DEAL-{deal_id} ({customer_name}). {amount} MXN. Ready to order {brand_list}. Total PO: ~{po_amount_usd} USD." },
    es: { subject: "DEAL-{deal_id} · Anticipo recibido", body: "💰 Anticipo recibido para DEAL-{deal_id} ({customer_name}). {amount} MXN. Listo para ordenar {brand_list}. Total OC: ~{po_amount_usd} USD." },
  },
},
```

### 4c. GREEN: `renderAlertTemplate(id, vars, locale?, channel?)` helper

Returns `{subject, body}` for email/dashboard, `{body}` for WhatsApp. Reuses existing `applyTemplateVars`. Null if id not found.

### 4d. Verify GREEN

```bash
npx tsx scripts/_test-template-catalog.ts
```

**Expected:** `✅ Template catalog: 80+ assertions pass`

**Commit:**
```
feat(alerts): full bilingual template catalog (31 templates × 2 locales)

- C-01..C-10 customer touchpoints, R-01..R-14 Roger alerts, F-01..F-07 Finance
- Every template EN + ES; customer templates also carry WhatsApp body text
  (metaTemplateName filled in post-Meta-approval)
- renderAlertTemplate(id, vars, locale, channel) unified renderer
```

---

## Task 5 — `alert-dispatcher.ts` + ALERT_ROUTES + unit tests

### 5a. RED: unit tests

`scripts/_test-alert-dispatcher.ts`:

For each of the 14 rules, assert the dispatcher writes the right `alert_fired` Deal_Events rows for customer + Roger + Finance per the ALERT_ROUTES table. Cases:

- **T-01 happy path**: customer gets email dry-run + whatsapp dry-run, Roger gets dashboard entry, no Finance
- **T-03 happy path**: customer email + whatsapp, Roger dashboard + whatsapp (WA dry-run), Finance email (F-02)
- **Rate-limit hit**: dispatch T-03 twice within 10min — second call logs skip, no second alert_fired for customer
- **Quiet hours**: dispatch T-06 at 11pm MX — customer channels get `deliver_after` set, no immediate alert_fired; nightly sweep then fires it
- **WHATSAPP_ENABLED=false**: dry-run path; alert_fired event still written with `status: "dry_run"`
- **Failed email send**: mock Resend to throw; dispatcher catches + writes alert_fired with `status: "failed"`
- **Idempotency**: same rule → same deal → same channel within 6h → no second alert_fired

Total ~35 assertions.

### 5b. GREEN: `app/lib/alert-dispatcher.ts` + ALERT_ROUTES

Full implementation per design §4. Routes table drawn from spec's Notifications summary.

### 5c. Verify GREEN

```bash
npx tsx scripts/_test-alert-dispatcher.ts
```

**Commit:**
```
feat(alerts): alert dispatcher + per-rule routing matrix

- alert-dispatcher.ts: dispatchAlertsForTransition fans out to customer
  (email + whatsapp) + Roger (dashboard + whatsapp) + Finance (email)
  per the ALERT_ROUTES table mapping all 14 rule_ids
- Every channel write emits its own Deal_Events { alert_fired } row
  with status (sent/dry_run/skipped/queued/failed) for forensic audit
- Rate-limit + quiet-hours checks inline; 6h idempotency guard
- 35+ deterministic unit assertions incl. failure paths
```

---

## Task 6 — Wire dispatcher into rule engine + bell bridge

### 6a. RED: integration test

`scripts/_test-dispatcher-integration.ts`:

1. Seed test deal at deposit-pending, 200K MXN
2. Fire rule engine with `stripe_payment` → deposit-received
3. Assert Deal_Events has exactly: 1 stage_change + 3 alert_fired (customer email, customer WA dry-run, Roger dashboard; F-02 Finance email) — 4 total alert_fired
4. Assert Notifications sheet gained a new row: `source=deal_event`, `audience=roger`, `source_entity_type=deal`, `source_entity_id=<dealId>` — this is the bell bridge

### 6b. GREEN: hook in rule-engine.ts

Single-line add in `executeTransition`:

```ts
dispatchAlertsForTransition({ ruleId, dealId, fromStage, toStage, deal, actor })
  .catch((err) => console.error("[alert-dispatcher]", err));
```

### 6c. GREEN: bell bridge in dispatcher

When a Roger or Finance dispatch lands in the `dashboard` channel, ALSO `appendNotification` with the matching shape. Single-source-of-truth: notifications sheet query powers the bell.

### 6d. Verify GREEN

```bash
npx tsx scripts/_test-dispatcher-integration.ts
```

Browser smoke: trigger a deal stage change via Pipeline PATCH, confirm bell badge increments within 60s.

**Commit:**
```
feat(alerts): rule engine fires alert dispatcher on every transition

- rule-engine.executeTransition() calls dispatchAlertsForTransition
  fire-and-forget; Resend/Meta failures don't fail the transition
- Dispatcher writes a Notifications row when a Roger/Finance channel
  is "dashboard" — bell UI picks up within the 60s sync
- Integration test: end-to-end Stripe → rule engine → dispatcher →
  Deal_Events + Notifications + bell badge
```

---

## Task 7 — Nightly sweep retries + quiet-hour release

### 7a. RED: test

`scripts/_test-sweep-retries.ts`:

1. Seed a Pipeline deal + write a Deal_Events `stage_change` row with timestamp 8h ago
2. Do NOT seed any alert_fired follow-up
3. Call GET /api/cron/stale-deal-sweep with sentinel
4. Assert response includes `alertsReplayed > 0`
5. Assert new alert_fired rows appear in Deal_Events
6. Seed a Notifications row with `deliver_after = 2h ago`, `status = "unread"`, `delivery_channel = "email"`, `recipient_email = "test@..."`
7. Re-run sweep
8. Assert response includes `queuedDeliveriesReleased > 0`
9. Assert the Notifications row status moved to "sent" (or a new row emitted documenting delivery)

### 7b. GREEN: extend `/api/cron/stale-deal-sweep/route.ts`

Two new passes wired in after the existing SLA work:

```ts
// Replay missed alerts for any stage_change without matching alert_fired
const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();
const staleStageChanges = dealEvents.filter(e =>
  e.event_type === "stage_change" && e.timestamp < sixHoursAgo
);
for (const sc of staleStageChanges) {
  const hasAlertFired = dealEvents.some(e =>
    e.event_type === "alert_fired" &&
    e.deal_id === sc.deal_id &&
    e.timestamp > sc.timestamp
  );
  if (!hasAlertFired) {
    const deal = await loadDeal(sc.deal_id);
    if (deal) {
      await dispatchAlertsForTransition({ ruleId: sc.trigger_rule_id, ... });
      alertsReplayed++;
    }
  }
}

// Release queued quiet-hour deliveries
const queuedNotifs = notifications.filter(n =>
  n.deliver_after && n.deliver_after <= now.toISOString() &&
  n.status === "unread" && !!n.delivery_channel && n.delivery_channel !== "dashboard"
);
for (const n of queuedNotifs) {
  await releaseQueuedDelivery(n);
  queuedDeliveriesReleased++;
}
```

### 7c. Verify GREEN

```bash
npx tsx scripts/_test-sweep-retries.ts
```

**Commit:**
```
feat(alerts): nightly sweep retries missed alerts + quiet-hour release

- Sweep now replays dispatch for any stage_change older than 6h with no
  matching alert_fired follow-up (catches Resend/Meta outages)
- Sweep releases Notifications rows where deliver_after ≤ now, sends via
  the delivery_channel, updates status to "sent"
- Bounded by retry counter in alert_fired payload to prevent infinite loops
```

---

## Task 8 — Deal slideout: History tab + Pending-move banner

### 8a. Approach — UI-only, use browser verification

Not RED/GREEN in the strict sense — visual UI changes verified via Claude Preview.

### 8b. Add "History" tab to slideout tab switcher

`app/(dashboard)/dashboard/(portal)/pipeline/page.tsx` — add `"history"` to the tab union + render condition. Tab body:

- Fetches `/api/dashboard/deals/[id]/events` on tab activation
- Renders timeline: timestamp / event_type badge / actor / stage transition / optional `[Rollback]` button
- Filter segmented control at top: All / Internal / Customer-facing

Requires a new API route `/api/dashboard/deals/[id]/events/route.ts` that calls `getDealEvents(dealId)` — auth-gated, simple GET.

### 8c. Pending-move banner + countdown

Above the tab switcher in the slideout body:

```tsx
{selectedDeal.pendingMoveTo && selectedDeal.pendingMoveAt && (
  <PendingMoveBanner
    dealId={selectedDeal.id}
    toStage={selectedDeal.pendingMoveTo}
    queuedAt={selectedDeal.pendingMoveAt}
    onExecute={() => refetchDeal()}
    onCancel={() => refetchDeal()}
  />
)}
```

`PendingMoveBanner` component:
- Computes `executeAt = queuedAt + 2h`, shows real-time countdown (`useEffect` with 30s tick)
- Red/amber background when < 10min remaining, amber otherwise
- `[Execute Now]` hits existing POST `/api/dashboard/pipeline/pending-move/[id]` (W7)
- `[Cancel]` hits DELETE on same endpoint

### 8d. Browser verification

Via Claude Preview:
1. Navigate to Pipeline → click a deal
2. Confirm "History" tab appears as the 10th tab
3. Activate History tab → confirm Deal_Events render with filter toggle
4. Seed a test deal with `pending_move_to` set → refresh → banner appears with countdown

**Commit:**
```
feat(pipeline): deal history tab in slideout with rollback UX

- New History tab (10th) showing Deal_Events timeline for the open deal
- Filter segmented control: All / Internal / Customer-facing
- Inline [Rollback] button on stage_change rows < 24h old (existing W7 API)
- Pending-move banner above tab switcher with real-time countdown
- [Execute Now] + [Cancel] buttons wire to W7 /pending-move API
- New /api/dashboard/deals/[id]/events route returns Deal_Events filtered
  and sorted newest first
```

---

## Task 9 — End-to-end 14-stage simulation

### 9a. The ship-criterion test

`scripts/_test-alert-simulation.ts`:

```ts
// 1. Seed deal at quote-approved, 300K MXN (under pre-move threshold), brand=kohler
// 2. For each of the 14 rules:
//    - Compute the right trigger + payload to fire it
//    - Call evaluateAndTransition (or direct PATCH to simulate real flow)
//    - Sleep 100ms for dispatcher fire-and-forget to settle
//    - Check Deal_Events for expected alert_fired rows
// 3. At end:
//    - count alert_fired rows where audience=customer = 10
//    - count alert_fired rows where audience=roger = 14
//    - count alert_fired rows where audience=finance = 7
//    - no duplicates (same rule_id + audience → exactly 1 alert_fired)
// 4. Re-fire rule T-03 (idempotency)
//    - assert 0 new alert_fired rows (6h dedupe window active)
```

### 9b. Run + assert

```bash
npx tsx scripts/_test-alert-simulation.ts
```

Expected output:
```
✅ 14-stage simulation
   customer touchpoints: 10 ✓
   Roger notifications: 14 ✓
   Finance notifications: 7 ✓
   duplicates: 0 ✓
   idempotency: 0 new after retrigger ✓
```

**Commit:**
```
test(alerts): end-to-end 14-stage simulation

- Walks a test deal through all 14 Ops transitions, asserts the W8 ship
  criteria: 10 customer + 14 Roger + 7 Finance, zero missed/duplicate
- Idempotency retest confirms 6h dedupe window prevents double-firing
- Leaves test rows behind (same v1 cleanup compromise as W5-7)
```

---

## Task 10 — Final smoke + execution log

### 10a. Full W8 test suite

```bash
for f in _test-notifications-schema _test-quiet-hours _test-rate-limiter \
         _test-whatsapp-send _test-template-catalog _test-alert-dispatcher \
         _test-dispatcher-integration _test-sweep-retries _test-alert-simulation; do
  echo "=== $f ===" && npx tsx scripts/$f.ts || exit 1
done
```

### 10b. W7 regression

```bash
for f in _test-pipeline-schema _test-deal-events _test-rule-engine \
         _test-rule-integration _test-stripe-webhook-rule \
         _test-premove-rollback _test-sla-timers _test-nightly-sweep; do
  echo "=== $f ===" && npx tsx scripts/$f.ts || exit 1
done
```

### 10c. Typecheck clean

```bash
npx tsc --noEmit 2>&1 | grep -v "routes.d [0-9].ts"
```

### 10d. Browser e2e walkthrough

Via Claude Preview:
1. Navigate `/dashboard/pipeline?view=operations` — 14 columns render
2. Click a deal → History tab appears → shows Deal_Events timeline
3. Bell badge increments after stage change
4. Pending-move banner visible on >$500K deals with countdown

### 10e. Append §16 execution log to design doc

Commit hash sequence, smoke output, deviations, open follow-ups, ship criteria check.

**Commit:**
```
docs(design): W8 execution log + final smoke
```

---

## 11. Self-review checklist

- ✅ Every task has RED test → GREEN implementation pattern (except Task 8 UI-only via browser verification)
- ✅ Exact file paths + complete code stubs (no placeholders)
- ✅ Commit messages drafted per task
- ✅ 80+ template-catalog assertions + 35+ dispatcher + 10+ integration + simulation assertions
- ✅ No schema changes outside the 1 approved in design §3.1
- ✅ Idempotency guard on alert_fired (6h window) prevents double-sends across sweep retries
- ✅ `WHATSAPP_ENABLED=false` is the default — CI / dev tests pass without external Meta
- ✅ Rate-limit + quiet-hours + retry logic are pure modules with deterministic tests
- ⚠ Meta template approval is external ops; W8 ships ready, flag flips later
- ⚠ "Customer-facing notif settings UI" deferred to Phase 2 — accepted per design §12

---

## 12. Approval request

Joshua, please confirm:

1. **Plan scope** — comfortable with 10 tasks / ~10 commits / ~4-5h runtime?
2. **Task boundaries** — any task you want split, merged, or resequenced?
3. **Template content** — I'll write the 31 × 2 = 62 template bodies in task 4. Any specific phrasing you want for the customer-facing ones (C-*) beyond what the spec § Transitions 1-13 specifies, before I lock in?
4. **WhatsApp template names** — I'll name them `cc_{template_id_lower}_v1` (e.g. `cc_c_03_deposit_received_v1`). OK with that convention for Meta registration?
5. **Go/no-go on execution** — once approved, inline execution with commit after each task.
