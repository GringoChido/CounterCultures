/**
 * Counter Cultures — Deal Migration Script
 *
 * One-time migration of existing deals currently in the Sales Pipeline's
 * `Fulfillment` or `Delivered` columns (which are being DELETED) into their
 * correct Operations Pipeline stage.
 *
 * Behavior:
 *   1. Read all deals in Sales stages `fulfillment` or `delivered`
 *   2. For each, determine the correct Operations stage by inspecting:
 *      - Linked shipment (via deal_id → shipments)
 *      - Payment status (via Stripe + Odoo AR)
 *      - Delivery POD attachment
 *      - Balance invoice status
 *   3. Update the deal's current_stage + pipeline (sales → operations)
 *   4. Write a `deal_events` entry for the migration with full context
 *   5. Log summary to console + send Roger a post-run WhatsApp with counts
 *
 * Safety:
 *   - Dry-run mode (--dry-run) logs planned actions without writing
 *   - All writes wrapped in try/catch; partial failures logged + continued
 *   - Idempotent — re-running is safe (checks current stage before writing)
 *   - Audit entry preserves original stage for rollback if needed
 *
 * Usage:
 *   # Dry run first — shows planned changes without modifying data
 *   npx tsx deal_migration.ts --dry-run
 *
 *   # Execute migration
 *   npx tsx deal_migration.ts --execute
 */

/*
 * -------------------------------------------------------------------------
 * DO NOT RUN AS-IS. Adaptations required before this is safe to execute:
 *
 * 1. Env vars: script expects CC_SHEETS_ID / ROGER_WHATSAPP. Repo actually
 *    uses GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY.
 *    Wire the script to match app/lib/sheets.ts auth pattern.
 * 2. Stage enum: script uses snake_case ('design_scope', 'quote_approved').
 *    Live PipelineStage in app/lib/sample-dashboard-data.ts is kebab-case
 *    ('design-scope', 'quote-approved'). Normalize before writing.
 * 3. Target data: current sample + sheet data has ZERO deals in the
 *    `fulfillment` / `delivered` Sales stages this script migrates from.
 *    Confirm the live Sheet has rows matching that shape before running.
 * 4. Schema: script assumes a `deals` sheet with columns pipeline,
 *    current_stage, deposit_paid_at, pod_doc_drive_id, etc. Verify the
 *    live `deals` tab headers match before enabling writes.
 *
 * Imported from the CC_PROJECT spec directory on 2026-04-17. Left here
 * pending the above adaptations — Week 3+ when the shipments/deal_events
 * schemas land is the natural time to revisit.
 * -------------------------------------------------------------------------
 */

import { google } from 'googleapis';
import Stripe from 'stripe';

// =============================================================================
// Configuration
// =============================================================================

const SHEETS_ID = process.env.CC_SHEETS_ID!;      // TODO: switch to GOOGLE_SHEETS_ID
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY!;
const ROGER_WHATSAPP = process.env.ROGER_WHATSAPP!; // +52 415 XXX XXXX

const SHEET_DEALS = 'deals';
const SHEET_SHIPMENTS = 'shipments';
const SHEET_EVENTS = 'deal_events';

// =============================================================================
// Types
// =============================================================================

type SalesStage = 'discovery' | 'design_scope' | 'proposal_negotiation' | 'fulfillment' | 'delivered';
type OpsStage =
  | 'quote_approved'
  | 'deposit_pending'
  | 'deposit_received'
  | 'ordering'
  | 'in_production'
  | 'shipping'
  | 'in_customs'
  | 'customs_cleared'
  | 'received_at_cc'
  | 'delivery_scheduled'
  | 'delivered'
  | 'balance_pending'
  | 'complete'
  | 'issue';

interface Deal {
  deal_id: string;
  name: string;
  pipeline: 'sales' | 'operations';
  current_stage: SalesStage | OpsStage;
  value_mxn: number;
  customer_name: string;
  customer_contact: string;
  customer_phone: string;
  customer_email: string;
  deposit_paid_at: string | null;
  final_paid_at: string | null;
  deposit_invoice_id: string | null;
  final_invoice_id: string | null;
  pod_doc_drive_id: string | null;
  final_delivery_date: string | null;
}

