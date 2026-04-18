# Week 5 Shipments — Design Doc

> **Status:** Draft awaiting Joshua's approval (2026-04-18)
> **Workflow:** superpowers/Phase 1 design
> **Implements:** W5 of MASTER_BUILD_ROADMAP.md (with spec-edit per decision-0)

---

## 1. Context & decisions already made

### Decision 0 (path d → b) — APPROVED

`SHIPMENTS_CUSTOMS_SPEC.md` was drafted assuming a flat per-vendor `shipments` table.
The portal already runs a richer two-level model (`Traficos` parent + `PedimentoItem` child)
that matches the broker's actual workflow. We will:

- **Edit the spec** (small "Reality check" section) to make `Traficos` + `PedimentoItem`
  the canonical model.
- **Add 5 new sheets** that fill genuine gaps (4 reference + 1 audit log).
- **NOT touch** the existing `Traficos` (41 cols) or `Shipments` (15 cols) schemas in W5.
  Any future schema changes to those will come back here for explicit approval.

### Approvals 1+2 — APPROVED

- (1) Spec edit OK
- (2) W5 ships 5 new sheets only; no edits to existing Traficos/Shipments schemas

---

## 2. Naming conventions (this is a decision — flagging it)

Mixed conventions exist in the repo today:

- Older sheets (`Shipments`, `Traficos`): column names are `Title_Case_Underscore` (e.g.,
  `Shipment_ID`, `Trafico_Number`)
- Newer sheets (`Leads`, `Notes`, `Reps`, `Gmail_Tokens`, `Email_Activity`): column names
  are `snake_case` (e.g., `brand_slugs`, `whatsapp_phone`, `source_message_id`)

**Decision (mine, please overrule if wrong):**

- Sheet *names*: `Title_Case_Underscore` (e.g., `Brand_NOM_Status`) — matches all
  existing sheets
- Column *names*: `snake_case` — matches the recent additions and the spec's column
  proposals

This means new code reading `Trafico_Events.event_type` will be inconsistent with old
code reading `Traficos.Status`, but both styles are already in the repo and we're not
migrating older sheets in W5.

---

## 3. Sheet schemas (5 new)

### 3.1 `Brand_NOM_Status`

**Purpose:** NOM compliance matrix per brand. Used by the landed-cost calculator (W6) to
flag NOM risk and by the alert engine (W8) to fire `R-04`/`R-05` (NOM-cert needed/blocked).

**Shape:** **long** form — one row per `(brand × NOM)` pair. Better than a wide brand-
per-row schema because (a) NOM list grows over time, (b) per-NOM notes don't bloat
brand rows, (c) some certs cover only a SKU subset (e.g., Dornbracht thermostats only).

| # | Column | Type | Example | Notes |
|---|---|---|---|---|
| 1 | `brand_slug` | string FK → Brand_Kit.slug | `dornbracht` | |
| 2 | `nom_code` | string | `NOM-008-CONAGUA` | One of: `NOM-008-CONAGUA`, `NOM-003-SCFI`, `NOM-001-CONAGUA`, `NOM-005-CONAGUA`, `NOM-010-CONAGUA`, `NOM-ENER` |
| 3 | `status` | enum | `certified` | `certified` / `partial` / `in-progress` / `needs-cert` / `not-applicable` / `blocked` |
| 4 | `applies_to_skus` | string | `thermostats only` | Free text scope, defaults to `all` if blank |
| 5 | `cert_drive_folder_id` | string | `1xY3a…` | Drive folder ID with the cert PDFs |
| 6 | `last_verified_date` | ISO date (YYYY-MM-DD) | `2026-03-15` | When broker last confirmed |
| 7 | `expires_date` | ISO date | `2027-03-15` | Many NOMs have validity periods |
| 8 | `notes` | string | "Per Jeanefer 2026-03-15" | Free text |
| 9 | `updated_by` | email | `roger@countercultures.com.mx` | |
| 10 | `updated_at` | ISO datetime | `2026-04-18T16:30:00-06:00` | |

---

### 3.2 `Brand_Lead_Times`

**Purpose:** ETA prediction per brand. Used by landed-cost calculator (W6) to compute
`leadTimeDays.total` and by alert engine (W8) for `R-06`/`R-07` (delay detection vs.
historical baseline).

**Shape:** wide — one row per brand. (Per-category overrides — e.g., Dornbracht
thermostats vs. rough-ins — handled via the free-text `notes` column for v1; a separate
`Brand_Category_Lead_Times` override sheet can come later if needed.)

