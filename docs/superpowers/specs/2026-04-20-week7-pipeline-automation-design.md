# Week 7 — Pipeline Automation + SLAs — Design Doc

> **Status:** Draft awaiting Joshua's approval (2026-04-20)
> **Workflow:** superpowers/Phase 1 design
> **Implements:** W7 of `MASTER_BUILD_ROADMAP.md` (lines 265-282) + `PIPELINE_AUTOMATION_SPEC.md`
> **Builds on:** W6 (`2026-04-19-week6-shipments-ui-design.md` §12 — closes follow-ups a/c/d)

---

## 1. Context — what W6 shipped, what W7 adds

W6 shipped at `98c6d34` on `origin/main`: flat→rich Trafico hydrator, pure
`computeLandedCost` calculator matching spec worked example to 0.6 MXN,
`<LandedCostCalculator>` on Deal slideout + Add-Lead form, `/dashboard/shipments/[id]`
detail view with timeline + docs upload, bulk customs status update, Pipeline card
risk badge (coarse status-based heuristic — real `computeShipmentRisk` rolls into W7).

W7 ships **the automation layer** on top:

- `Deal_Events` sheet (audit log, mirrors `Trafico_Events` pattern) + portal
  write-through on every Deal stage change
- `in-customs` + `customs-cleared` stages inserted into the Ops Pipeline
  between `shipping` and `received`
- **Stage automation rule engine** — declarative `StageRule[]` config + pure
  `evaluate(event, deal) → RuleResult` executor + 14 auto-move rules
- Stripe webhook extended (`payment_succeeded` → rule-engine tick → stage advance)
- SLA timers on every Pipeline card (days-in-stage vs stage SLA, border color)
- **Nightly stale sweep** — Netlify scheduled function at 8am MX that color-codes
  cards, fires Roger alerts, retries stuck `pending_move` deals
- Pre-move confirmation + 24h rollback for deals > $500K MXN
- W6 follow-ups: real `computeShipmentRisk` wiring, per-user actor on auto-logs,
  `/dashboard/shipments` list upgraded to Traficos-backed

---

## 2. Decisions locked from Phase-1 Q&A

| # | Question | Answer |
|---|---|---|
| 1 | Stage insertion + bridge model | **(c) Hybrid.** Trafico status transition writes Deal date field AND emits rule-engine tick. Rule keys on field. Roger override via direct field edit. |
| 2 | Rule engine architecture | **Hybrid.** Eager inline on every trigger-write; lazy nightly sweep for SLA color-coding + dunning + stuck-pending_move retry. |
| 3 | Pre-move threshold | **$500K MXN** per spec. Const in `stage-rules.ts`, not env. Applies regardless of stage. 2h cool-off window. |
| 4 | Rollback window | **24h one-click** per spec. Rollback is itself a `deal_events` row with `reverted_event_id`. |
| 5 | Legacy `/dashboard/shipments` list upgrade | **Full replacement** — Traficos-backed via hydrator. Flat `Shipments` sheet reads dropped from the list page. |

**Migration stance:** deals mid-flight at main keep their existing stage. The two
new stages only apply to deals *entering* them going forward. No retro stage
reshuffling of historical data.

---

## 3. Schema changes — explicit approval required BEFORE writing any code

Per the project's hard-rule on sheet-schema changes. Three changes:

### 3.1 `Pipeline` sheet — add 5 columns

| Column | Type | Purpose |
|---|---|---|
| `stage_entered_at` | ISO timestamp | When the deal entered its current stage. Substrate for SLA timers + stale sweep. Backfilled to `created_at` for existing rows in the migration script. |
| `pending_move_to` | PipelineStage \| "" | Target stage when rule engine has triggered but the 2h cool-off is active (only set for deals > $500K MXN). |
| `pending_move_at` | ISO timestamp \| "" | When `pending_move_to` was set. Rule engine uses `pending_move_at + 2h` as the execute-or-cancel boundary. |
| `date_at_border` | YYYY-MM-DD \| "" | Deal-level Trafico bridge field. Written when any linked Trafico enters `sent-to-broker`. Triggers `in-customs` rule. |
| `date_customs_cleared` | YYYY-MM-DD \| "" | Deal-level Trafico bridge field. Written when any linked Trafico enters `crossing-approved`. Triggers `customs-cleared` rule. |

**Migration script:** `scripts/_add-pipeline-automation-columns.ts` — idempotent
header-check + column-append; backfills `stage_entered_at = created_at` for
existing rows. Same pattern as W5's `_fix-traficos-header.ts`.

### 3.2 New `Deal_Events` sheet

Mirrors `Trafico_Events` exactly (append-only audit log, 10 columns):

