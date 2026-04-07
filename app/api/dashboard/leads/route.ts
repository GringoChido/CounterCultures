import { NextResponse, type NextRequest } from "next/server";
import {
  readSheet,
  appendRow,
  updateRow,
  findRowIndex,
} from "@/app/lib/dashboard-sheets";

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
];

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

    const values = LEAD_COLUMNS.map((col) => body[col] ?? "");
    await appendRow("Leads", values);

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

    // Read existing row, merge updates
    const existing = await readSheet<LeadRecord>("Leads");
    const current = existing[rowIdx];
    const merged = { ...current, ...body };

    const values = LEAD_COLUMNS.map((col) => merged[col] ?? "");
    await updateRow("Leads", rowIdx, values);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Leads API] PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update lead" },
      { status: 500 }
    );
  }
};
