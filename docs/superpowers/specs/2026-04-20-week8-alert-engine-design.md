# Week 8 — Alert Engine + Customer Touchpoints — Design Doc

> **Status:** Draft awaiting Joshua's approval (2026-04-20)
> **Workflow:** superpowers/Phase 1 design
> **Implements:** W8 of `MASTER_BUILD_ROADMAP.md` (lines 286-302) + `PIPELINE_AUTOMATION_SPEC.md` §Notifications summary table
> **Builds on:** W7 rule engine (`2026-04-20-week7-pipeline-automation-design.md`), W4 email templates (`app/lib/email-templates.ts`)

---

## 1. Context — what exists, what W8 adds

### What already works

- **`app/lib/notifications.ts`** (330 lines) — full `Notifications` sheet-backed store with `appendNotification` / `listNotifications` / `ackNotification` / `syncNotificationsFromSources`. 60s in-memory throttle on sync. 3 existing sync sources: customs holds, overdue leads, shipment delays.
- **Dashboard bell UI** (`notification-bell.tsx`, 155 lines) — renders in header, 60s polling, badge cap at 9+, ack-on-click, deep-links to entity pages.
- **`app/lib/email-templates.ts`** — 5 bilingual EN/ES templates: quote-follow-up, deposit-reminder, shipment-update, delay-notice, delivery-scheduled. `applyTemplate(template, vars)` returns `{subject, body}`.
- **`app/lib/email.ts`** (Resend-based) — `notifyRoger`, `sendDocument`, typed per-surface senders.
- **`notifyWhatsApp(message)` stub** — POSTs to Meta Graph API v21.0 with `WHATSAPP_API_TOKEN` + `WHATSAPP_PHONE_ID`. No approval flag, no template-based messaging, no session-window detection, no opt-in tracking.
- **W7 rule engine** — writes `Deal_Events` on every transition. Today emits nothing to customer/Roger/Finance.

### What W8 ships

- **`alert-dispatcher.ts`** — called from the rule engine after every transition, fans out to customer (email + WhatsApp if enabled) + Roger + Finance per the spec's Notifications matrix.
- **Full template catalog** — extend `email-templates.ts` with the missing C-06/07/08/09/10 customer templates, plus all 14 Roger (R-*) and 7 Finance (F-*) alert templates. Bilingual EN/ES throughout.
- **Rate limiter + quiet hours** — customer-facing sends: 10pm–8am MX queued to next 8am; per-customer caps (1 WhatsApp/hour/template, 5 emails/day).
- **WhatsApp live path** — templated messages via Meta Graph API. `WHATSAPP_ENABLED` env flag gates dry-run logger vs. actual send. Once Meta approves the templates out-of-band, Joshua flips the flag — zero code change.
- **Nightly sweep extension** — retries any `stage_change` without a matching `alert_fired` follow-up within 6h (catches Resend/Meta outages).
- **W7 UI follow-ups** — pending-move banner + new "History" tab in the deal slideout with real-time countdown + one-click Rollback, filtered view toggle for internal vs. customer-facing events.
- **Dashboard bell extension** — R-*/F-* alerts feed into the 4th source (`deal_event`), surface alongside customs/leads/shipment feeds.
- **End-to-end simulation test** — seeds a test deal, walks all 14 Ops stages, asserts the ship criteria: 10 customer touchpoints + 14 Roger notifications + 7 Finance notifications with zero missed/duplicate.

---

## 2. Decisions locked