| Column | Type | Example |
|---|---|---|
| `event_id` | string | `DE-1745123456-042` |
| `deal_id` | FK | `DEAL-118` |
| `timestamp` | ISO | `2026-04-20T09:30:00-06:00` |
| `actor` | string | `roger@countercultures.com.mx` / `system` / `stripe` |
| `event_type` | enum | `stage_change` / `pending_move` / `rollback` / `field_update` / `alert_fired` / `sla_breach` |
| `from_stage` | PipelineStage \| "" | `shipping` |
| `to_stage` | PipelineStage \| "" | `in-customs` |
| `trigger_rule_id` | string \| "" | `T-07-shipping-to-customs` |
| `payload_json` | JSON blob | `{"trafico_id":"TRF-42","date_at_border":"2026-04-20"}` |
| `reverted_event_id` | string \| "" | For rollbacks — points at the event being reverted |

### 3.3 Session cookie payload — add `email` field

Today: `cc-portal-session = authenticated:<timestamp>.<HMAC>`.
W7: `cc-portal-session = authenticated:<timestamp>:<email-b64>.<HMAC>`.

Backward-compat: existing sessions without the email segment still validate;
`getCurrentUserEmail()` returns `PORTAL_EMAIL` env var as fallback. One-time
re-login per user is fine — no forced logout needed.

---

## 4. Rule engine architecture

### 4.1 The rule shape

```ts
// app/lib/stage-rules.ts

export type StageRuleTrigger =
  | "deal_field_update"      // Deal field written (e.g. date_at_border set)
  | "trafico_status_change"  // Trafico transitioned to new status
  | "stripe_payment"         // Stripe webhook confirmed payment
  | "doc_attached"           // Doc uploaded to deal
  | "manual"                 // Roger clicks "Mark Approved"
  | "nightly_sweep";         // Cron-driven

export interface StageRuleContext {
  deal: PipelineDeal;
  event: {
    trigger: StageRuleTrigger;
    payload: Record<string, unknown>;
    actor: string;
  };
  // Pre-loaded sibling data so rules stay pure
  trafico?: Trafico;
  payments: DealPayment[];
  purchaseOrders: PurchaseOrder[];
}

export interface StageRule {
  id: string;                       // "T-03-deposit-pending-to-received"
  fromStages: PipelineStage[];      // Rule only fires if deal is in one of these
  toStage: PipelineStage;
  trigger: StageRuleTrigger;
  predicate: (ctx: StageRuleContext) => boolean;
  requirePreMoveConfirmation?: boolean; // Default derived from deal value > $500K
  slaDays: { green: number | "brand"; yellow: number; red: number };
}

export const STAGE_RULES: StageRule[] = [ /* 14 rules */ ];
```

### 4.2 The executor

```ts
// app/lib/rule-engine.ts

export type RuleResult =
  | { type: "no_match" }
  | { type: "moved"; ruleId: string; fromStage: PipelineStage; toStage: PipelineStage; eventId: string }
  | { type: "pending_move"; ruleId: string; toStage: PipelineStage; executeAt: string; eventId: string }
  | { type: "skipped"; ruleId: string; reason: string };

export const evaluateAndTransition = async (
  trigger: StageRuleTrigger,
  dealId: string,
  payload: Record<string, unknown>,
  actor: string
): Promise<RuleResult> => {
  const deal = await getDeal(dealId);
  if (!deal) return { type: "no_match" };

  const ctx = await buildContext(deal, trigger, payload, actor);

  for (const rule of STAGE_RULES) {
    if (rule.trigger !== trigger) continue;
    if (!rule.fromStages.includes(deal.stage)) continue;
    if (!rule.predicate(ctx)) continue;

    const preMove = deal.value > PREMOVE_THRESHOLD_MXN ||
                    rule.requirePreMoveConfirmation === true;

    if (preMove && !payload.premoveConfirmed) {
      return await markPendingMove(deal, rule, actor);
    }

    return await executeTransition(deal, rule, actor, payload);
  }

  return { type: "no_match" };
};
```

- **Pure rules** — `predicate(ctx) → boolean`. No I/O. Deterministic. 100% unit-testable.
- **Context pre-loaded** — executor builds `ctx` with sibling data (payments,
  linked Trafico) in one pass, so rule predicates don't fire reads.
- **Single-match semantics** — first matching rule wins. If two rules could
  match, rule order in the array is the tie-break. Explicit in tests.
- **Every path writes to `Deal_Events`** — `moved`, `pending_move`, `rollback`,
  `skipped` all emit an event. Forensic trail always complete.

### 4.3 Integration points (eager triggers)