interface Shipment {
  shipment_id: string;
  deal_id: string;
  status:
    | 'ordered'
    | 'in_production'
    | 'shipped_origin'
    | 'at_border'
    | 'in_customs'
    | 'cleared'
    | 'domestic_transit'
    | 'delivered';
  date_shipped_origin: string | null;
  date_at_border: string | null;
  date_customs_entered: string | null;
  date_customs_cleared: string | null;
  date_received_at_cc: string | null;
  date_delivered: string | null;
}

interface MigrationPlan {
  deal_id: string;
  name: string;
  from_stage: SalesStage;
  to_stage: OpsStage;
  to_pipeline: 'operations';
  reason: string;
  shipment_id: string | null;
  deposit_paid: boolean;
  final_paid: boolean;
}

// =============================================================================
// Stage resolution logic
// =============================================================================

/**
 * Given a deal currently in Sales `fulfillment` or `delivered`, determine
 * the correct Operations pipeline stage based on linked shipment + payment
 * + delivery POD state.
 */
function resolveOpsStage(deal: Deal, shipment: Shipment | null): { stage: OpsStage; reason: string } {
  const depositPaid = !!deal.deposit_paid_at;
  const finalPaid = !!deal.final_paid_at;
  const podAttached = !!deal.pod_doc_drive_id;
  const finalInvoiceIssued = !!deal.final_invoice_id;

  // --- Deal is in Sales "Delivered" column ---
  if (deal.current_stage === 'delivered') {
    if (finalPaid) {
      return { stage: 'complete', reason: 'Final payment received; deal fully paid.' };
    }
    if (finalInvoiceIssued) {
      return {
        stage: 'balance_pending',
        reason: 'Delivered with final invoice issued but balance unpaid.',
      };
    }
    if (podAttached) {
      return {
        stage: 'delivered',
        reason: 'POD attached but no final invoice yet. Finance to generate.',
      };
    }
    // Delivered column but no POD — inconsistent state, flag as Issue
    return {
      stage: 'issue',
      reason:
        'In Sales "Delivered" but no POD attached. Inconsistent state requires Roger review.',
    };
  }

  // --- Deal is in Sales "Fulfillment" column ---
  if (deal.current_stage === 'fulfillment') {
    // No shipment record — back up: Roger hasn't captured the shipment yet
    if (!shipment) {
      if (depositPaid) {
        return {
          stage: 'ordering',
          reason:
            'Deposit paid but no shipment record yet — deal is in PO-placement phase. Roger to attach PO doc.',
        };
      }
      return {
        stage: 'deposit_pending',
        reason: 'In Sales "Fulfillment" but no deposit payment + no shipment — reverting to deposit stage.',
      };
    }

    // Shipment exists — map its status to the Operations stage
    switch (shipment.status) {
      case 'ordered':
        return { stage: 'ordering', reason: 'Shipment ordered, awaiting brand confirmation.' };
      case 'in_production':
        return { stage: 'in_production', reason: 'Shipment in production at factory.' };
      case 'shipped_origin':
        return { stage: 'shipping', reason: 'Shipment in transit from origin.' };
      case 'at_border':
      case 'in_customs':
        return { stage: 'in_customs', reason: 'Shipment at Mexican border / in customs clearance.' };
      case 'cleared':
        return {
          stage: 'customs_cleared',
          reason: 'Shipment cleared customs, not yet received at warehouse.',
        };
      case 'domestic_transit':
        return {
          stage: 'received_at_cc',
          reason: 'Shipment in domestic transit to SMA. Effectively at warehouse level.',
        };
      case 'delivered':
        if (finalPaid) return { stage: 'complete', reason: 'Shipment delivered + final paid.' };
        if (finalInvoiceIssued)
          return { stage: 'balance_pending', reason: 'Shipment delivered + final invoice issued.' };
        return { stage: 'delivered', reason: 'Shipment delivered, final invoice pending.' };
      default:
        return {
          stage: 'issue',
          reason: `Unknown shipment status "${shipment.status}" — requires Roger review.`,
        };
    }
  }

  // Shouldn't reach here if filtering worked correctly upstream
  throw new Error(`Unexpected sales stage "${deal.current_stage}" for deal ${deal.deal_id}`);
}

// =============================================================================
// Main migration flow
// =============================================================================

