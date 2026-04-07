import { NextResponse, type NextRequest } from "next/server";
import {
  readSheet,
  appendRow,
  updateRow,
  findRowIndex,
} from "@/app/lib/dashboard-sheets";

type TradeAppRecord = {
  id: string;
  company: string;
  contact_name: string;
  email: string;
  phone: string;
  license_number: string;
  status: string;
  created_at: string;
};

const TRADE_COLUMNS: (keyof TradeAppRecord)[] = [
  "id",
  "company",
  "contact_name",
  "email",
  "phone",
  "license_number",
  "status",
  "created_at",
];

export const GET = async () => {
  try {
    const applications = await readSheet<TradeAppRecord>("Trade_Applications");
    return NextResponse.json({ applications });
  } catch (err) {
    console.error("[Trade Program API] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch trade applications" },
      { status: 500 }
    );
  }
};

export const POST = async (request: NextRequest) => {
  try {
    const body: TradeAppRecord = await request.json();

    if (!body.id) {
      body.id = `TRADE-${Date.now()}`;
    }
    if (!body.created_at) {
      body.created_at = new Date().toISOString();
    }

    const values = TRADE_COLUMNS.map((col) => body[col] ?? "");
    await appendRow("Trade_Applications", values);

    return NextResponse.json({ success: true, id: body.id });
  } catch (err) {
    console.error("[Trade Program API] POST error:", err);
    return NextResponse.json(
      { error: "Failed to create trade application" },
      { status: 500 }
    );
  }
};

export const PATCH = async (request: NextRequest) => {
  try {
    const body: Partial<TradeAppRecord> & { id: string } = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const rowIdx = await findRowIndex("Trade_Applications", "id", body.id);
    if (rowIdx === null) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const existing = await readSheet<TradeAppRecord>("Trade_Applications");
    const current = existing[rowIdx];
    const merged = { ...current, ...body };

    const values = TRADE_COLUMNS.map((col) => merged[col] ?? "");
    await updateRow("Trade_Applications", rowIdx, values);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Trade Program API] PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update trade application" },
      { status: 500 }
    );
  }
};