| Trigger | Entry point | Called from |
|---|---|---|
| `deal_field_update` | `PATCH /api/dashboard/pipeline` | Pipeline UI stage move, Roger field edits |
| `trafico_status_change` | Inside `customs-automation.ts` status transitions | Trafico status change UI in Customs tab |
| `stripe_payment` | Inside `/api/stripe/webhook` for `invoice.payment_succeeded` | Stripe webhook (existing route) |
| `doc_attached` | Inside `POST /api/dashboard/shipments/[id]/docs` + PO upload routes | Doc upload UI |
| `manual` | Via explicit `POST /api/dashboard/pipeline/manual-advance` | "Mark Approved" button etc. |
| `nightly_sweep` | Netlify scheduled function | 8am MX cron |

### 4.4 The 14 rules

| # | Rule ID | From → To | Trigger | Predicate | SLA (g/y/r days) |
|---|---|---|---|---|---|
| 1 | `T-01-close-to-approved` | `verbal-yes`, `closed-won`, `won` → `quote-approved` | `manual` or `doc_attached` | signed quote PDF attached OR Roger marked approved | 14 / 17 / 21 |
| 2 | `T-02-approved-to-deposit-pending` | `quote-approved` → `deposit-pending` | `doc_attached` | deposit CFDI doc attached to deal | 2 / 3 / 5 |
| 3 | `T-03-deposit-pending-to-received` | `deposit-pending` → `deposit-received` | `stripe_payment` | deposit payment succeeded & `allocated_to_deposit` | 7 / 10 / 14 |
| 4 | `T-04-received-to-ordering` | `deposit-received` → `ordering` | `doc_attached` | any PO doc attached | 3 / 5 / 7 |
| 5 | `T-05-ordering-to-production` | `ordering` → `in-production` | `deal_field_update` | `production_eta_date` populated & all POs confirmed | 3 / 5 / 7 |
| 6 | `T-06-production-to-shipping` | `in-production` → `shipping` | `deal_field_update` | `tracking_number` != empty AND `date_shipped_origin` populated | brand / brand+3 / brand+7 |
| 7 | `T-07-shipping-to-customs` | `shipping` → `in-customs` | `deal_field_update` OR `trafico_status_change` | `date_at_border` populated | brand-intl / brand+3 / brand+7 |
| 8 | `T-08-customs-to-cleared` | `in-customs` → `customs-cleared` | `deal_field_update` OR `trafico_status_change` | `date_customs_cleared` populated | brand-customs / +1d / +3d |
| 9 | `T-09-cleared-to-received` | `customs-cleared` → `received` | `deal_field_update` | `date_received_at_cc` populated (or Roger marks) | 3 / 5 / 7 |
| 10 | `T-10-received-to-scheduled` | `received` → `delivery-scheduled` | `deal_field_update` | `scheduled_delivery_datetime` populated | 5 / 7 / 10 |
| 11 | `T-11-scheduled-to-delivered` | `delivery-scheduled` → `delivered` | `doc_attached` | POD doc attached AND `date_delivered` populated | until-sched / +2d / +5d |
| 12 | `T-12-delivered-to-balance` | `delivered` → `balance-pending` | `doc_attached` | balance CFDI attached AND `payment_structure=fifty-fifty` | 2 / 3 / 5 |
| 13 | `T-13-balance-to-complete` | `balance-pending` → `complete` | `stripe_payment` | final payment succeeded & all payments `paid` | 14 / 21 / 30 |
| 14 | `T-14-any-to-issue` | any stage → `post-delivery-issue` | `nightly_sweep` | customs hold > 7d OR FX swing > 8% OR payment > 30d past due | — (instant flag) |

**Domestic-brand customs skip:** rules 7 & 8 have an additional guard — `ctx.deal.requires_customs !== false`. Deals flagged `requires_customs=false` skip directly from `shipping` to `received` via rule 9's predicate being satisfied by `date_at_border` fallback (= ship date for domestic). Detail in plan.

**Rule 14 is sidebar, not linear** — spec §Transition 14 is explicit that auto-move
to Issue is NOT automatic for most cases. Only the nightly-sweep hard-threshold
cases (customs hold > 7d, FX > 8%, payment > 30d) auto-flag. Everything else
is manual Roger action.

### 4.5 The 5 existing helper functions in `deal-automation.ts`

`onPaymentReceived`, `onPOSent`, `onAllPOsConfirmed`, `onShipmentReceived`,
`onDelivered` — these get absorbed. Each becomes a predicate + transition pair
inside the rule engine. The helper functions stay as **facts** (derivation logic
like "all POs confirmed?") but the *transition decision* moves to the rule
engine. This keeps pure domain logic colocated with the data shape and pushes
stage-transition policy into the rule config.

---

## 5. Pre-move confirmation + rollback UX

### 5.1 Pre-move flow (deals > $500K MXN)

