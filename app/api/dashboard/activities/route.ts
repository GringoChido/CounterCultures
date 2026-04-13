import { NextResponse, type NextRequest } from "next/server";
import { readSheet, appendRow } from "@/app/lib/dashboard-sheets";

type ActivityRecord = {
  id: string;
  type: string;
  description: string;
  contact_name: string;
  rep: string;
  timestamp: string;
  contact_id: string;
  deal_id: string;
  follow_up_date: string;
};

const ACTIVITY_COLUMNS: (keyof ActivityRecord)[] = [
  "id",
  "type",
  "description",
  "contact_name",
  "rep",
  "timestamp",
  "contact_id",
  "deal_id",
  "follow_up_date",
];

// GET — list recent activities
export const GET = async (request: NextRequest) => {
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "20");

  try {
    const rows = await readSheet<ActivityRecord>("Activity_Log");

    // Sort by timestamp descending, take limit
    const sorted = rows
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    const activities = sorted.map((r) => ({
      id: r.id,
      type: r.type || "note",
      description: r.description,
      contactName: r.contact_name,
      rep: r.rep || "Roger",
      timestamp: r.timestamp,
      contactId: r.contact_id || undefined,
      dealId: r.deal_id || undefined,
      followUpDate: r.follow_up_date || undefined,
    }));

    return NextResponse.json({ activities });
  } catch (err) {
    console.error("[Activities API] GET error:", err);
    return NextResponse.json({ activities: [] });
  }
};

// POST — log a new activity
export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();

    const record: ActivityRecord = {
      id: body.id || `ACT-${Date.now()}`,
      type: body.type || "note",
      description: body.description || "",
      contact_name: body.contactName || body.contact_name || "",
      rep: body.rep || "Roger",
      timestamp: body.timestamp || new Date().toISOString(),
      contact_id: body.contactId || body.contact_id || "",
      deal_id: body.dealId || body.deal_id || "",
      follow_up_date: body.followUpDate || body.follow_up_date || "",
    };

    const values = ACTIVITY_COLUMNS.map((col) => record[col] ?? "");
    await appendRow("Activity_Log", values);

    return NextResponse.json({ success: true, id: record.id });
  } catch (err) {
    console.error("[Activities API] POST error:", err);
    return NextResponse.json(
      { error: "Failed to log activity" },
      { status: 500 }
    );
  }
};