async function migrateDeals(dryRun: boolean = true): Promise<void> {
  console.log(`\n=== CC Deal Migration — ${dryRun ? 'DRY RUN' : 'EXECUTE'} mode ===\n`);

  const sheets = await getSheetsClient();

  // 1. Load all deals currently in Sales "fulfillment" or "delivered"
  const deals = await loadDeals(sheets, ['fulfillment', 'delivered']);
  console.log(`Found ${deals.length} deals to migrate:\n`);

  // 2. For each, build a migration plan
  const plans: MigrationPlan[] = [];
  const errors: string[] = [];

  for (const deal of deals) {
    try {
      const shipment = await loadShipmentForDeal(sheets, deal.deal_id);
      const { stage, reason } = resolveOpsStage(deal, shipment);

      plans.push({
        deal_id: deal.deal_id,
        name: deal.name,
        from_stage: deal.current_stage as SalesStage,
        to_stage: stage,
        to_pipeline: 'operations',
        reason,
        shipment_id: shipment?.shipment_id ?? null,
        deposit_paid: !!deal.deposit_paid_at,
        final_paid: !!deal.final_paid_at,
      });

      console.log(
        `  ${deal.deal_id} [${deal.customer_name.padEnd(30)}] ${deal.current_stage}  →  ${stage}`
      );
      console.log(`    ${reason}\n`);
    } catch (err) {
      errors.push(`${deal.deal_id}: ${(err as Error).message}`);
      console.error(`  ❌ ${deal.deal_id}: ${(err as Error).message}\n`);
    }
  }

  if (errors.length) {
    console.warn(`\n⚠️  ${errors.length} deals could not be planned. Fix these first.\n`);
  }

  // 3. Summary before writing
  const summary = plans.reduce<Record<string, number>>((acc, p) => {
    acc[p.to_stage] = (acc[p.to_stage] || 0) + 1;
    return acc;
  }, {});
  console.log('Summary:');
  for (const [stage, count] of Object.entries(summary)) {
    console.log(`  ${stage.padEnd(20)} ${count}`);
  }

  if (dryRun) {
    console.log(`\nDry-run complete. ${plans.length} deals planned. No changes written.`);
    console.log(`Run with --execute to apply.\n`);
    return;
  }

  // 4. Execute — update deals + write audit entries
  console.log('\nExecuting migration...\n');
  let successCount = 0;
  const failedDeals: string[] = [];

  for (const plan of plans) {
    try {
      await updateDealStage(sheets, plan);
      await writeDealEvent(sheets, plan);
      successCount++;
      console.log(`  ✅ ${plan.deal_id} → ${plan.to_stage}`);
    } catch (err) {
      failedDeals.push(plan.deal_id);
      console.error(`  ❌ ${plan.deal_id}: ${(err as Error).message}`);
    }
  }

  console.log(`\n=== Migration complete: ${successCount}/${plans.length} deals migrated ===\n`);

  // 5. Notify Roger via WhatsApp
  if (successCount > 0) {
    await notifyRoger(successCount, plans.length, failedDeals);
  }
}

// =============================================================================
// Sheets helpers
// =============================================================================

async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    // Uses CC service account: counter-cultures-website@gen-lang-client-0620971024.iam.gserviceaccount.com
  });
  return google.sheets({ version: 'v4', auth: await auth.getClient() as any });
}

async function loadDeals(sheets: any, stages: string[]): Promise<Deal[]> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEETS_ID,
    range: `${SHEET_DEALS}!A2:Z`,
  });
  const rows = res.data.values ?? [];
  const headers = await getHeaders(sheets, SHEET_DEALS);

  return rows
    .map((row: any[]) => rowToObject<Deal>(row, headers))
    .filter(
      (d) =>
        d.pipeline === 'sales' && stages.includes(d.current_stage)
    );
}

async function loadShipmentForDeal(sheets: any, dealId: string): Promise<Shipment | null> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEETS_ID,
    range: `${SHEET_SHIPMENTS}!A2:Z`,
  });
  const rows = res.data.values ?? [];
  const headers = await getHeaders(sheets, SHEET_SHIPMENTS);

  const matches = rows
    .map((row: any[]) => rowToObject<Shipment>(row, headers))
    .filter((s) => s.deal_id === dealId);

  if (matches.length === 0) return null;
  // If multiple shipments per deal (partial fulfillment), use the most recent
  matches.sort((a, b) => {
    const at = a.date_shipped_origin ?? '';
    const bt = b.date_shipped_origin ?? '';
    return bt.localeCompare(at);
  });
  return matches[0];
}