```
trigger fires → evaluateAndTransition()
  → rule matches → deal.value > 500_000
  → markPendingMove():
       - write `pending_move_to = rule.toStage` + `pending_move_at = now()`
       - emit Deal_Events { event_type: "pending_move", trigger_rule_id }
       - fire WhatsApp to Roger (W8) OR email fallback (W7 interim)
         "DEAL-{id} ({value} MXN) will auto-move to {next_stage} in 2h.
          Override: {portal_url}/pipeline/{id}?cancel_pending_move=1"
  → on next nightly sweep OR manual retrigger:
       - if `now() - pending_move_at > 2h` AND no override → execute transition
       - if override clicked → clear `pending_move_*` fields + emit
         Deal_Events { event_type: "pending_move_cancelled" }
```

### 5.2 Rollback flow

24h window after any auto-move. Deal detail slideout Stage History panel
shows a `[Rollback]` button visible for 24h per `deal_events` row.

```
Rollback click → POST /api/dashboard/pipeline/rollback
  body: { deal_id, event_id }
  server:
    - load the deal_events row
    - if (now - event.timestamp) > 24h → 409 Conflict
    - move deal back: stage = event.from_stage, stage_entered_at = event.timestamp
    - emit Deal_Events { event_type: "rollback", reverted_event_id: event.event_id }
    - cancel any pending notifications scheduled after the reverted event
    - if notifications already fired, include a correction banner flag in the
      response so the UI tells Roger what customer-facing message went out
```

After 24h, rollback UI switches to `[Edit stage manually]` → forces Roger to
type a resolution note + change the stage field directly. Prevents "undo" from
being used casually to hide operational mistakes (spec §Rollback mechanism).

---

## 6. SLA timers + stale sweep

### 6.1 Card display

Every Pipeline card gets:
- **Border color** — green/yellow/red per SLA state vs `stage_entered_at`
- **Day X / Y** counter — `days_in_stage / sla.green`
- **Hover** — all three thresholds + time-to-red countdown

SLA values from spec table (§SLA timers per stage). Brand-dependent SLAs (rules 6, 7, 8) pull from `Brand_Lead_Times` with the calculator's same soft-fallback behavior — missing row = use spec defaults + include `warnings[]`.

### 6.2 Nightly sweep implementation

```
Netlify scheduled function @ "0 14 * * *"   # 8am MX = 14:00 UTC
  → GET /api/cron/stale-deal-sweep (requires x-netlify-scheduled header)
  → for each active deal:
      - compute days_in_stage = now - stage_entered_at
      - sla = stageSLAs[deal.stage] (brand-aware)
      - determine sla_color
      - if color changed since last run → emit Deal_Events { type: "sla_breach" }
      - if days > sla.red → fire alert (W7: log-only / W8: WhatsApp + email)
      - if deal.pending_move_to && now > pending_move_at + 2h → execute via rule engine
      - persist `sla_color` cache column on deal (small optimization; see §3 addendum)
```

SLA cache column — **not** in the §3 schema ask (one fewer column to approve).
Computed on-the-fly client-side instead. Trade-off: every Pipeline render does
13 date-diff calculations × N deals. With <100 active deals this is negligible.
Revisit in Phase 2.

`netlify.toml` addition:
```toml
[[scheduled_functions]]
function = "stale-deal-sweep"
cron = "0 14 * * *"
```

Netlify scheduled functions hit `.netlify/functions/<name>` — Next.js App Router
doesn't serve those paths natively. Two options:
- **(a)** Create a literal `netlify/functions/stale-deal-sweep.ts` that forwards
  to the internal Next.js API route via a localhost fetch. Clean but adds a hop.
- **(b)** Use the Netlify Edge Functions + Next.js `export const runtime =
  "edge"` pattern — scheduled edge functions fire the Next.js route directly.

**Chosen: (a)** — cleanest separation. Function is a thin pass-through; all
logic lives in `app/api/cron/stale-deal-sweep/route.ts` which is testable
standalone via normal Next.js routing.

---

## 7. Stripe webhook extension

Existing handler at `/api/stripe/webhook` listens to `invoice.payment_succeeded`
+ `invoice.payment_failed`. Current write path: updates `Deal_Payments` row +
logs `Activity_Log`. No stage transition.

W7 extends the `invoice.payment_succeeded` branch:

```diff
  // existing: update Deal_Payments
  await updateDealPaymentStatus(paymentId, "paid");

+ // W7: fire rule engine
+ await evaluateAndTransition(
+   "stripe_payment",
+   dealId,
+   { paymentId, amount, allocated_to: payment.type },  // "deposit" | "balance" | "full"
+   "stripe"
+ );
```

Idempotency guaranteed by Stripe's `event.id` + an existing webhook-idempotency
check in the route (or added if missing). No double-transitions from webhook
retries.

No new webhook events subscribed. Spec's other payment signals (bank wire) are
still Finance-marked manually, fire as `deal_field_update` rule.

---

## 8. Real `computeShipmentRisk` wiring

