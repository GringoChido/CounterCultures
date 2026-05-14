import { NextResponse, type NextRequest } from "next/server";
import {
  readSheet,
  appendRowByHeader,
  updateRowByHeader,
  findRowIndex,
} from "@/app/lib/dashboard-sheets";
import { ensureColumns } from "@/app/lib/sheet-migrations";

type LeadRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  contact_type: string;
  interest: string;
  value: string;
  created_at: string;
  next_followup: string;
  last_contact_date: string;
  brand_slugs: string; // pipe-separated ("kohler|dornbracht")
  /**
   * R2-2: which rep owns this lead. Compared against currentUser.name in
   * the Mine/All filter. Empty for unassigned leads.
   */
  assigned_rep: string;
  /**
   * R4 Note 8: explicit marketing-bucket override. Empty → derive from
   * contact_type via app/lib/customer-segments.ts.
   * Values: "builder" | "designer" | "end-user" | "" (unset).
   */
  marketing_segment: string;
  notes: string;
  source_message_id: string;
  classifier_brands: string; // pipe-separated, populated by /leads/classify
  classifier_skus: string; // pipe-separated
  classifier_profession: string; // Architect | Designer | Builder | Hospitality | Homeowner | Unknown
  classifier_confidence: string; // string-encoded float 0-1
  classifier_run_at: string; // ISO timestamp of last classifier run
};

const LEAD_COLUMNS: (keyof LeadRecord)[] = [
  "id",
  "name",
  "email",
  "phone",
  "source",
  "status",
  "contact_type",
  "interest",
  "value",
  "created_at",
  "next_followup",
  "last_contact_date",
  "brand_slugs",
  "assigned_rep",
  "marketing_segment",
  "notes",
  "source_message_id",
  "classifier_brands",
  "classifier_skus",
  "classifier_profession",
  "classifier_confidence",
  "classifier_run_at",
];

const R4_NOTE_8_COLUMNS = ["marketing_segment"];

// Sheets with valueInputOption=USER_ENTERED evaluates any cell starting
// with + = - @ as a formula, so phones like "+52 415 …" become #ERROR!.
// Leading apostrophe is the canonical escape — Sheets strips it on read.
const escapeFormula = (v: string): string =>
  typeof v === "string" && /^[+=\-@]/.test(v) ? `'${v}` : v;

const recordToFields = (
  body: Partial<LeadRecord>
): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const col of LEAD_COLUMNS) {
    out[col] = escapeFormula(body[col] ?? "");
  }
  return out;
};

// GET — list all leads, optionally filter by status
export const GET = async (request: NextRequest) => {
  const status = request.nextUrl.searchParams.get("status");

  try {
    let leads = await readSheet<LeadRecord>("Leads");

    if (status && status !== "all") {
      leads = leads.filter((l) => l.status === status);
    }

    return NextResponse.json({ leads });
  } catch (err) {
    console.error("[Leads API] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
};

// POST — create a new lead
export const POST = async (request: NextRequest) => {
  try {
    const body: LeadRecord = await request.json();

    if (!body.id) {
      body.id = `LEAD-${Date.now()}`;
    }
    if (!body.created_at) {
      body.created_at = new Date().toISOString();
    }

    await ensureColumns("Leads", R4_NOTE_8_COLUMNS);
    await appendRowByHeader("Leads", recordToFields(body));

    return NextResponse.json({ success: true, id: body.id });
  } catch (err) {
    console.error("[Leads API] POST error:", err);
    return NextResponse.json(
      { error: "Failed to create lead" },
      { status: 500 }
    );
  }
};

// PATCH — update an existing lead by id
export const PATCH = async (request: NextRequest) => {
  try {
    const body: Partial<LeadRecord> & { id: string } = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const rowIdx = await findRowIndex("Leads", "id", body.id);
    if (rowIdx === null) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    // updateRowByHeader merges with existing row internally, so we don't
    // need to readSheet+merge here — we only pass the fields we want to
    // change. Unknown fields are preserved.
    await ensureColumns("Leads", R4_NOTE_8_COLUMNS);
    await updateRowByHeader("Leads", rowIdx, recordToFields(body));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Leads API] PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update lead" },
      { status: 500 }
    );
  }
};
