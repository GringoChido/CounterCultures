import { NextResponse, type NextRequest } from "next/server";
import {
  readSheet,
  appendRow,
  updateRow,
  findRowIndex,
} from "@/app/lib/dashboard-sheets";

type CampaignRecord = {
  id: string;
  name: string;
  type: string;
  audience_type: string;
  recipients: string;
  status: string;
  sent_date: string;
  open_rate: string;
  click_rate: string;
  leads_generated: string;
};

const CAMPAIGN_COLUMNS: (keyof CampaignRecord)[] = [
  "id",
  "name",
  "type",
  "audience_type",
  "recipients",
  "status",
  "sent_date",
  "open_rate",
  "click_rate",
  "leads_generated",
];

export const GET = async () => {
  try {
    const campaigns = await readSheet<CampaignRecord>("Email_Campaigns");
    return NextResponse.json({ campaigns });
  } catch (err) {
    console.error("[Email Campaigns API] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
};

export const POST = async (request: NextRequest) => {
  try {
    const body: CampaignRecord = await request.json();

    if (!body.id) {
      body.id = `CAMP-${Date.now()}`;
    }

    const values = CAMPAIGN_COLUMNS.map((col) => body[col] ?? "");
    await appendRow("Email_Campaigns", values);

    return NextResponse.json({ success: true, id: body.id });
  } catch (err) {
    console.error("[Email Campaigns API] POST error:", err);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
};

export const PATCH = async (request: NextRequest) => {
  try {
    const body: Partial<CampaignRecord> & { id: string } = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const rowIdx = await findRowIndex("Email_Campaigns", "id", body.id);
    if (rowIdx === null) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    const existing = await readSheet<CampaignRecord>("Email_Campaigns");
    const current = existing[rowIdx];
    const merged = { ...current, ...body };

    const values = CAMPAIGN_COLUMNS.map((col) => merged[col] ?? "");
    await updateRow("Email_Campaigns", rowIdx, values);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Email Campaigns API] PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 }
    );
  }
};
