# Week 5 Shipments — Implementation Plan

> **Status:** Draft awaiting Joshua's approval (2026-04-18)
> **Workflow:** superpowers/Phase 2 plan
> **Design:** `2026-04-18-week5-shipments-design.md` (approved 2026-04-18)
> **TDD style:** project precedent — `scripts/_test-*.ts` round-trip scripts run via `tsx`

---

## Constants used throughout

```
CRM_SHEET_ID         = 1iXG4A6bzrRSodbendoi-IVy6gi1cqiKbDado_bH7Yt0   (env GOOGLE_SHEETS_ID)
BRAND_KIT_SHEET_ID   = 1CHIB3NX0kDSGx4sTulkYmzHn32-6yMtQ_dEqJrD9ZBs
SHARED_DRIVE_ID      = 0ALSvVEdW2-pkUk9PVA
SA_EMAIL             = counter-portal-website@counter-portal-493716.iam.gserviceaccount.com
NEW_SHEETS           = Brand_NOM_Status, Brand_Lead_Times, HS_Code_Lookup, FTA_Rates, Trafico_Events
```

## Conventions per design doc §2

- Sheet names: `Title_Case_Underscore`
- Column names: `snake_case`
- IDs: `EVT-{ms}-{rand3}` for events; `LEAD-` / `TRF-` patterns continue as-is

## Commit cadence

Each task ends with a commit if the task is a coherent unit. Plan has **12 tasks → 8
commits** (some tasks are pure verification with no diff to commit).

---

## Task 1 — Edit `SHIPMENTS_CUSTOMS_SPEC.md` with the "Reality check" section

**Action:** Add a new §0.5 between the front matter and §Part 1 of the spec, ~30 lines,
explaining that Traficos + PedimentoItem are now the canonical shipment model.

**File:** `/Users/joshuasemolik/Desktop/counter-cultures/SHIPMENTS_CUSTOMS_SPEC.md`

**Insertion point:** after line 8 (the maintainer header), before line 10 (`---`).

**Content (verbatim):**

```markdown
---

## §0.5 Reality check (added 2026-04-18)

This spec was originally drafted assuming a flat per-vendor `shipments` table. The portal
already runs a richer two-level model that matches the broker's actual workflow:

- **`Traficos`** (parent batch crossing) — owns broker, warehouse, pedimento, calculo
  breakdown, 11-doc trail, 16-state status, dual carriers, expediente.
- **`PedimentoItem`** (child vendor row inside a Trafico) — owns USMCA cert, country of
  origin, Spanish manuals, products[].

This spec is updated to use those as the canonical shipment model:

- Original §Part 1 / §Sheet 1 `shipments` ↔ existing `Traficos` (no change to that 41-col
  schema in W5).
- Original §Part 1 / §Sheet 2 `shipment_line_items` ↔ `PedimentoItem.products[]`
  (already JSON-embedded in `customs-data.ts`).
- Original §Part 1 / §Sheet 3 `shipment_events` is replaced by a new `Trafico_Events`
  audit log (designed in W5, schema in `docs/superpowers/specs/2026-04-18-week5-shipments-design.md`).
- The 8-state status enum in the original §Part 1 (`ordered → in_production → ... →
  delivered`) is **deprecated** in favor of the existing 16-state `TraficoStatus`
  (`collecting → sent-to-broker → ... → complete`) which the broker actually uses.

Everything downstream (NOM matrix, lead-time table, HS code lookup, FTA rates, landed-
cost calculator in W6, alert engine in W8) keys on Traficos + PedimentoItem instead of
synthetic per-vendor `shipments` rows.

---
```

**Verify:** `grep -n "Reality check" SHIPMENTS_CUSTOMS_SPEC.md` returns the new heading.

**Commit:** `docs(shipments): align spec with existing Traficos + PedimentoItem model`

---

## Task 2 — Write verifier script `scripts/_test-shipments-sheets.ts`

**Action:** Script that reads the 5 expected tabs from the CRM Sheet, confirms each has
the right header row.

**File:** `scripts/_test-shipments-sheets.ts`

**Skeleton:**