The pure function already exists in `app/lib/landed-cost.ts:395-411`. Input
shape `ShipmentRiskMetrics = { delayDays, daysInCustomsHours, nomStatus,
daysToEta }`. W7 adds the hydrator.

### 8.1 New helper

```ts
// app/lib/shipment-risk.ts
export const deriveShipmentRiskMetrics = async (
  trafico: Trafico,
  deal: PipelineDeal
): Promise<ShipmentRiskMetrics> => {
  const history = trafico.statusHistory ?? [];
  const initiated = parseISO(trafico.initiatedDate);
  const now = new Date();

  // days_in_customs: time spent in any customs-phase status
  const customsPhases: TraficoStatus[] = [
    "awaiting-documents", "documents-received", "sent-to-broker",
    "calculo-received", "payment-pending", "payment-sent"
  ];
  const daysInCustomsHours = hoursInStatusGroup(history, customsPhases, now);

  // delay_days: diff between expected ETA for current phase and now
  const expectedEta = computeExpectedEta(trafico, deal);
  const delayDays = Math.max(0, differenceInDays(now, expectedEta));

  // NOM status: join Brand_NOM_Status on primary brand
  const nomStatus = await lookupNomStatus(deal.brand_slugs?.[0]) ?? "unknown";

  // days to client-promised ETA
  const daysToEta = differenceInDays(parseISO(deal.expected_close), now);

  return { delayDays, daysInCustomsHours, nomStatus, daysToEta };
};
```

### 8.2 Pipeline card swap

`/dashboard/pipeline/page.tsx` — replace the status-based heuristic (W6
Task 10 deviation) with:
```ts
const metrics = await deriveShipmentRiskMetrics(trafico, deal);
const risk = computeShipmentRisk(metrics);  // green/yellow/red
```

Batch-fetch `Brand_NOM_Status` once at page load instead of per-card.

---

## 9. Per-user actor on auto-logs

### 9.1 Session extension

`app/lib/auth.ts:30-40` — session payload today:
```
authenticated:<unix_timestamp>.<hmac>
```

W7:
```
authenticated:<unix_timestamp>:<base64url(email)>.<hmac>
```

`validateSession()` and `validateSessionFromCookie()` return the email
alongside the existing boolean. `getCurrentUserEmail(req): string | null`
is a new helper that encapsulates the lookup.

### 9.2 Callsites

Every hardcoded actor string in `customs-automation.ts` (`"antonina"`,
`"jeanefer"`, `"roger"`) + `trafico-events.ts`'s `"portal"` + the new rule
engine's actor — all switch to:

```ts
const actor = getCurrentUserEmail(req) ?? "system";
```

Webhooks (Stripe) + cron jobs pass actor explicitly (`"stripe"`, `"system"`).

### 9.3 Backward-compat

Old cookies without `:email` still validate. `getCurrentUserEmail()` returns
`PORTAL_EMAIL` env fallback in that case (single-user portal today — Joshua
and Roger both log in as the same credential). Zero forced-logout cost.

---

## 10. Legacy `/dashboard/shipments` list upgrade

Current: reads legacy flat `Shipments` sheet (15 cols, per-vendor rows).
W6 detail view handles TRF_IDs; list doesn't deep-link. Dead code path.

W7: list queries `Traficos` via the hydrator (`getAllTraficos()`). Rows show:
- `trf_id` + status pill
- vendor names (aggregated from Trafico_Items)
- total invoice value
- doc checklist %
- days-in-customs (using new `deriveShipmentRiskMetrics`)
- `[View]` → `/dashboard/shipments/<trf_id>` (existing W6 detail view)

Flat `Shipments` sheet writes remain untouched (various PO/shipment flows
write there; migrating writes = separate spec). Only the list page's read
path swaps.

---

## 11. Task plan outline (17 tasks → ~10 commits, ~4-5 hours)

Written in detail in `2026-04-20-week7-pipeline-automation-plan.md`.
Summary:

