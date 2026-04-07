import { NextResponse, type NextRequest } from "next/server";
import { readSheet, appendRow, findRowIndex, updateRow } from "@/app/lib/dashboard-sheets";

type SpanishManualRecord = {
  Manual_ID: string;
  Brand: string;
  Product_Name: string;
  SKU: string;
  Drive_File_ID: string;
  Language: string;
  CC_Branded: string;
  Created_Date: string;
  Created_By: string;
  Version: string;
  Original_Manual_Drive_ID: string;
};

const MANUAL_COLUMNS: (keyof SpanishManualRecord)[] = [
  "Manual_ID", "Brand", "Product_Name", "SKU",
  "Drive_File_ID", "Language", "CC_Branded",
  "Created_Date", "Created_By", "Version",
  "Original_Manual_Drive_ID",
];

export const GET = async (request: NextRequest) => {
  const sku = request.nextUrl.searchParams.get("sku");
  const brand = request.nextUrl.searchParams.get("brand");

  try {
    let manuals = await readSheet<SpanishManualRecord>("Spanish_Manuals");

    if (sku) {
      manuals = manuals.filter((m) => m.SKU === sku);
    }
    if (brand) {
      manuals = manuals.filter((m) => m.Brand.toLowerCase() === brand.toLowerCase());
    }

    return NextResponse.json({ manuals });
  } catch (err) {
    console.error("[Spanish Manuals API] GET error:", err);
    return NextResponse.json({ error: "Failed to fetch manuals" }, { status: 500 });
  }
};

export const POST = async (request: NextRequest) => {
  try {
    const body: SpanishManualRecord = await request.json();
    const values = MANUAL_COLUMNS.map((col) => body[col] ?? "");
    await appendRow("Spanish_Manuals", values);
    return NextResponse.json({ success: true, manualId: body.Manual_ID });
  } catch (err) {
    console.error("[Spanish Manuals API] POST error:", err);
    return NextResponse.json({ error: "Failed to create manual" }, { status: 500 });
  }
};

export const PUT = async (request: NextRequest) => {
  try {
    const body: SpanishManualRecord = await request.json();
    const { Manual_ID } = body;

    if (!Manual_ID) {
      return NextResponse.json({ error: "Manual_ID is required" }, { status: 400 });
    }

    const rowIdx = await findRowIndex("Spanish_Manuals", "Manual_ID", Manual_ID);
    if (rowIdx === null) {
      return NextResponse.json({ error: "Manual not found" }, { status: 404 });
    }

    const values = MANUAL_COLUMNS.map((col) => body[col] ?? "");
    await updateRow("Spanish_Manuals", rowIdx, values);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Spanish Manuals API] PUT error:", err);
    return NextResponse.json({ error: "Failed to update manual" }, { status: 500 });
  }
};