| # | Question | Answer |
|---|---|---|
| 1 | WhatsApp approval status | **(b) Applied, pending.** `WHATSAPP_ENABLED` flag; templates as code constants; Meta template approval is a parallel ops task, not a code blocker. |
| 2 | Template storage | Hardcoded EN/ES in `email-templates.ts`. `Templates` sheet for in-portal editing is Phase 2 polish. |
| 3 | Alert firing architecture | **Hybrid.** Fire-and-forget inline dispatcher called from rule engine; nightly sweep retries missed deliveries. |
| 4 | Rate limiter + quiet hours | Customer channels only. 10pm–8am MX queue, caps per recipient. Roger/Finance exempt. |
| 5 | Dashboard bell extension | R-*/F-* alerts also write to `Notifications` sheet. Customer-facing alerts do NOT — they're for the customer, not the operator. |
| 6 | W7 UI follow-ups | Pending-move banner + new "History" tab with rollback + filter toggle. |
| 7 | Customer notif history | Integrated into the History tab (audit trail + customer-facing messages interleaved). |

---

## 3. Schema changes — explicit approval required

### 3.1 `Notifications` sheet — add 4 columns

| Column | Type | Purpose |
|---|---|---|
| `deliver_after` | ISO timestamp \| "" | When the notification is eligible for delivery. Populated by quiet-hours queuer; nightly sweep processes anything `deliver_after ≤ now`. |
| `delivery_channel` | "email" \| "whatsapp" \| "dashboard" \| "" | Which channel this notification is meant for. `dashboard` entries are bell-only (no out-of-band delivery). |
| `recipient_email` | string \| "" | For email channels. Empty for dashboard-only. |
| `recipient_phone` | E.164 string \| "" | For WhatsApp channels. Empty otherwise. |

**Migration:** `scripts/_add-notification-delivery-columns.ts` — idempotent header-check + column-append. No backfill needed (new fields are optional).

### 3.2 `Deal_Events` — no schema change; alert_fired reuses payload_json

Existing `event_type = "alert_fired"` already supported; no new columns needed. Payload JSON carries `{channel, template_id, recipient, dry_run: bool}`.

### 3.3 Optional (deferred): `Whatsapp_Opt_In` sheet

Meta Business API requires explicit customer opt-in for business-initiated messages outside a 24h session window. W8 design acknowledges this but defers the sheet + tracking until `WHATSAPP_ENABLED=true` — i.e. when Joshua confirms approval. For W8 ship, the opt-in check is a pure predicate that always returns `true` in dry-run mode.

---

## 4. Alert dispatcher architecture

### 4.1 Public surface

```ts
// app/lib/alert-dispatcher.ts

export interface AlertDispatchInput {
  ruleId: string;              // "T-03-deposit-received"
  dealId: string;
  fromStage: PipelineStage;
  toStage: PipelineStage;
  deal: PipelineDeal;          // hydrated, so we have customer + brand slugs
  actor: string;               // from rule engine
}

export interface AlertDispatchResult {
  customer: { email: "sent" | "queued" | "skipped" | "failed"; whatsapp?: "sent" | "queued" | "skipped" | "failed" };
  roger: "sent" | "skipped" | "failed";
  finance?: "sent" | "skipped" | "failed";
  alertEventIds: string[];    // Deal_Events rows written
}

export const dispatchAlertsForTransition = async (
  input: AlertDispatchInput
): Promise<AlertDispatchResult>;
```

### 4.2 Matrix from spec §Notifications summary

For each of the 14 rules, the dispatcher looks up:

```ts
// internal to alert-dispatcher.ts
interface AlertRoute {
  ruleId: string;
  customer?: { templateId: string; channels: ("email" | "whatsapp")[] };
  roger?: { templateId: string; channels: ("dashboard" | "whatsapp" | "email")[] };
  finance?: { templateId: string; channels: ("email")[] };
}

const ALERT_ROUTES: AlertRoute[] = [ /* 14 entries */ ];
```

Drawn directly from the spec's table. Example:

```ts
{
  ruleId: "T-03-deposit-received",
  customer: {
    templateId: "C-03-deposit-received",
    channels: ["email", "whatsapp"],
  },
  roger: { templateId: "R-03-deposit-received", channels: ["dashboard", "whatsapp"] },
  finance: { templateId: "F-02-odoo-ar-update", channels: ["email"] },
}
```

