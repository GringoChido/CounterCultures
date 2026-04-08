// DEPRECATED: Odoo integration is inactive. Retained for reference during
// migration to Google Sheets CRM. Safe to remove after 2026-07-01.
import { NextRequest, NextResponse } from "next/server";
import { searchRead, isConfigured } from "@/app/lib/odoo";

export const maxDuration = 30;

export const GET = async (req: NextRequest) => {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Odoo not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 100);
  const offset = Number(searchParams.get("offset") ?? "0");

  try {
    const domain: unknown[][] = [["type", "=", "opportunity"]];
    const leads = await searchRead(
      "crm.lead",
      domain,
      [
        "name", "contact_name", "partner_id", "email_from", "phone",
        "expected_revenue", "probability", "stage_id", "user_id",
        "date_deadline", "create_date", "write_date", "priority",
        "lost_reason", "tag_ids", "description",
      ],
      limit,
      offset,
      "write_date desc"
    );

    return NextResponse.json({ leads, count: leads.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch CRM data";
    // Check if it's a model-not-found error (CRM module not installed)
    if (message.includes("crm.lead") || message.includes("does not exist")) {
      return NextResponse.json({
        error: "CRM module not available in your Odoo instance",
        leads: [],
        count: 0,
      });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
};
