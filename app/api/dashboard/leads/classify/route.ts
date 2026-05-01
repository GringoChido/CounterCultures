import { NextResponse, type NextRequest } from "next/server";
import { readSheet, updateRow, findRowIndex } from "@/app/lib/dashboard-sheets";
import { classifyLeadMessage } from "@/app/lib/lead-classifier";

// Column order MUST match the actual Leads sheet header row — see the note
// in app/api/dashboard/leads/route.ts. notes + source_message_id sit
// between brand_slugs and the classifier fields on the live sheet.
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
  notes?: string;
  source_message_id?: string;
  classifier_brands?: string;
  classifier_skus?: string;
  classifier_profession?: string;
  classifier_confidence?: string;
  classifier_run_at?: string;
};

const LEAD_COLUMNS = [
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
  "notes",
  "source_message_id",
  "classifier_brands",
  "classifier_skus",
  "classifier_profession",
  "classifier_confidence",
  "classifier_run_at",
] as const;

/**
 * POST /api/dashboard/leads/classify
 * Body: { leadId?: string, message: string, persist?: boolean }
 *
 * - Runs the Claude classifier on the message
 * - If `leadId` provided AND `persist !== false`, writes results back to
 *   the Leads sheet on that row
 * - Returns the classification result either way
 */
export const POST = async (request: NextRequest) => {
  try {
    const body = (await request.json()) as {
      leadId?: string;
      message?: string;
      persist?: boolean;
    };

    const message = (body.message ?? "").trim();
    if (!message) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 },
      );
    }

    const result = await classifyLeadMessage(message);
    const runAt = new Date().toISOString();

    if (body.leadId && body.persist !== false) {
      const rowIdx = await findRowIndex("Leads", "id", body.leadId);
      if (rowIdx !== null) {
        const existing = await readSheet<LeadRecord>("Leads");
        const current = existing[rowIdx];
        const merged: LeadRecord = {
          ...current,
          classifier_brands: result.brands.join("|"),
          classifier_skus: result.skus.join("|"),
          classifier_profession: result.profession,
          classifier_confidence: String(result.confidence),
          classifier_run_at: runAt,
        };
        const values = LEAD_COLUMNS.map((col) => merged[col] ?? "");
        await updateRow("Leads", rowIdx, values);
      }
    }

    return NextResponse.json({ ...result, classifier_run_at: runAt });
  } catch (err) {
    console.error("[Leads classify API] error:", err);
    return NextResponse.json(
      { error: "Failed to classify lead message" },
      { status: 500 },
    );
  }
};