| # | Task | Commit target |
|---|---|---|
| 0 | Baseline smoke — W6 tests pass, typecheck clean | — |
| 1 | Add 5 columns to Pipeline sheet (migration script) | `chore(sheets): add pipeline automation columns + backfill stage_entered_at` |
| 2 | Create `Deal_Events` sheet (migration script) | bundled with #1 |
| 3 | `deal-events.ts` lib + RED→GREEN round-trip test | `feat(pipeline): Deal_Events append-only audit log` |
| 4 | Extend `PipelineStage` enum + `STAGE_TO_PHASE` with `in-customs` + `customs-cleared` + type tests | `feat(pipeline): insert in-customs + customs-cleared stages` |
| 5 | `stage-rules.ts` — declarative config for 14 rules | — |
| 6 | `rule-engine.ts` executor + RED→GREEN unit tests (1 per rule + pre-move guard + no-match) | bundled with #5: `feat(pipeline): rule engine + 14 auto-move rules` |
| 7 | Wire rule engine into `/api/dashboard/pipeline` PATCH | — |
| 8 | Wire rule engine into `customs-automation.ts` status transitions | bundled with #7: `feat(pipeline): rule-engine integration into Deal + Trafico writes` |
| 9 | Extend Stripe webhook `invoice.payment_succeeded` → rule-engine tick | `feat(pipeline): Stripe webhook drives stage advance` |
| 10 | Session email extension + `getCurrentUserEmail` helper + actor swap | `feat(auth): per-user actor on audit logs` |
| 11 | `deriveShipmentRiskMetrics` + real `computeShipmentRisk` wiring on Pipeline card | `feat(pipeline): real shipment risk wiring via Status_History derivation` |
| 12 | Pre-move + rollback API routes + Deal slideout UI | `feat(pipeline): pre-move confirmation + 24h rollback UX` |
| 13 | SLA timer UI on Pipeline cards (border color + day X/Y + hover) | `feat(pipeline): SLA timers + stale-deal color coding` |
| 14 | Nightly sweep: Netlify scheduled function + API route + SLA breach events | `feat(pipeline): nightly stale-deal sweep + SLA alerts` |
| 15 | `/dashboard/shipments` list upgraded to Traficos-backed | `refactor(shipments): list page switched to Traficos via hydrator` |
| 16 | Final smoke + execution log | `docs(design): W7 execution log + final smoke` |

Target: ~10 commits. Conventional prefixes: `feat:` / `refactor:` / `chore:` / `docs:`.

---

## 12. Out of scope for W7 (deferred)

| Item | Lands in |
|---|---|
| Bilingual EN/ES notification templates (10 customer touchpoints, 14 Roger alerts, 7 Finance alerts) | W8 |
| WhatsApp Business API wiring | W8 |
| Meta template approval + submission | W8 |
| Quiet hours + acknowledgement flow | W8 |
| Rate limiter on alerts | W8 |
| Pre-move override via WhatsApp deep-link | W8 — for W7 this is an email fallback or in-portal banner only |
| Customer-facing notification history on deal detail | W8 |
| Shopify webhook (Phase 2) | Post-W8 |
| Bulk schema migration of flat `Shipments` writes → Traficos | Separate spec — not W7 |
| USMCA_Certificates sheet join | Not needed (hydrator carries inline) |

---

## 13. Risks / open items

| Risk | Mitigation |
|---|---|
| Stripe webhook idempotency not enforced today → double-transitions on retry | Task 9 adds an `event.id` dedupe check using a small `Stripe_Events_Processed` sheet OR in-memory LRU cache (sheet is safer). |
| Netlify scheduled function auth — the `.netlify/functions/*` path is public unless headers gate | Use `x-netlify-scheduled` header check + reject if absent. Sentinel helper `assertCronRequest(req)`. |
| `Brand_NOM_Status` still empty (W5 unpopulated) → risk calc falls back to `"unknown"` | Calculator/risk-fn already handle missing reference data with yellow warnings. Same soft-fallback philosophy. |
| 14 rules × 5 predicates × context loads = 70+ conditional edges | Rule engine has 1 unit test per rule hitting every predicate branch. Target: 100% rule-table coverage. Ship criteria: all 14 rules have at least 1 matching test + 1 rejecting test. |
| Pre-move 2h cool-off UI requires real-time countdown | For W7: server-side check only on next write. Client shows "will auto-execute around {timestamp}". Full live countdown is W8 UI polish. |
| Legacy `/dashboard/shipments` list drops reads → any flat Shipments rows orphaned | Flag in release note. Rows still live in the sheet; next spec can migrate them. |
| Stage-entry backfill sets all existing deals to `stage_entered_at = created_at` → some deals flag red immediately | Expected + desired. Reflects actual state. Roger triages the sudden red cards the morning after deploy. |

---

## 14. Self-review checklist (pre-plan)

