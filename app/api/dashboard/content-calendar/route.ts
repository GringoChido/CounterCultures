import { NextResponse, type NextRequest } from "next/server";
import {
  readSheet,
  appendRow,
  updateRow,
  findRowIndex,
} from "@/app/lib/dashboard-sheets";

type ContentRecord = {
  id: string;
  title: string;
  type: string;
  platform: string;
  scheduled_date: string;
  status: string;
  author: string;
  notes: string;
};

const CONTENT_COLUMNS: (keyof ContentRecord)[] = [
  "id",
  "title",
  "type",
  "platform",
  "scheduled_date",
  "status",
  "author",
  "notes",
];

export const GET = async () => {
  try {
    const items = await readSheet<ContentRecord>("Content_Calendar");
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[Content Calendar API] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch content calendar" },
      { status: 500 }
    );
  }
};

export const POST = async (request: NextRequest) => {
  try {
    const body: ContentRecord = await request.json();

    if (!body.id) {
      body.id = `CONTENT-${Date.now()}`;
    }

    const values = CONTENT_COLUMNS.map((col) => body[col] ?? "");
    await appendRow("Content_Calendar", values);

    return NextResponse.json({ success: true, id: body.id });
  } catch (err) {
    console.error("[Content Calendar API] POST error:", err);
    return NextResponse.json(
      { error: "Failed to create content item" },
      { status: 500 }
    );
  }
};

export const PATCH = async (request: NextRequest) => {
  try {
    const body: Partial<ContentRecord> & { id: string } = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const rowIdx = await findRowIndex("Content_Calendar", "id", body.id);
    if (rowIdx === null) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const existing = await readSheet<ContentRecord>("Content_Calendar");
    const current = existing[rowIdx];
    const merged = { ...current, ...body };

    const values = CONTENT_COLUMNS.map((col) => merged[col] ?? "");
    await updateRow("Content_Calendar", rowIdx, values);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Content Calendar API] PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update content item" },
      { status: 500 }
    );
  }
};