### 4.3 Delivery path — per recipient

```
for each recipient (customer/roger/finance):
  for each channel (email/whatsapp/dashboard):
    1. Check rate limit (recipient + template_id)
       → if cap hit, log + skip this channel
    2. Check quiet hours (customer only; Roger/Finance exempt)
       → if in quiet hours, write Notifications row with deliver_after=next_8am + channel
       → nightly sweep picks it up
    3. Check WHATSAPP_ENABLED flag (whatsapp channel only)
       → if false, log dry-run + skip (don't fail)
       → if true, POST to Meta Graph API with template
    4. If email channel:
       → Resend send
    5. If dashboard channel:
       → write Notifications row (source="deal_event")
    6. Write Deal_Events { event_type: "alert_fired", payload: { channel, template_id, recipient, status } }
```

Every channel gets its own `alert_fired` event. Failures do not propagate to the rule engine — dispatcher is `fire-and-forget` from the rule engine path (`.catch(console.error)`).

### 4.4 Rate limiter

```ts
// app/lib/alert-rate-limiter.ts

export interface RateLimitBucket {
  recipientKey: string;        // "customer:joshua@untold.works" or "roger@..." or "finance@..."
  templateId: string;
  windowStart: number;         // epoch ms
  count: number;
}

// Per-channel caps (per recipient per template within the stated window)
export const RATE_CAPS = {
  whatsapp: { max: 1, windowMs: 60 * 60 * 1000 },        // 1/hour
  email: { max: 5, windowMs: 24 * 60 * 60 * 1000 },      // 5/day
  dashboard: { max: 100, windowMs: 60 * 60 * 1000 },     // effectively unlimited
} as const;

export const checkRateLimit(
  recipientKey: string,
  templateId: string,
  channel: keyof typeof RATE_CAPS
): { allowed: true } | { allowed: false; retryAfterSec: number };
```

