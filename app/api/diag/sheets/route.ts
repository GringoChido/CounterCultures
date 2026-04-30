// TEMPORARY diagnostic — public, no auth. Remove after debug.
import { NextResponse } from "next/server";
import { getGooglePrivateKey } from "@/app/lib/google-private-key";

export const dynamic = "force-dynamic";

export const GET = async () => {
  const out: Record<string, unknown> = {
    serviceAccount: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? null,
    sheetId: process.env.GOOGLE_SHEETS_ID ?? null,
    privateKeyLength: getGooglePrivateKey()?.length ?? null,
    privateKeyStart: getGooglePrivateKey()?.slice(0, 40) ?? null,
    privateKeyEnd: getGooglePrivateKey()?.slice(-40) ?? null,
    privateKeyHasLiteralBackslashN: (getGooglePrivateKey() ?? "").includes("\\n"),
    privateKeyHasRealNewlines: (getGooglePrivateKey() ?? "").includes("\n"),
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
