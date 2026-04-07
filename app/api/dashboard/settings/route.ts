import { NextResponse, type NextRequest } from "next/server";
import {
  readSheet,
  appendRow,
  updateRow,
  findRowIndex,
} from "@/app/lib/dashboard-sheets";

type SettingsRecord = {
  key: string;
  value: string;
  description: string;
  updated_at: string;
};

const SETTINGS_COLUMNS: (keyof SettingsRecord)[] = [
  "key",
  "value",
  "description",
  "updated_at",
];

export const GET = async () => {
  try {
    const settings = await readSheet<SettingsRecord>("Settings");
    return NextResponse.json({ settings });
  } catch (err) {
    console.error("[Settings API] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
};

export const POST = async (request: NextRequest) => {
  try {
    const body: SettingsRecord = await request.json();
    body.updated_at = new Date().toISOString();

    // Upsert: update if key exists, append if not
    const rowIdx = await findRowIndex("Settings", "key", body.key);
    const values = SETTINGS_COLUMNS.map((col) => body[col] ?? "");

    if (rowIdx !== null) {
      await updateRow("Settings", rowIdx, values);
    } else {
      await appendRow("Settings", values);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Settings API] POST error:", err);
    return NextResponse.json(
      { error: "Failed to save setting" },
      { status: 500 }
    );
  }
};