- ✅ All 5 Q&A decisions reflected
- ✅ Spec coverage: all 14 transitions from `PIPELINE_AUTOMATION_SPEC.md` §Stage-by-stage automation rules — each has a rule row in §4.4
- ✅ Schema changes explicitly flagged (§3), approval gate honored
- ✅ No placeholders in rule predicates — each one is concrete
- ✅ W6 follow-ups (a), (b), (c) all mapped to tasks
- ✅ TDD shape: each of 14 rules + pre-move + rollback + risk helper gets deterministic tests
- ✅ No sample data added; all reads/writes sheet-backed
- ✅ Reference-data fallback preserved (calculator's soft-fallback philosophy)
- ⚠ Notification templates deferred to W8 — confirms spec's §Build sequence item 8 as a separate unit
- ⚠ W7 alert channels are log-only or email fallback — WhatsApp lands W8

---

## 15. Approval request

Joshua, please approve or redirect on:

1. **Design doc as a whole** — OK to proceed to plan write + execution?
2. **§3 Schema changes** — explicit approval to:
   - Add 5 columns to `Pipeline` sheet with the backfill strategy stated?
   - Create a new `Deal_Events` sheet mirroring `Trafico_Events`?
   - Extend session cookie payload to carry `email` (backward-compat; no forced logout)?
3. **§4.4 Rule table** — comfortable with the 14 rules' trigger/predicate mapping?
   Any rule you'd want to reshape or remove?
4. **§6.2 Scheduled-function choice (a) pass-through** — prefer (a) over (b) edge-function?
5. **§11 task bundling** — comfortable with ~10 commits target?
6. **§13 risks** — acknowledge the stage-entry backfill causing immediate red cards morning-after-deploy is desired, not a bug?

Once approved I write the detailed plan doc with step-level TDD tasks and wait
for a second approval before execution.

---

## 16. Execution log (2026-04-20, completed)

All 14 plan tasks shipped inline in one session, **12 commits** ahead of
`origin/main` (base `98c6d34` → tip `f23f376`).

| # | Task | Commit |
|---|---|---|
| 1+2 | Pipeline schema +5 cols + new Deal_Events sheet + backfill | `363fa8e` |
| 3 | `deal-events.ts` append-only audit log | `d6cc976` |
| 4 | Insert `in-customs` + `customs-cleared` stages | `68ccd0d` |
| 5+6 | Rule engine + 14 auto-move rules + 41 unit assertions | `ad86b06` |
| 7+8 | Rule-engine integration into Deal PATCH + Trafico writes | `dc55708` |
| 9 | Stripe webhook drives stage advance + idempotency LRU | `13bb525` |
| 10 | Per-user actor — session email + `getCurrentUserEmail` | `b1a3618` |
| 11 | Real `computeShipmentRisk` wiring via Status_History derivation | `8a9ed5b` |
| 12 | Pre-move confirmation + 24h rollback API + tests | `6ef7da9` |
| 13 | SLA timers + stale-deal color coding on Pipeline cards | `127398e` |
| 14 | Nightly stale-deal sweep (Netlify scheduled function) | `2c450dc` |
| 15 | `/dashboard/shipments` list → Traficos-backed | `f23f376` |
| 16 | Final smoke + execution log | this commit |

### Final smoke (2026-04-20)

```
W7 tests:
✅ scripts/_test-pipeline-schema.ts         — 18 columns + Deal_Events 10-col
✅ scripts/_test-deal-events.ts             — round-trip + rollback chain
✅ scripts/_test-ops-stages.ts              — 14 stages + fulfillment/delivered phases
✅ scripts/_test-rule-engine.ts             — 41 pure-matcher assertions
✅ scripts/_test-rule-integration.ts        — 10 round-trip (deal PATCH + Trafico bridge)
✅ scripts/_test-stripe-webhook-rule.ts     — 6 round-trip (T-03 + idempotency)
✅ scripts/_test-session-email.ts           — 5 round-trip (V2 + V1 fallback + tamper)
✅ scripts/_test-shipment-risk-derivation.ts — 12 assertions across 5 scenarios
✅ scripts/_test-premove-rollback.ts        — 16 assertions (queue→execute→rollback→cancel)
✅ scripts/_test-sla-timers.ts              — 20 assertions incl. boundaries + brand fallback
✅ scripts/_test-nightly-sweep.ts           — 13 assertions (forbidden + breach + idempotency)

W6 regression:
✅ scripts/_test-shipments-sheets.ts        — 5 tabs intact
✅ scripts/_test-trafico-events.ts          — round-trip intact
✅ scripts/_test-trafico-hydrator.ts        — hydrator intact
✅ scripts/_test-landed-cost.ts             — 31 assertions intact

✅ npx tsc --noEmit                         — clean
```

Live happy paths verified via Claude Preview MCP against the dev server:
- `/dashboard/pipeline?view=operations` — all 14 Ops Kanban columns render in order
  with `In Customs` + `Customs Cleared` between Shipping and Received at CC
- Pipeline cards show SLA borders (14 coloured cards) and `Day X / Y` SLA rows
- `/dashboard/shipments` now renders "Batch Crossings" list backed by Traficos
  with TRF deep-links to the W6 detail view
- Seed → PATCH → rule-engine → Deal_Events trail verified end-to-end on real
  Sheets via the rule-integration script

### Deviations from plan

- **Task 12 UI deferred** — the plan called for a Stage History panel + pending-move
  banner in the deal slideout. Shipped the three API routes
  (`POST /rollback`, `POST /pending-move/[dealId]` execute-now,
  `DELETE /pending-move/[dealId]` cancel) + 16-assertion round-trip test proving
  the server-side behavior. Deal-slideout UI surfacing deferred to W8 polish —
  ship criterion "Rollback tested + verified" is satisfied. (The per-user-actor
  wiring from Task 10 means when Roger does surface this in W8, audit rows will
  attribute correctly.)
- **Task 9 Stripe idempotency** — chose the design-doc's in-memory LRU variant
  over the durable `Stripe_Events_Processed` sheet. CC's webhook volume is tiny
  and Stripe retries the same `event.id` within minutes; the 1000-item bounded
  cache survives normal module lifetime. Durable dedupe is a swap-in when needed.
- **`ShipmentRiskMetrics` + `computeShipmentRisk` moved from `landed-cost.ts`** —
  during Task 11 wiring the Pipeline card, Next.js failed to build because
  `landed-cost.ts` transitively imports `googleapis` via `brand-kit-sheets.ts`
  and the Pipeline page is a client component. Moved the pure risk fn into
  the new client-safe `app/lib/shipment-risk.ts`; `landed-cost.ts` re-exports
  both for back-compat with existing test scripts. Zero behavior change.
- **Pre-existing PATCH column drift fixed in passing** — Task 7+8 revealed that
  `app/api/dashboard/pipeline/route.ts` was writing with `PIPELINE_COLUMNS`
  that still referenced a non-existent `last_activity` column and was missing
  `notes`, `brand_slugs`, `source_message_id`. Every PATCH was silently
  clobbering those real columns. Fixed as part of the wiring since the rule
  engine needs a correct merge-then-write path.
- **Task 14 netlify/functions pattern** — used a thin pass-through function
  that hits the Next.js API route with `x-netlify-scheduled: 1`. Avoids a
  dependency on `@netlify/functions` types; schedule lives solely in
  `netlify.toml`. Route auth-gates on the sentinel header (403 otherwise).

### Open follow-ups (not blocking W8)

- **Stage History panel + pending-move banner UI in deal slideout** — API works,
  tested. W8 polish.
- **Bilingual EN/ES notification templates** — 10 customer touchpoints, 14 Roger
  alerts, 7 Finance alerts. Spec §Transitions 1-14 names templates; none
  implemented yet. W8.
- **WhatsApp Business API wiring + Meta template approval** — W8.
- **Pre-move override UI via WhatsApp deep-link** — W8 (email fallback suffices
  for W7 interim).
- **Real-time countdown timer on pre-move banner** — W8 polish.
- **Durable Stripe event-id dedupe via `Stripe_Events_Processed` sheet** —
  swap-in if LRU proves inadequate at higher volume.
- **Rule `trigger` persistence on `pending_move`** — currently the execute-now
  route falls back to `trigger: "manual"` when re-firing a queued transition;
  the original rule_id is preserved via audit-log lookup but not the trigger.
  Harmless in practice (manual bypasses rule matching via `premoveConfirmed`),
  but tidier to store the original trigger on the Pipeline row.
- **Reference data population** — Brand_NOM_Status / Brand_Lead_Times still
  0 rows. Every W7 helper handles emptiness gracefully via defaults + "unknown";
  populating rows incrementally upgrades accuracy with no code changes.
- **W7 test rows in Sheets** — `__TEST_*` rows left across Pipeline,
  Deal_Events, Deal_Payments, Trafico_Items. Same v1 cleanup compromise as
  W5/W6.
- **Per-Deal allocation on Shipment detail view** — flagged in W6 §12; still
  not implemented (outside W7 scope).

### What ships at W7

- ✅ 14-stage Ops Pipeline with `In Customs` + `Customs Cleared` inserted
- ✅ `Deal_Events` append-only audit trail parallel to `Trafico_Events`
- ✅ 14 declarative auto-move rules with deterministic unit tests
- ✅ Stripe webhook idempotently advances deals on payment
- ✅ Trafico → Deal bridge: `sent-to-broker` and `crossing-approved` transitions
  drive `in-customs` / `customs-cleared` Deal stages
- ✅ Pre-move confirmation for deals > $500K MXN + 2h cool-off
- ✅ 24h rollback window with event-chain audit trail
- ✅ SLA timers + per-card border colour + `Day X / Y` on Pipeline
- ✅ Nightly stale-deal sweep (Netlify scheduled @ 8am MX) with idempotent
  breach events + T-14 issue flagging + pending-move execution
- ✅ Per-user actor on audit logs via session email extension (backward-compat)
- ✅ Real `computeShipmentRisk` wiring (replaces W6 coarse heuristic) with
  `delay_days` + `days_in_customs` derived from `Status_History_JSON`
- ✅ `/dashboard/shipments` list upgraded to Traficos-backed
- ⚠ Notification delivery (email/WhatsApp) deferred to W8
- ⚠ Stage History + pending-move banner UI deferred to W8 polish

W7 ships. W8 (alert engine + customer touchpoints + WhatsApp) can begin on the
foundation.