In-memory Map (same pattern as W7's Stripe idempotency LRU). Bounded cleanup every 10min. Persistence across deploys is not required — a restart briefly doubles the cap, which is acceptable.

### 4.5 Quiet hours

```ts
// app/lib/alert-quiet-hours.ts

export interface QuietHoursConfig {
  startHour: number;           // 22 (10pm)
  endHour: number;             // 8 (8am)
  timezone: string;            // "America/Mexico_City"
}

export const DEFAULT_QUIET_HOURS: QuietHoursConfig = {
  startHour: 22, endHour: 8, timezone: "America/Mexico_City",
};

/**
 * Returns null if delivery is allowed now, or the ISO timestamp of the next
 * allowed delivery window (8am MX of the current or next day).
 */
export const nextAllowedDelivery = (
  audience: "customer" | "roger" | "finance",
  now: Date = new Date(),
  config: QuietHoursConfig = DEFAULT_QUIET_HOURS
): string | null;
```

Roger/Finance always returns null (exempt). Customer returns null during hours, or the next 8am MX timestamp during quiet hours.

---

## 5. Template catalog — extending `email-templates.ts`

W8 adds **31 new templates × 2 languages = 62 strings** on top of the existing 5 W4 templates. Each template is `{subject, body}` for email, or `{body}` for WhatsApp/dashboard.

### 5.1 Missing customer templates (C-01 through C-10)

Per spec §Transitions 1–13. Already have: quote-follow-up (C-01-ish), deposit-reminder (C-02), shipment-update (ambiguous — fits C-01/C-02), delay-notice (generic), delivery-scheduled (C-05).

Gaps to fill:
- **C-01-quote-approved** — thanks + deposit heads-up
- **C-02-deposit-invoice** — invoice attached + pay link + bank wire details
- **C-03-deposit-received** — order going out
- **C-04-order-placed** — PO placed with {brand_list}
- **C-05-production-confirmed** — ETA {production_eta}
- **C-06-shipped** — tracking + ETA border
- **C-07-in-customs** — at border, duties processing, ETA clearance
- **C-08-customs-cleared** — in domestic transit
- **C-09-delivered** — POD + final invoice + photos
- **C-10-complete** — thank you + testimonial ask

### 5.2 Roger alerts (R-01 through R-14)

All route to `dashboard` + `whatsapp` (when `WHATSAPP_ENABLED`). Dashboard only for W7 ship. Bodies are terse, scannable.

- **R-01-quote-approved** — deal ready, deposit pending
- **R-02-deposit-pending-3d** — reminder (nightly sweep, not rule transition)
- **R-03-deposit-received** — ready to order {brand_list}
- **R-04-ordering-sla-breach** — brand not confirmed in 3d
- **R-05-in-production** — countdown days
- **R-06-shipped** — monitor customs prep
- **R-07-in-customs** — NOM status + broker + days to ETA
- **R-08-customs-cleared** — moving to warehouse
- **R-09-received-at-cc** — ready to schedule delivery
- **R-10-delivery-scheduled** — calendar entry
- **R-11-delivered** — final invoice auto-generating
- **R-12-balance-pending-reminder** — nightly sweep
- **R-13-complete** — testimonial prompt
- **R-14-issue** — flag + recommended action

### 5.3 Finance alerts (F-01 through F-07)

Email-only. More detailed bodies (include amounts + pedimento).

- **F-01-deposit-cfdi-request** — generate deposit CFDI
- **F-02-deposit-received-ar-update** — AR sync
- **F-03-po-fx-prep** — prep FX payment
- **F-04-fx-processing** — FX payment in flight
- **F-05-customs-duties-due** — duties + IVA + pedimento
- **F-06-broker-invoice-expected** — incoming broker invoice
- **F-07-balance-cfdi-request** — generate balance CFDI

### 5.4 Template definition shape

```ts
// app/lib/email-templates.ts (extended)

export interface AlertTemplate {
  id: string;                         // "C-03-deposit-received"
  audience: "customer" | "roger" | "finance";
  locales: {
    en: { subject: string; body: string };
    es: { subject: string; body: string };
  };
  whatsapp?: {                        // optional WhatsApp body (Meta template name required for approval)
    en: string;
    es: string;
    metaTemplateName?: string;        // filled in post-Meta-approval
  };
}

export const ALERT_TEMPLATES: Record<string, AlertTemplate>;
```

The existing `applyTemplate()` + `applyTemplateVars()` helpers already handle placeholder substitution. Extended signature:

```ts
export const renderAlertTemplate = (
  id: string,
  vars: Record<string, string | number>,
  locale: "en" | "es" = "en",
  channel: "email" | "whatsapp" | "dashboard" = "email"
): { subject: string; body: string } | { body: string } | null;
```

---

## 6. WhatsApp send path

### 6.1 New module `app/lib/whatsapp.ts`

Refactors `notifyWhatsApp` out of `email.ts`. New public surface:

```ts
export const isWhatsAppEnabled = (): boolean =>
  process.env.WHATSAPP_ENABLED === "true" &&
  !!process.env.WHATSAPP_API_TOKEN &&
  !!process.env.WHATSAPP_PHONE_ID;

export interface SendWhatsAppTemplateInput {
  to: string;                    // E.164
  templateName: string;          // Meta-registered name (e.g. "cc_deposit_received_v1")
  languageCode: "en" | "es_MX";
  components?: Array<{ type: "body"; parameters: Array<{ type: "text"; text: string }> }>;
}

export interface SendWhatsAppResult {
  status: "sent" | "dry_run" | "failed";
  error?: string;
  messageId?: string;
}

export const sendWhatsAppTemplate = async (
  input: SendWhatsAppTemplateInput
): Promise<SendWhatsAppResult>;
```

Dry-run behavior when `WHATSAPP_ENABLED=false`:
```
[WhatsApp DRY RUN] to={to} template={templateName} vars={components}
```
Returns `{ status: "dry_run" }` — dispatcher still writes the `alert_fired` event, letting the end-to-end test pass regardless of Meta approval status.

### 6.2 Backward compat

`email.ts`'s `notifyWhatsApp(message)` stays but becomes a thin wrapper around `sendWhatsAppTemplate` for free-text internal alerts (Roger/Finance), bypassing the template requirement. Still goes through the `WHATSAPP_ENABLED` flag.

---

## 7. Rule engine integration

### 7.1 Hook point

`app/lib/rule-engine.ts` — `executeTransition()` currently writes `Deal_Events { stage_change }` and returns. Add one line after the write:

```diff
  const event = await appendDealEvent({ /* stage_change */ });

+ // W8: fire alert dispatcher fire-and-forget — failures log but don't
+ // propagate. Every channel gets its own alert_fired Deal_Events row.
+ dispatchAlertsForTransition({
+   ruleId: rule.id,
+   dealId: deal.id,
+   fromStage: deal.stage,
+   toStage: rule.toStage,
+   deal,
+   actor,
+ }).catch((err) => console.error("[alert-dispatcher] failed:", err));

  return { type: "moved", ... };
```

### 7.2 Same hook in `pending-move` execution

When Roger clicks "Execute Now" or the nightly sweep commits a queued pending_move, the same dispatcher fires — one `executeStoredPendingMove()` path feeds both cases.

### 7.3 Intentionally NO hook from `pending_move` queueing

Queuing a pending_move is an internal operator state, not a milestone. Dispatcher fires only on actual stage changes.

---

## 8. Nightly sweep extension

Existing W7 sweep at `/api/cron/stale-deal-sweep` gains two passes:

### 8.1 Retry missed alerts

```
for each Deal_Events { event_type: "stage_change" } older than 6h:
  count alert_fired follow-ups with same deal_id and recency
  if gaps exist (e.g. expected channels didn't fire):
    re-invoke dispatchAlertsForTransition() with the original payload
```

Catches Resend/Meta outages. Bounded by a retry counter stored on the dispatched event's payload.

### 8.2 Release queued quiet-hour deliveries

```
for each Notifications row where deliver_after ≤ now AND status = "unread":
  resolve delivery_channel + recipient and actually send
  update status to "sent"
```

Runs at the same 8am MX tick. No separate cron needed.

---

## 9. UI — W7 follow-ups + alert history

### 9.1 Deal slideout — new "History" tab

Tab switcher currently has 9 tabs (Details, Line Items, Payments, POs, Shipments, Customs, Landed Cost, P&L, Docs). Add **"History"** as the 10th.

Content: scrollable list of `Deal_Events` for this deal (via `getDealEvents(dealId)`), newest first. Each entry shows:
- Timestamp (relative, e.g. "2h ago")
- Event type icon + label
- Actor (email or "system"/"stripe")
- Stage transition if applicable (`from_stage → to_stage`)
- `[Rollback]` button visible for 24h on `stage_change` events (calls existing W7 API)

**Filter toggle** (segmented control at top): All / Internal / Customer-facing. "Customer-facing" filters to `alert_fired` events where the `payload_json` audience was "customer".

### 9.2 Pending-move banner

Rendered above the tab switcher when `deal.pendingMoveTo` is set. Shows:
- Target stage + time remaining until auto-execute (real-time countdown)
- `[Execute Now]` (primary) + `[Cancel]` (secondary) buttons wired to existing W7 APIs

Countdown is a client-side `useEffect` with 30s tick (countdown precision isn't critical; the server-side 2h check is authoritative).

### 9.3 Bell dropdown unchanged

Already working — `syncNotificationsFromSources()` gets one new branch for `deal_event` (R-*/F-* alerts routed to dashboard channel). The bell picks it up automatically on the next 60s poll.

---

## 10. End-to-end simulation test

Ship criterion: "Simulated deal generates 10 customer touchpoints, 14 Roger notifications, 7 Finance notifications. Zero missed or duplicate alerts."

Test script `scripts/_test-alert-simulation.ts`:

```
1. Seed a test deal at stage=quote-approved, 300K MXN (under pre-move threshold)
2. Loop through each rule in order:
   - Provide the right trigger + payload to fire the next transition
   - Assert dispatch result: customer channels fired, Roger fired, Finance fired
   - Count events per audience
3. At end:
   - customer touchpoints = 10 (one per customer-visible stage)
   - Roger dashboard entries = 14 (one per transition)
   - Finance email events = 7 (only transitions where spec says Finance gets notified)
4. Rate-limit check:
   - Re-trigger the same rule within the window
   - Assert: 0 additional customer sends, 0 additional Roger (dashboard unlimited), 0 Finance
```

All assertions deterministic. `WHATSAPP_ENABLED` defaults to false → WhatsApp channels log dry-run, still count as dispatched for the matrix check.

---

## 11. Task plan outline (~16 tasks → ~10 commits, ~4-5h)

Detail in `2026-04-20-week8-alert-engine-plan.md`. Summary:

| # | Task | Commit target |
|---|---|---|
| 0 | Baseline smoke — all W7 tests pass, typecheck clean | — |
| 1 | Schema: extend Notifications sheet (+4 cols) + migration | `chore(sheets): add notification delivery columns` |
| 2 | `alert-quiet-hours.ts` + `alert-rate-limiter.ts` pure fns + tests | — |
| 3 | `app/lib/whatsapp.ts` module + dry-run logger + `WHATSAPP_ENABLED` gate + tests | bundled with #2: `feat(alerts): quiet hours + rate limiter + WhatsApp module` |
| 4 | Extend `email-templates.ts` with C-01..10 + R-01..14 + F-01..07 (62 locale strings) | `feat(alerts): full bilingual template catalog (31 templates)` |
| 5 | `alert-dispatcher.ts` + ALERT_ROUTES table + 30+ unit tests | `feat(alerts): alert dispatcher + per-rule routing matrix` |
| 6 | Wire dispatcher into rule-engine `executeTransition` + pending-move execute path | `feat(alerts): rule engine fires alert dispatcher on every transition` |
| 7 | Bell bridge: R-*/F-* dispatches also write Notifications rows (source=deal_event) | bundled with #6 |
| 8 | Nightly sweep extensions: retry missed alerts + release queued quiet-hour deliveries | `feat(alerts): nightly sweep retries + quiet-hour release` |
| 9 | Deal slideout — new "History" tab + rollback button + filter toggle | `feat(pipeline): deal history tab in slideout with rollback UX` |
| 10 | Pending-move banner + real-time countdown in slideout | bundled with #9 |
| 11 | End-to-end simulation test (14 rules walkthrough) | `test(alerts): end-to-end 14-stage simulation` |
| 12 | Final smoke + execution log | `docs(design): W8 execution log + final smoke` |

Target: ~10 commits. Conventional prefixes: `feat:` / `chore:` / `test:` / `docs:`.

---

## 12. Out of scope for W8 (deferred)

| Item | Lands in |
|---|---|
| Meta template approval workflow | External ops — Joshua submits templates to Meta Business Manager |
| `Templates` sheet for in-portal copy edits | Phase 2 polish |
| `Whatsapp_Opt_In` sheet + explicit opt-in UX | Post Meta approval (when `WHATSAPP_ENABLED=true`) |
| Customer-facing notification settings UI (unsubscribe) | Phase 2 |
| Multi-tenant notification routing (brand_slugs filter) | Not needed — single-brand per deal |
| Slack/Teams integration for Roger | Not requested |
| Email deliverability analytics (open/click tracking) | Phase 2 — Resend has built-in stats |
| Per-user alert preferences | Phase 2 — W8 is global-default only |

---

## 13. Risks / open items

| Risk | Mitigation |
|---|---|
| Meta template approval slow / rejected | `WHATSAPP_ENABLED` flag stays false; email channel carries the full customer comms load. Flag flips on approval with zero code change. |
| Resend rate limit hit during simulation | W8 test uses `@untold.works` test addresses; production volume is small. |
| Quiet-hours queueing + nightly-sweep gap | If Netlify cron skips a day, queued alerts stack. Sweep's 8am run processes all `deliver_after ≤ now` regardless — self-heals. |
| Duplicate customer emails from retry loop | Dispatcher checks for existing `alert_fired` with same `{rule_id, dealId, channel, recipient}` in the last 6h before re-sending. Idempotent retry. |
| SlideOut no banner slot | §9.2 adds the banner as a fixed div above the tab switcher (simple layout addition). |
| Spec says 7 Finance notifications but rule count is different | Cross-check the spec's Notifications table — some rules have no Finance audience. Task 11's end-to-end test asserts the exact count and surfaces any discrepancy. |
| `WHATSAPP_ENABLED=true` without Meta template approval → live sends fail | `sendWhatsAppTemplate` error handling logs + marks `alert_fired` with `status: "failed"`. Nightly sweep retry cap bounded at 3 to avoid infinite loops. |
| Customer alerts arrive BEFORE Roger sees them (embarrassment) | Pre-move threshold already catches >$500K deals. For smaller deals, the risk is accepted — customer-first communication is good UX. |

---

## 14. Self-review checklist (pre-plan)

- ✅ All 7 Q&A decisions reflected
- ✅ Spec coverage: 14 transitions × 3 audiences = 42 audience-rule combos — 31 have templates, rest are no-op
- ✅ Schema asks flagged (§3.1), minimal scope
- ✅ No placeholders in ALERT_ROUTES — each rule row concrete
- ✅ W7 follow-ups (Stage History + pending-move banner + countdown) mapped to tasks 9-10
- ✅ Rate limiter + quiet hours are pure modules with deterministic tests
- ✅ WhatsApp dry-run path exercised by default test runs — no external Meta dependency for CI
- ✅ Rule engine hook is `fire-and-forget` → Resend/Meta outages don't fail transitions
- ✅ Nightly sweep handles retry + queued release in one pass — no new cron
- ⚠ "Zero missed or duplicate alerts" ship criterion gated by the idempotency guard in §13 — test enforces
- ⚠ Meta template approval is ops-track, not code-track — W8 ships with or without it

---

## 15. Approval request

Joshua, please approve or redirect on:

1. **Design doc as a whole** — OK to proceed to plan write + execution?
2. **§3.1 Notifications sheet — add 4 columns** (`deliver_after`, `delivery_channel`, `recipient_email`, `recipient_phone`)?
3. **§4.2 ALERT_ROUTES table mapping 14 rules × customer/Roger/Finance** — any rule you'd want to reshape before I author the matrix?
4. **§5.2 Roger alert channel preference** — dashboard-only for W7 ship, WhatsApp lands once `WHATSAPP_ENABLED=true`. Email-to-Roger as a 3rd fallback channel? Current plan: dashboard first, WhatsApp second (when live), email third (always-on fallback).
5. **§4.4 Rate caps** — 1 WhatsApp/customer/hour/template, 5 emails/customer/day. Comfortable, or tighter/looser?
6. **§4.5 Quiet hours** — 10pm–8am MX for customers, Roger/Finance exempt. Confirmed, or adjust window?
7. **§11 task bundling** — comfortable with ~10 commits target?
8. **§13 risk on duplicate customer emails** — accept the 6h idempotency window (same rule → deal → channel → recipient can't fire twice within 6h)?

Once approved I write the detailed plan doc with step-level TDD tasks and wait for a second approval before execution.
