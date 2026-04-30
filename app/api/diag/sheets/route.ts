// TEMPORARY diagnostic — public, no auth. Remove after debug.
import { NextResponse } from "next/server";
import { getGooglePrivateKey } from "@/app/lib/google-private-key";

export const dynamic = "force-dynamic";

export const GET = async () => {
  const out: Record<string, unknown> = {
    serviceAccount: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? null,
    sheetId: process.env.GOOGLE_SHEETS_ID ?? null,
    rawPemLen: process.env.GOOGLE_PRIVATE_KEY?.length ?? null,
    rawB64Len: process.env.GOOGLE_PRIVATE_KEY_B64?.length ?? null,
    helperLen: getGooglePrivateKey()?.length ?? null,
    helperStart: getGooglePrivateKey()?.slice(0, 30) ?? null,
    googleEnvKeys: Object.keys(process.env).filter(k => k.includes("GOOGLE")).sort(),
  };

  try {
    const { google } = await import("googleapis");
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: getGooglePrivateKey(),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
    await auth.authorize();
    out.auth = "OK";
    const sheets = google.sheets({ version: "v4", auth });
    const r = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID!,
      range: "Pipeline!A1:Z5",
    });
    out.pipelineRows = (r.data.values ?? []).length;
  } catch (e) {
    out.error = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(out);
};