| # | Column | Type | Example | Notes |
|---|---|---|---|---|
| 1 | `brand_slug` | string FK → Brand_Kit.slug | `dornbracht` | PK |
| 2 | `production_days` | integer | `28` | Manufacturing time at factory |
| 3 | `transit_sea_days` | integer or blank | `22` | Origin → MX border by sea |
| 4 | `transit_air_days` | integer or blank | `4` | Origin → MX border by air |
| 5 | `transit_truck_days` | integer or blank | `10` | US/Canada → MX truck (USMCA) |
| 6 | `customs_avg_days` | integer | `3` | Typical clearance time |
| 7 | `domestic_avg_days` | integer | `2` | Border → SMA warehouse |
| 8 | `last_verified_date` | ISO date | `2026-04-18` | |
| 9 | `notes` | string | "Thermostats 2d customs, rough-ins 5d" | Per-category nuance lives here for v1 |
| 10 | `updated_by` | email | | |
| 11 | `updated_at` | ISO datetime | | |

---

### 3.3 `HS_Code_Lookup`

**Purpose:** Map CC product categories → HS code + applicable NOMs + IEPS flag + MFN
fallback rate. The landed-cost calculator looks up by `category_slug` from a Shopify
product or shipment line-item.

**Shape:** wide — one row per category.

| # | Column | Type | Example | Notes |
|---|---|---|---|---|
| 1 | `category_slug` | string PK | `brass-faucets` | kebab-case identifier |
| 2 | `display_name_en` | string | `Brass / metal faucets` | |
| 3 | `display_name_es` | string | `Llaves de latón / metal` | |
| 4 | `hs_code` | string | `7324.90.01` | 10-digit Mexican HS classification |
| 5 | `hs_code_prefix_6` | string | `7324.90` | Auto-derived; used for FTA lookup |
| 6 | `nom_codes` | string (pipe-sep) | `NOM-008-CONAGUA\|NOM-010-CONAGUA` | Which NOMs apply |
| 7 | `ieps_applies` | enum | `n` | `y` / `n` — for luxury goods |
| 8 | `default_duty_rate_mfn` | decimal | `0.10` | MFN fallback rate (0.0–0.30) |
| 9 | `notes` | string | "Sanitary fittings of iron/steel" | |
| 10 | `updated_by` | email | | |
| 11 | `updated_at` | ISO datetime | | |

---

### 3.4 `FTA_Rates`

**Purpose:** Preferential duty rates per FTA × origin × HS code, with effective_date
windows so rate changes are auditable. Calculator picks the rate-in-effect at quote_date
(spec §`resolveDutyRate`).

**Shape:** long — one row per `(fta × origin × hs_prefix × effective window)`.

| # | Column | Type | Example | Notes |
|---|---|---|---|---|
| 1 | `fta_code` | string | `TLCUEM` | `USMCA` / `TLCUEM` / `AAE-MX-JP` / `TLC-AELC` / `MFN` (fallback) |
| 2 | `origin_country` | ISO-2 | `DE` | Source country |
| 3 | `hs_code_prefix` | string | `7324.90` | 6-digit HS prefix (FTA rates are negotiated at this level) |
| 4 | `preferential_rate` | decimal | `0.07` | 7% — actual rate to apply |
| 5 | `effective_from` | ISO date | `2024-01-01` | When rate becomes valid |
| 6 | `effective_until` | ISO date or blank | `2026-12-31` | Blank = open-ended |
| 7 | `source` | string | `Tarifa Ley 2026` | Authority — broker / SAT / EU bulletin |
| 8 | `notes` | string | "Reduced from 10% under Article 4.2" | |
| 9 | `updated_by` | email | | |
| 10 | `updated_at` | ISO datetime | | |

---

### 3.5 `Trafico_Events`

**Purpose:** Audit log per Trafico — every status change, doc attach, payment, note,
alert. Powers the customs detail timeline (W6) and lets us answer "what happened to
E27-26?" without diffing the Traficos sheet against history.

**Shape:** long — one row per event.

| # | Column | Type | Example | Notes |
|---|---|---|---|---|
| 1 | `event_id` | string PK | `EVT-1745035200000-471` | `EVT-{ms}-{rand3}` |
| 2 | `trafico_id` | string FK → Traficos.TRF_ID | `CC-TRF-2026-001` | |
| 3 | `timestamp` | ISO datetime | `2026-04-18T14:22:00-06:00` | |
| 4 | `actor` | string | `roger@countercultures.com.mx` | email or `system` / `antonina` / `jeanefer` |
| 5 | `event_type` | enum | `status_change` | `status_change` / `doc_attached` / `payment_logged` / `note_added` / `alert_sent` / `issue_logged` / `reconciliation` |
| 6 | `from_status` | string | `at-warehouse` | For `status_change` |
| 7 | `to_status` | string | `import-open` | For `status_change` |
| 8 | `doc_key` | string | `calculo` | For `doc_attached` — keys from spec §11-doc trail |
| 9 | `doc_drive_id` | string | `1aB2…` | For `doc_attached` |
| 10 | `amount_mxn` | decimal | `15234.56` | For `payment_logged` |
| 11 | `delay_reason` | string | `nom_cert_missing` | Internal code from spec's mapping |
| 12 | `alert_channel` | string | `whatsapp_roger` | For `alert_sent` |
| 13 | `message` | string | "Cálculo received from broker; needs Roger approval" | Free-form note |

