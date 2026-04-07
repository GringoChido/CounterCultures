import { NextResponse, type NextRequest } from "next/server";
import { readSheet, appendRow, findRowIndex, updateRow } from "@/app/lib/dashboard-sheets";

type USMCACertRecord = {
  Cert_ID: string;
  Brand: string;
  Manufacturer: string;
  Country_of_Origin: string;
  Cert_Type: string;
  Drive_File_ID: string;
  Valid_From: string;
  Valid_To: string;
  Products_Covered: string;
  Credit_Available: string;
  Credit_Notes: string;
  Obtained_Date: string;
  Source: string;
};

const CERT_COLUMNS: (keyof USMCACertRecord)[] = [
  "Cert_ID", "Brand", "Manufacturer", "Country_of_Origin",
  "Cert_Type", "Drive_File_ID", "Valid_From", "Valid_To",
  "Products_Covered", "Credit_Available", "Credit_Notes",
  "Obtained_Date", "Source",
];

export const GET = async (request: NextRequest) => {
  const brand = request.nextUrl.searchParams.get("brand");

  try {
    let certs = await readSheet<USMCACertRecord>("USMCA_Certificates");
    if (brand) {
      certs = certs.filter((c) => c.Brand.toLowerCase() === brand.toLowerCase());
    }
    return NextResponse.json({ certificates: certs });
  } catch (err) {
    console.error("[USMCA Certs API] GET error:", err);
    return NextResponse.json({ error: "Failed to fetch certificates" }, { status: 500 });
  }
};

export const POST = async (request: NextRequest) => {
  try {
    const body: USMCACertRecord = await request.json();
    const values = CERT_COLUMNS.map((col) => body[col] ?? "");
    await appendRow("USMCA_Certificates", values);
    return NextResponse.json({ success: true, certId: body.Cert_ID });
  } catch (err) {
    console.error("[USMCA Certs API] POST error:", err);
    return NextResponse.json({ error: "Failed to create certificate" }, { status: 500 });
  }
};

export const PUT = async (request: NextRequest) => {
  try {
    const body: USMCACertRecord = await request.json();
    const { Cert_ID } = body;

    if (!Cert_ID) {
      return NextResponse.json({ error: "Cert_ID is required" }, { status: 400 });
    }

    const rowIdx = await findRowIndex("USMCA_Certificates", "Cert_ID", Cert_ID);
    if (rowIdx === null) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    const values = CERT_COLUMNS.map((col) => body[col] ?? "");
    await updateRow("USMCA_Certificates", rowIdx, values);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[USMCA Certs API] PUT error:", err);
    return NextResponse.json({ error: "Failed to update certificate" }, { status: 500 });
  }
};
