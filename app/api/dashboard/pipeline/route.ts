import { NextResponse, type NextRequest } from "next/server";
import {
  readSheet,
  appendRow,
  updateRow,
  findRowIndex,
} from "@/app/lib/dashboard-sheets";

type PipelineRecord = {
  id: string;
  name: string;
  company: string;
  stage: string;
  value: string;
  probability: string;
  expected_close: string;
  owner: string;
  source: string;
  created_at: string;
  last_activity: string;
};

const PIPELINE_COLUMNS: (keyof PipelineRecord)[] = [
  "id",
  "name",
  "company",
  "stage",
  "value",
  "probability",
  "expected_close",
  "owner",
  "source",
  "created_at",
  "last_activity",
];

// GET — list all pipeline deals
export const GET = async (request: NextRequest) => {
  const stage = request.nextUrl.searchParams.get("stage");

  try {
    let deals = await readSheet<PipelineRecord>("Pipeline");

    if (stage && stage !== "all") {
      deals = deals.filter((d) => d.stage === stage);
    }

    return NextResponse.json({ deals });
  } catch (err) {
    console.error("[Pipeline API] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch pipeline deals" },
      { status: 500 }
    );
  }
};

// POST — create a new deal
export const POST = async (request: NextRequest) => {
  try {
    const body: PipelineRecord = await request.json();

    if (!body.id) {
      body.id = `DEAL-${Date.now()}`;
    }
    if (!body.created_at) {
      body.created_at = new Date().toISOString();
    }

    const values = PIPELINE_COLUMNS.map((col) => body[col] ?? "");
    await appendRow("Pipeline", values);

    return NextResponse.json({ success: true, id: body.id });
  } catch (err) {
    console.error("[Pipeline API] POST error:", err);
    return NextResponse.json(
      { error: "Failed to create deal" },
      { status: 500 }
    );
  }
};

// PATCH — update a deal (e.g. move between stages)
export const PATCH = async (request: NextRequest) => {
  try {
    const body: Partial<PipelineRecord> & { id: string } = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const rowIdx = await findRowIndex("Pipeline", "id", body.id);
    if (rowIdx === null) {
      return NextResponse.json(
        { error: "Deal not found" },
        { status: 404 }
      );
    }

    const existing = await readSheet<PipelineRecord>("Pipeline");
    const current = existing[rowIdx];
    const merged = { ...current, ...body };

    const values = PIPELINE_COLUMNS.map((col) => merged[col] ?? "");
    await updateRow("Pipeline", rowIdx, values);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Pipeline API] PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update deal" },
      { status: 500 }
    );
  }
};