---

## 4. Non-schema scope (also W5)

### 4.1 Migrate existing pages off sample data

Per Joshua's hard rule (no sample data; sheet-backed everywhere):

- `/dashboard/customs` — currently uses `SAMPLE_TRAFICOS` for the deal-tab integration on
  the Pipeline page. Wire to the live `Traficos` API.
- `/dashboard/shipments` — verify it's reading from the live `Shipments` API end-to-end.

### 4.2 "New Trafico" flow from a Pipeline Deal

The Deal-detail Shipments tab (line 840 of `pipeline/page.tsx`) already lists shipments.
Add: "Start New Trafico" button → slideout form → `POST /api/dashboard/traficos` with
`Status='collecting'` and the deal_id pre-tagged. (This is the v1 entry point for
Joshua/Roger to capture the start of a batch crossing.)

### 4.3 Reference-sheet read APIs

For each of the 4 reference sheets, expose `GET /api/dashboard/reference/<name>`:
- `/api/dashboard/reference/brand-nom-status`
- `/api/dashboard/reference/brand-lead-times`
- `/api/dashboard/reference/hs-codes`
- `/api/dashboard/reference/fta-rates`

These are read-only for v1. Joshua + Roger + broker maintain the data directly in Sheets.
W6's landed-cost calculator consumes them.

### 4.4 `Trafico_Events` writer

Helper `appendTraficoEvent(eventInput)` in a new `app/lib/trafico-events.ts`.
Wire it into the existing `Traficos` PUT route so every status change auto-writes an
event row. Doc-attach + payment events come later (no UI for those yet).

---

## 5. Out of scope for W5 (deferred to W6/W7/W8)

| Item | Lands in |
|---|---|
| Reference sheet *write* APIs / inline edit UI | W6 if needed |
| `Trafico_Events` UI timeline render | W6 |
| Landed-cost calculator (consumes reference sheets) | W6 |
| Risk flag derivation | W6 |
| Pipeline auto-stage rules tied to Trafico status | W7 |
| Alert engine (Roger/Finance/Customer templates) | W8 |
| Bilingual customer touchpoint templates | W8 already partially in `email-templates.ts` |

---

## 6. Open questions for Joshua

1. **Brand_Kit slug FK reality** — Brand_Kit Sheet ID `1CHIB3NX0kDSGx4sTulkYmzHn32-6yMtQ_dEqJrD9ZBs`
   has 73 brand rows with `slug` as col A. The 5 new sheets here reference `brand_slug` —
   confirming this is the FK we want (not `brand_id`). [defaulting to **slug**, change
   to brand_id if preferred]
2. **Sheet placement** — All 5 sheets live in the existing CRM Sheet
   (`GOOGLE_SHEETS_ID = 1iXG4A6bzrRSodbendoi-IVy6gi1cqiKbDado_bH7Yt0`) as new tabs?
   Or in a fresh "Shipments" Sheet under the Shared Drive (`0ALSvVEdW2-pkUk9PVA`)?
   [defaulting to **CRM Sheet new tabs** — single source per the existing pattern]
3. **`Trafico_Events` retention** — keep all events forever, or sweep > 12 months old to
   an archive? [defaulting to **keep all** for v1; volume will be < 1k rows/year]
4. **NOM codes — closed enum or freeform?** — column 3.1.2 lists 6 known codes. Should
   the schema enforce a closed list, or accept arbitrary `NOM-*` strings? [defaulting to
   **freeform** — Sheets enforcement is finicky, and new NOMs do show up]
5. **`Brand_Lead_Times` — minimum data for "live" status?** A brand row with only
   `production_days` filled is partially useful (better than nothing) but the calculator
   will fall back to defaults for missing transit/customs/domestic. OK? [defaulting to
   **yes — partial rows OK; calculator handles nulls**]

---

## 7. After approval — what happens next

1. I save this doc and write a TDD-shaped task plan as
   `docs/superpowers/specs/2026-04-18-week5-shipments-plan.md`.
2. Plan has small steps: write failing test → implement → verify → commit (each ~2-5 min).
3. Once plan is approved, execution starts (subagent or inline — your call at that point).

---

## 8. Execution log (2026-04-18, completed)

