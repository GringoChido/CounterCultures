import { NextResponse, type NextRequest } from "next/server";
import { readSheet, findRowIndex, updateRow } from "@/app/lib/dashboard-sheets";

type TraficoRecord = Record<string, string>;

export const GET = async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  try {
    const traficos = await readSheet<TraficoRecord>("Traficos");
    const trafico = traficos.find((t) => t.TRF_ID === id);

    if (!trafico) {
      return NextResponse.json({ error: "Trafico not found" }, { status: 404 });
    }

    return NextResponse.json({ trafico });
  } catch (err) {
    console.error("[Trafico API] GET error:", err);
    return NextResponse.json({ error: "Failed to fetch trafico" }, { status: 500 });
  }
};

export const PATCH = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  try {
    const updates: Record<string, string> = await request.json();

    const traficos = await readSheet<TraficoRecord>("Traficos");
    const existing = traficos.find((t) => t.TRF_ID === id);

    if (!existing) {
      return NextResponse.json({ error: "Trafico not found" }, { status: 404 });
    }

    const rowIdx = await findRowIndex("Traficos", "TRF_ID", id);
    if (rowIdx === null) {
      return NextResponse.json({ error: "Row not found" }, { status: 404 });
    }

    const merged = { ...existing, ...updates };
    const headers = Object.keys(existing);
    const values = headers.map((h) => merged[h] ?? "");
    await updateRow("Traficos", rowIdx, values);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Trafico API] PATCH error:", err);
    return NextResponse.json({ error: "Failed to update trafico" }, { status: 500 });
  }
};