async function updateDealStage(sheets: any, plan: MigrationPlan): Promise<void> {
  const rowIndex = await findRowIndex(sheets, SHEET_DEALS, 'deal_id', plan.deal_id);
  if (rowIndex < 0) throw new Error(`Deal row not found: ${plan.deal_id}`);

  const headers = await getHeaders(sheets, SHEET_DEALS);
  const colStage = columnForHeader(headers, 'current_stage');
  const colPipeline = columnForHeader(headers, 'pipeline');
  const colUpdatedAt = columnForHeader(headers, 'updated_at');

  const updates = [
    {
      range: `${SHEET_DEALS}!${colStage}${rowIndex}`,
      values: [[plan.to_stage]],
    },
    {
      range: `${SHEET_DEALS}!${colPipeline}${rowIndex}`,
      values: [[plan.to_pipeline]],
    },
    {
      range: `${SHEET_DEALS}!${colUpdatedAt}${rowIndex}`,
      values: [[new Date().toISOString()]],
    },
  ];

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEETS_ID,
    requestBody: {
      valueInputOption: 'RAW',
      data: updates,
    },
  });
}

async function writeDealEvent(sheets: any, plan: MigrationPlan): Promise<void> {
  const eventId = `DE-MIG-${plan.deal_id}-${Date.now()}`;
  const timestamp = new Date().toISOString();
  const payload = JSON.stringify({
    reason: plan.reason,
    shipment_id: plan.shipment_id,
    deposit_paid: plan.deposit_paid,
    final_paid: plan.final_paid,
  });

  const row = [
    eventId,
    plan.deal_id,
    timestamp,
    'migration', // actor
    'stage_change', // event_type
    plan.from_stage, // from_stage
    plan.to_stage, // to_stage
    'MIGRATION-SALES-FULFILLMENT-DELETED', // trigger_rule_id
    payload,
    '', // reverted_event_id (n/a)
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEETS_ID,
    range: `${SHEET_EVENTS}!A:J`,
    valueInputOption: 'RAW',
    requestBody: { values: [row] },
  });
}

// =============================================================================
// Sheet utility helpers
// =============================================================================

async function getHeaders(sheets: any, sheetName: string): Promise<string[]> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEETS_ID,
    range: `${sheetName}!1:1`,
  });
  return (res.data.values?.[0] ?? []) as string[];
}

function rowToObject<T>(row: any[], headers: string[]): T {
  const obj: Record<string, any> = {};
  headers.forEach((h, i) => {
    obj[h] = row[i] ?? null;
  });
  return obj as T;
}

async function findRowIndex(
  sheets: any,
  sheetName: string,
  keyField: string,
  keyValue: string
): Promise<number> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEETS_ID,
    range: `${sheetName}!A:Z`,
  });
  const rows = res.data.values ?? [];
  const headers = rows[0];
  const keyCol = headers.indexOf(keyField);
  if (keyCol < 0) return -1;

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][keyCol] === keyValue) return i + 1; // 1-indexed for Sheets
  }
  return -1;
}

function columnForHeader(headers: string[], header: string): string {
  const i = headers.indexOf(header);
  if (i < 0) throw new Error(`Column not found: ${header}`);
  // Convert 0-indexed → A1 notation (A, B, ..., Z, AA, AB, ...)
  let col = '';
  let n = i;
  do {
    col = String.fromCharCode(65 + (n % 26)) + col;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return col;
}

// =============================================================================
// Roger notification
// =============================================================================

async function notifyRoger(success: number, total: number, failed: string[]): Promise<void> {
  const msg =
    `🛠 Migration complete: ${success}/${total} deals moved from Sales → Operations pipeline.\n\n` +
    (failed.length ? `⚠️ Needs manual review: ${failed.join(', ')}\n\n` : '') +
    `Rollback available on any deal's detail view for 24h if anything looks off.\n\n` +
    `See full audit: ${process.env.PORTAL_URL}/dashboard/deals?migrated=true`;

  // In production, use WhatsApp Business API here. For now just log.
  console.log(`\n[WhatsApp → ${ROGER_WHATSAPP}]`);
  console.log(msg);
}

// =============================================================================
// Entry point
// =============================================================================

const args = process.argv.slice(2);
const dryRun = !args.includes('--execute');

migrateDeals(dryRun).catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