All 12 tasks from `2026-04-18-week5-shipments-plan.md` shipped inline in one
session. Tree at `9584ae7`, 7 commits ahead of `origin/main`.

| # | Task | Commit |
|---|---|---|
| 1 | Spec edit (Reality check + new SA note) | (outside-repo doc — see `SHIPMENTS_CUSTOMS_SPEC.md` line 10) |
| 2-4 | 5 sheets scaffolded + verifier + idempotent creator | `6c51a42` |
| 5 | Typed reference read helpers + round-trip test | `19b6dc8` |
| 6 | 4 GET-only reference API routes + auth-gate test | `03f9ba0` |
| 7 | Trafico_Events writer + reader lib + round-trip | `734dbcd` |
| 8 | Auto-log on Traficos POST/PUT + Traficos header bug-fix | `60f451c` |
| 9 | Pipeline Deal-detail Customs tab on live data | `a8f34f6` |
| 10 | Start New Trafico flow (option d — stub + redirect) | `9584ae7` |
| 11 | Customs page audit | (no diffs — already clean) |
| 12 | Final smoke + this log | (this commit) |

### 5 new sheets in CRM Sheet (1iXG…YT0) — sheetIds

| Sheet | sheetId |
|---|---|
| Brand_NOM_Status | 860612384 |
| Brand_Lead_Times | 1719157528 |
| HS_Code_Lookup | 1851157160 |
| FTA_Rates | 21794564 |
| Trafico_Events | 1792247272 |

All 5 are scaffolded + bolded headers, awaiting data population by Joshua + Roger
+ broker.

### Deviations from plan

- **Plan §Task 3 said "Implement minimal code"** — actually implemented full
  idempotent creator (find-or-create per tab, header upsert, header bold) so
  re-running doesn't double-create or skew formatting. Negligible extra code,
  much better DX.
- **Plan §Task 6 test was changed mid-task** — original plan asserted 200 +
  `{rows:[]}`, but routes are middleware-auth-gated so script-level fetch returns
  401 (no session cookie). Adapted test to assert "registered + auth-gated" (401
  not 404). Happy-path 200 verified separately via browser preview eval.
- **Plan §Task 7 added a `Records<string,string> &` intersection** — TS strict
  mode required it for the `readSheet<T extends Record<string,string>>` constraint.
- **Plan §Task 8 grew significantly** — surfaced a real pre-existing bug: the
  `Traficos` sheet had no header row, silently breaking `findRowIndex` (and
  therefore PUT) since the route was first written. Fixed via
  `scripts/_fix-traficos-header.ts` (one-shot). Added incidental cleanup
  (`scripts/_cleanup-test-rows.ts`, `_check-events.ts`, `_check-traficos.ts`)
  so test detritus doesn't accumulate.
- **Plan §Task 9 was bigger than envisioned** — the rich `Trafico` TS type
  (with nested `items[]`, `documents`, `calculoBreakdown`) doesn't match the
  flat `TraficoRecord` from the live sheet API. Replaced the rich-shape JSX
  with a slim live-shape render (TRF_ID / Trafico_Number / Status badge /
  Item_Count / Total_Import_Cost / "View detail →" link). The flat→rich
  hydrator is W6 scope; explicit TODO comment in the JSX.
- **Plan §Task 10 implementation = option (d)** — stub-and-redirect, not a
  form. Approved mid-execution. Toast with "Open Customs" action button.

### Open follow-ups (not blocking W5)

- **`Trafico_Items` sheet has no header row** — same pre-existing bug as
  Traficos pre-Task 8. Will silently break `findRowIndex` on PUT. Fix when
  first items land (or eagerly via a parallel `_fix-trafico-items-header.ts`).
- **`Shipments` sheet header status unconfirmed** — likely also missing.
  Worth checking.
- **W6 hydrator** — the slim live-shape rendering on the Pipeline Customs
  tab is a placeholder. W6 should build a `TraficoRecord → Trafico` hydrator
  that pulls Trafico_Items + parses `Calculo_Breakdown_JSON` + joins
  `USMCA_Certificates` + `Spanish_Manuals` rows.
- **Per-user actor on auto-log** — currently hardcoded to `"portal"` in
  `appendTraficoEvent` calls from the Traficos route. Multi-user identity
  is Phase 2 auth work.

### Final smoke (2026-04-18)

```
✅ scripts/_test-shipments-sheets.ts       — 5 tabs present + correct headers
✅ scripts/_test-shipments-reference.ts    — 4 lib reads return arrays
✅ scripts/_test-reference-apis.ts         — 4 routes registered + auth-gated
✅ scripts/_test-trafico-events.ts         — write + read round-trip OK
✅ npx tsc --noEmit                        — clean
```

W5 ships. W6 (landed-cost calculator) can begin on the foundation.
