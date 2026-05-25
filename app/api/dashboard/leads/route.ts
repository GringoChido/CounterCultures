import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser, requireFeature, FeatureDeniedError } from "@/app/lib/auth";
import {
  readSheet,
  appendRowByHeader,
  appendRow,
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
  brand_slugs: string;
  assigned_rep: string;
  marketing_segment: string;
  notes: string;
  source_message_id: string;
  classifier_brands: string;
  classifier_skus: string;
  classifier_profession: string;
  classifier_confidence: string;
  classifier_run_at: string;
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

const PostBody = z.object({
  name: z.string().min(1),
  email: z.string().email().or(z.literal("")).optional().default(""),
  phone: z.string().optional().default(""),
  source: z.string().optional().default(""),
  status: z.string().optional().default(""),
  contact_type: z.string().optional().default(""),
  interest: z.string().optional().default(""),
  value: z.string().optional().default(""),
  next_followup: z.string().optional().default(""),
  last_contact_date: z.string().optional().default(""),
  brand_slugs: z.string().optional().default(""),
  assigned_rep: z.string().optional().default(""),
  marketing_segment: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  source_message_id: z.string().optional().default(""),
  id: z.string().optional(),
  created_at: z.string().optional(),
  classifier_brands: z.string().optional().default(""),
  classifier_skus: z.string().optional().default(""),
  classifier_profession: z.string().optional().default(""),
  classifier_confidence: z.string().optional().default(""),
  classifier_run_at: z.string().optional().default(""),
});

const PatchBody = z.object({
  id: z.string().min(1),
  name: z.string().min(1).optional(),
  email: z.string().email().or(z.literal("")).optional(),
  phone: z.string().optional(),
  source: z.string().optional(),
  status: z.string().optional(),
  contact_type: z.string().optional(),
  interest: z.string().optional(),
  value: z.string().optional(),
  next_followup: z.string().optional(),
  last_contact_date: z.string().optional(),
  brand_slugs: z.string().optional(),
  assigned_rep: z.string().optional(),
  marketing_segment: z.string().optional(),
  notes: z.string().optional(),
  source_message_id: z.string().optional(),
  created_at: z.string().optional(),
  classifier_brands: z.string().optional(),
  classifier_skus: z.string().optional(),
  classifier_profession: z.string().optional(),
  classifier_confidence: z.string().optional(),
  classifier_run_at: z.string().optional(),
});

// GET — list all leads, optionally filter by status
export const GET = async (request: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    const user = await requireFeature("manage_leads");
    const body = PostBody.parse(await request.json());

    const leadId = body.id || `LEAD-${Date.now()}`;
    const record: LeadRecord = {
      ...body,
      id: leadId,
      created_at: body.created_at || new Date().toISOString(),
    };

    await ensureColumns("Leads", R4_NOTE_8_COLUMNS);
    await appendRowByHeader("Leads", recordToFields(record));

    appendRow("Activity_Log", [
      `EA-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      new Date().toISOString(),
      user.email,
      "create_lead",
      "lead",
      leadId,
      JSON.stringify({ name: body.name, source: body.source }),
    ]).catch((err) =>
      console.error("[Leads API] Activity_Log append failed:", err)
    );

    return NextResponse.json({ success: true, id: leadId });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json(
        { error: "Forbidden", feature: err.feature },
        { status: 403 }
      );
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid body", issues: err.issues },
        { status: 400 }
      );
    }
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
    const user = await requireFeature("manage_leads");
    const body = PatchBody.parse(await request.json());

    const rowIdx = await findRowIndex("Leads", "id", body.id);
    if (rowIdx === null) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    await ensureColumns("Leads", R4_NOTE_8_COLUMNS);
    await updateRowByHeader("Leads", rowIdx, recordToFields(body));

    appendRow("Activity_Log", [
      `EA-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      new Date().toISOString(),
      user.email,
      "update_lead",
      "lead",
      body.id,
      JSON.stringify({ fields: Object.keys(body).filter((k) => k !== "id") }),
    ]).catch((err) =>
      console.error("[Leads API] Activity_Log append failed:", err)
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json(
        { error: "Forbidden", feature: err.feature },
        { status: 403 }
      );
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid body", issues: err.issues },
        { status: 400 }
      );
    }
    console.error("[Leads API] PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update lead" },
      { status: 500 }
    );
  }
};