```ts
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

const EXPECTED: Record<string, string[]> = {
  Brand_NOM_Status: [
    "brand_slug", "nom_code", "status", "applies_to_skus", "cert_drive_folder_id",
    "last_verified_date", "expires_date", "notes", "updated_by", "updated_at",
  ],
  Brand_Lead_Times: [
    "brand_slug", "production_days", "transit_sea_days", "transit_air_days",
    "transit_truck_days", "customs_avg_days", "domestic_avg_days",
    "last_verified_date", "notes", "updated_by", "updated_at",
  ],
  HS_Code_Lookup: [
    "category_slug", "display_name_en", "display_name_es", "hs_code",
    "hs_code_prefix_6", "nom_codes", "ieps_applies", "default_duty_rate_mfn",
    "notes", "updated_by", "updated_at",
  ],
  FTA_Rates: [
    "fta_code", "origin_country", "hs_code_prefix", "preferential_rate",
    "effective_from", "effective_until", "source", "notes", "updated_by", "updated_at",
  ],
  Trafico_Events: [
    "event_id", "trafico_id", "timestamp", "actor", "event_type",
    "from_status", "to_status", "doc_key", "doc_drive_id", "amount_mxn",
    "delay_reason", "alert_channel", "message",
  ],
};

const main = async () => {
  const { google } = await import("googleapis");
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const id = process.env.GOOGLE_SHEETS_ID!;

  let failures = 0;
  for (const [sheet, expected] of Object.entries(EXPECTED)) {
    try {
      const r = await sheets.spreadsheets.values.get({
        spreadsheetId: id, range: `${sheet}!1:1`,
      });
      const actual = r.data.values?.[0] ?? [];
      const ok = actual.length === expected.length && actual.every((v, i) => v === expected[i]);
      console.log(ok ? `✓ ${sheet}` : `✗ ${sheet} — header mismatch:\n   expected: ${expected.join(",")}\n   actual:   ${actual.join(",")}`);
      if (!ok) failures++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`✗ ${sheet} — ${msg}`);
      failures++;
    }
  }
  console.log(failures === 0 ? "\n✅ All 5 tabs present with correct headers." : `\n❌ ${failures} failures`);
  process.exit(failures === 0 ? 0 : 1);
};
main().catch((e) => { console.error(e); process.exit(1); });
```

**Run:** `npx tsx scripts/_test-shipments-sheets.ts`

**Expected:** ❌ 5 failures (tabs don't exist yet) — RED.

**No commit yet.**

---

## Task 3 — Write creator script `scripts/_create-shipments-sheets.ts`

**Action:** Idempotent creator. For each tab: if it doesn't exist, create with
`spreadsheets.batchUpdate addSheet`. Then write the header row via `values.update`.
If header row already correct, no-op.

**File:** `scripts/_create-shipments-sheets.ts`

**Logic:**

```ts
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

const HEADERS: Record<string, string[]> = { /* same as Task 2 EXPECTED */ };

const main = async () => {
  const { google } = await import("googleapis");
  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL, private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n") },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existingTitles = new Set((meta.data.sheets ?? []).map((s) => s.properties?.title));

  for (const [title, headers] of Object.entries(HEADERS)) {
    if (!existingTitles.has(title)) {
      console.log(`+ create tab "${title}"`);
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests: [{ addSheet: { properties: { title } } }] },
      });
    } else {
      console.log(`= tab "${title}" exists`);
    }
    // Always upsert headers (idempotent overwrite)
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${title}!A1:${String.fromCharCode(64 + headers.length)}1`,
      valueInputOption: "RAW",
      requestBody: { values: [headers] },
    });
    // Bold the header row
    const sheetMeta = (await sheets.spreadsheets.get({ spreadsheetId, ranges: [`${title}!A1`] })).data.sheets ?? [];
    const sheetId = sheetMeta.find((s) => s.properties?.title === title)?.properties?.sheetId;
    if (sheetId !== undefined && sheetId !== null) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            repeatCell: {
              range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
              cell: { userEnteredFormat: { textFormat: { bold: true } } },
              fields: "userEnteredFormat.textFormat.bold",
            },
          }],
        },
      });
    }
    console.log(`  headers written (${headers.length})`);
  }
  console.log("\n✅ Done — all 5 tabs scaffolded.");
};
main().catch((e) => { console.error(e); process.exit(1); });
```

**No commit yet.**

---

## Task 4 — Run creator + verify GREEN + commit

```sh
npx tsx scripts/_create-shipments-sheets.ts        # creates the tabs
npx tsx scripts/_test-shipments-sheets.ts          # should print ✅
```

**Expected:** GREEN.

**Then re-run creator** — confirm idempotent (no errors, headers unchanged):
```sh
npx tsx scripts/_create-shipments-sheets.ts        # second run, no-op-ish
npx tsx scripts/_test-shipments-sheets.ts          # still ✅
```

**Commit:** `feat(shipments): scaffold 5 reference + audit sheets in CRM Sheet`
- Files: `scripts/_create-shipments-sheets.ts`, `scripts/_test-shipments-sheets.ts`

---

## Task 5 — Write reference read lib + test

**Action:** Create `app/lib/shipments-reference.ts` with 4 typed read functions (long-
form helpers wrap the existing `readSheet` from `dashboard-sheets.ts`).

**File:** `app/lib/shipments-reference.ts`

```ts
import { readSheet } from "./dashboard-sheets";

export interface BrandNomStatus {
  brand_slug: string; nom_code: string; status: string;
  applies_to_skus?: string; cert_drive_folder_id?: string;
  last_verified_date?: string; expires_date?: string; notes?: string;
  updated_by?: string; updated_at?: string;
}
export interface BrandLeadTimes {
  brand_slug: string;
  production_days?: string; transit_sea_days?: string; transit_air_days?: string;
  transit_truck_days?: string; customs_avg_days?: string; domestic_avg_days?: string;
  last_verified_date?: string; notes?: string;
  updated_by?: string; updated_at?: string;
}
export interface HsCode {
  category_slug: string; display_name_en: string; display_name_es: string;
  hs_code: string; hs_code_prefix_6: string; nom_codes?: string;
  ieps_applies?: string; default_duty_rate_mfn?: string; notes?: string;
  updated_by?: string; updated_at?: string;
}
export interface FtaRate {
  fta_code: string; origin_country: string; hs_code_prefix: string;
  preferential_rate: string; effective_from: string; effective_until?: string;
  source?: string; notes?: string;
  updated_by?: string; updated_at?: string;
}

export const getBrandNomStatus = () => readSheet<BrandNomStatus>("Brand_NOM_Status");
export const getBrandLeadTimes = () => readSheet<BrandLeadTimes>("Brand_Lead_Times");
export const getHsCodes        = () => readSheet<HsCode>("HS_Code_Lookup");
export const getFtaRates       = () => readSheet<FtaRate>("FTA_Rates");
```

**Test:** `scripts/_test-shipments-reference.ts` — call each, expect `Array.isArray` + (likely empty since sheets are scaffolded but unpopulated):

```ts
const main = async () => {
  const { getBrandNomStatus, getBrandLeadTimes, getHsCodes, getFtaRates } =
    await import("../app/lib/shipments-reference");
  const checks = [
    ["Brand_NOM_Status", await getBrandNomStatus()],
    ["Brand_Lead_Times", await getBrandLeadTimes()],
    ["HS_Code_Lookup",   await getHsCodes()],
    ["FTA_Rates",        await getFtaRates()],
  ] as const;
  let fail = 0;
  for (const [name, rows] of checks) {
    const ok = Array.isArray(rows);
    console.log(ok ? `✓ ${name} — ${rows.length} rows` : `✗ ${name} — not array: ${typeof rows}`);
    if (!ok) fail++;
  }
  console.log(fail === 0 ? "\n✅ All reads OK." : `\n❌ ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
};
```

**Run:** `npx tsx scripts/_test-shipments-reference.ts` — should be GREEN immediately
since the sheets exist (Task 4) and the lib just wraps `readSheet`.

**Commit:** `feat(shipments): typed read helpers for 4 reference sheets`
- Files: `app/lib/shipments-reference.ts`, `scripts/_test-shipments-reference.ts`

---

## Task 6 — Write 4 reference GET routes + test

**Action:** 4 new routes that wrap the lib helpers.

**Files:**
- `app/api/dashboard/reference/brand-nom-status/route.ts`
- `app/api/dashboard/reference/brand-lead-times/route.ts`
- `app/api/dashboard/reference/hs-codes/route.ts`
- `app/api/dashboard/reference/fta-rates/route.ts`

Each route:

```ts
import { NextResponse } from "next/server";
import { getBrandNomStatus } from "@/app/lib/shipments-reference"; // or matching helper
export const GET = async () => {
  try {
    const rows = await getBrandNomStatus();
    return NextResponse.json({ rows });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "fetch_failed";
    console.error("[reference brand-nom-status]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
};
```

**Test:** `scripts/_test-reference-apis.ts` — fetch each endpoint via `http://localhost:3000`,
expect 200 + `{rows:[]}` shape.

```ts
const main = async () => {
  const base = "http://localhost:3000/api/dashboard/reference";
  const endpoints = ["brand-nom-status", "brand-lead-times", "hs-codes", "fta-rates"];
  let fail = 0;
  for (const ep of endpoints) {
    const r = await fetch(`${base}/${ep}`);
    const data = await r.json();
    const ok = r.ok && Array.isArray(data.rows);
    console.log(ok ? `✓ ${ep} — ${data.rows.length} rows` : `✗ ${ep} — ${r.status} ${JSON.stringify(data).slice(0, 100)}`);
    if (!ok) fail++;
  }
  console.log(fail === 0 ? "\n✅ All 4 routes OK." : `\n❌ ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
};
```

**Run:**
```sh
# dev server already running; run the test
npx tsx scripts/_test-reference-apis.ts
```

**Expected:** GREEN.

**Commit:** `feat(shipments): GET endpoints for 4 reference sheets`
- Files: 4 new route.ts files + `scripts/_test-reference-apis.ts`

---

## Task 7 — Write `Trafico_Events` lib + test

**Action:** Create `app/lib/trafico-events.ts` with `appendTraficoEvent` and
`getTraficoEvents(traficoId?)`.

**File:** `app/lib/trafico-events.ts`

```ts
import { appendRow, readSheet } from "./dashboard-sheets";

export interface TraficoEvent {
  event_id: string; trafico_id: string; timestamp: string; actor: string;
  event_type: string; from_status?: string; to_status?: string;
  doc_key?: string; doc_drive_id?: string; amount_mxn?: string;
  delay_reason?: string; alert_channel?: string; message?: string;
}

export interface AppendTraficoEventInput {
  trafico_id: string; actor: string; event_type: string;
  from_status?: string; to_status?: string;
  doc_key?: string; doc_drive_id?: string; amount_mxn?: number;
  delay_reason?: string; alert_channel?: string; message?: string;
}

const COLUMNS: (keyof TraficoEvent)[] = [
  "event_id", "trafico_id", "timestamp", "actor", "event_type",
  "from_status", "to_status", "doc_key", "doc_drive_id", "amount_mxn",
  "delay_reason", "alert_channel", "message",
];

export const appendTraficoEvent = async (input: AppendTraficoEventInput): Promise<TraficoEvent> => {
  const event_id = `EVT-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;
  const row: TraficoEvent = {
    event_id,
    trafico_id: input.trafico_id,
    timestamp: new Date().toISOString(),
    actor: input.actor,
    event_type: input.event_type,
    from_status: input.from_status ?? "",
    to_status: input.to_status ?? "",
    doc_key: input.doc_key ?? "",
    doc_drive_id: input.doc_drive_id ?? "",
    amount_mxn: input.amount_mxn !== undefined ? String(input.amount_mxn) : "",
    delay_reason: input.delay_reason ?? "",
    alert_channel: input.alert_channel ?? "",
    message: input.message ?? "",
  };
  await appendRow("Trafico_Events", COLUMNS.map((c) => row[c] ?? ""));
  return row;
};

export const getTraficoEvents = async (traficoId?: string): Promise<TraficoEvent[]> => {
  const all = await readSheet<TraficoEvent>("Trafico_Events");
  return traficoId ? all.filter((e) => e.trafico_id === traficoId) : all;
};
```

**Test:** `scripts/_test-trafico-events.ts` — append a test event, read it back, verify
shape, then delete the row by overwriting it (or accept a dirty test row in dev).

For v1 the test leaves one test row in `Trafico_Events` (cleanup not trivial since we
can't easily delete a row by ID without `findRowIndex` + an updateRow-to-blank pattern).
Alternative: use a `__test__` prefix on `event_id` so it's filterable.

```ts
const main = async () => {
  const { appendTraficoEvent, getTraficoEvents } = await import("../app/lib/trafico-events");
  const event = await appendTraficoEvent({
    trafico_id: "__TEST__",
    actor: "test-script",
    event_type: "note_added",
    message: `superpowers test @ ${new Date().toISOString()}`,
  });
  console.log(`+ wrote event ${event.event_id}`);
  const back = await getTraficoEvents("__TEST__");
  const found = back.find((e) => e.event_id === event.event_id);
  if (!found) throw new Error("Round-trip read missed the new event");
  console.log(`✓ read back event id=${found.event_id} actor=${found.actor}`);
  console.log("\n✅ Trafico_Events round-trip OK. (left one __TEST__ row in the sheet — cleanup is a separate concern.)");
};
```

**Run:** `npx tsx scripts/_test-trafico-events.ts` — GREEN.

**Commit:** `feat(shipments): Trafico_Events writer + reader lib`
- Files: `app/lib/trafico-events.ts`, `scripts/_test-trafico-events.ts`

---

## Task 8 — Wire `appendTraficoEvent` into the existing Traficos PUT route

**Action:** When a Traficos row is updated, if `Status` changes from old → new, write
a `status_change` event automatically.

**File:** `app/api/dashboard/traficos/route.ts` — modify the `PUT` handler.

**Change:**

Before the `updateRow` call, fetch the current row (via existing `findRowIndex` + read
the existing sheet snapshot) so we know the old `Status`. After `updateRow` succeeds,
if `oldStatus !== newStatus`, call `appendTraficoEvent`.

Pseudo-diff:

```ts
// existing PUT handler — load current row before updateRow
const all = await readSheet<TraficoRecord>("Traficos");
const old = all.find((t) => t.TRF_ID === TRF_ID);
const oldStatus = old?.Status;

// ... existing updateRow logic ...

if (oldStatus && oldStatus !== body.Status) {
  await appendTraficoEvent({
    trafico_id: TRF_ID,
    actor: "portal", // TODO: use authenticated user once auth is wired
    event_type: "status_change",
    from_status: oldStatus,
    to_status: body.Status,
    message: `Status changed via Traficos PUT`,
  }).catch((err) => console.error("[Trafico PUT] event log failed:", err));
}
```

**Verify manually:** PUT a Traficos row to a new status via curl OR via the existing UI.
Then `getTraficoEvents("CC-TRF-2026-001")` should include the status_change event.

For now, just verify by re-running `_test-trafico-events.ts` — the test row count will
not change (we don't trigger PUT in the test). A separate PUT verification can be
manual or deferred.

**Commit:** `feat(shipments): auto-log status changes on Traficos PUT`
- Files: `app/api/dashboard/traficos/route.ts`

---

## Task 9 — Migrate Pipeline Deal-detail off `SAMPLE_TRAFICOS`

**Action:** The Deal detail's Shipments tab (around line 1484 of
`app/(dashboard)/dashboard/(portal)/pipeline/page.tsx`) currently filters
`SAMPLE_TRAFICOS`. Replace with a fetch to `/api/dashboard/traficos?dealId=...`.

**File:** `app/(dashboard)/dashboard/(portal)/pipeline/page.tsx`

**Steps:**

1. Read lines around 1484 to see the current filter pattern.
2. Add a state hook (or extend existing) that fetches Traficos for the open deal.
3. Replace `SAMPLE_TRAFICOS.filter(...)` with the fetched list.
4. Remove the `SAMPLE_TRAFICOS` import if no longer used elsewhere.

**Verify in preview:**
```
preview_eval: window.location.href = '/dashboard/pipeline'; click a deal; click Shipments tab → empty state (Traficos sheet has 0 rows yet) without errors.
```

**Commit:** `chore(pipeline): live Traficos fetch on Deal-detail Shipments tab (no sample data)`
- Files: `pipeline/page.tsx`

---

## Task 10 — "Start New Trafico" button + slideout from Deal-detail

**Action:** Add a button to the Deal-detail Shipments tab → opens a slideout with a
minimal form (trafico_number, broker_name, broker_email, status='collecting') →
POST to existing `/api/dashboard/traficos`.

**Files:**
- `app/(dashboard)/dashboard/(portal)/pipeline/page.tsx` (button + slideout state)
- New tiny component is optional — inline JSX is fine for this small form

**Form fields (minimum):**

| Field | Type | Default | Notes |
|---|---|---|---|
| `Trafico_Number` | text | — | Broker's reference, e.g., "E27-26" |
| `Broker_Name` | text | "Jeanefer Contreras" | Pre-filled from last Trafico if any |
| `Broker_Email` | text | "jeanefer_jeco@hotmail.com" | Pre-filled |
| `Status` | hidden | `collecting` | Always starts here |
| `Initiated_Date` | hidden | `today ISO` | |

(Generates `TRF_ID` via existing pattern: `CC-TRF-{YYYY}-{seq}` — server-side or client-
side? The existing POST handler uses `body.Shipment_ID` directly with no auto-generation,
so client provides the ID. For v1, generate it client-side as `CC-TRF-${year}-${random
3-digit}` and let Roger edit before submit.)

**Verify in preview:**
1. Open a deal, switch to Shipments tab
2. Click "Start New Trafico"
3. Fill the form, submit
4. Refresh — see new Trafico in the list (and a row in the Traficos sheet)
5. Optional: also see a `Trafico_Events` row (Task 8 should auto-create one if Status
   change is detected — but on initial create the previous status is undefined, so
   no event fires; this is correct behavior)

**Commit:** `feat(pipeline): Start New Trafico flow from Deal-detail Shipments tab`
- Files: `pipeline/page.tsx`

---

## Task 11 — Verify `/dashboard/customs` is fully off sample data

**Action:** Audit `/dashboard/customs/page.tsx` and any other pages that import
`SAMPLE_TRAFICOS` from `sample-dashboard-data.ts`. Confirm production-path uses live
Traficos API. If any sample-data references remain, replace.

**Verify in preview:**
- `/dashboard/customs` loads without errors with empty state (0 traficos)
- After Task 10, the Trafico created from a Deal also appears here

**Commit:** `chore(customs): audit + remove residual sample-data references` (only if
diffs exist; if already clean, no commit)

---

## Task 12 — Update design doc with execution notes + final smoke test

**Action:**
1. Append a §8 "Execution log" to the design doc with a summary of any deviations
   from this plan, commit SHAs, and any TODOs surfaced during implementation.
2. Run all 5 round-trip tests in sequence to confirm everything still passes:
   ```sh
   npx tsx scripts/_test-shipments-sheets.ts
   npx tsx scripts/_test-shipments-reference.ts
   npx tsx scripts/_test-reference-apis.ts
   npx tsx scripts/_test-trafico-events.ts
   ```
3. `npx tsc --noEmit` — clean (excluding the stale `routes.d 2.ts` dup).

**Commit:** `docs(shipments): execution log + final smoke results`
- Files: `docs/superpowers/specs/2026-04-18-week5-shipments-design.md`

---

## Summary

12 tasks → 8 commits. Estimated execution time: 60-90 minutes.

| # | Task | Commit |
|---|---|---|
| 1 | Spec edit | `docs(shipments): align spec with existing Traficos + PedimentoItem model` |
| 2 | Verifier (RED) | (no commit) |
| 3 | Creator | (no commit) |
| 4 | Run + verify GREEN | `feat(shipments): scaffold 5 reference + audit sheets in CRM Sheet` |
| 5 | Reference lib | `feat(shipments): typed read helpers for 4 reference sheets` |
| 6 | 4 reference APIs | `feat(shipments): GET endpoints for 4 reference sheets` |
| 7 | Trafico_Events lib | `feat(shipments): Trafico_Events writer + reader lib` |
| 8 | PUT auto-log | `feat(shipments): auto-log status changes on Traficos PUT` |
| 9 | Pipeline live fetch | `chore(pipeline): live Traficos fetch on Deal-detail Shipments tab` |
| 10 | New Trafico flow | `feat(pipeline): Start New Trafico flow from Deal-detail Shipments tab` |
| 11 | Customs audit | (commit only if diffs) |
| 12 | Final + log | `docs(shipments): execution log + final smoke results` |
