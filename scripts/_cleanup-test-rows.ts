/**
 * One-shot cleanup: removes test rows left in Traficos and
 * Trafico_Events by the W5 superpowers verification flow.
 *
 * Pattern: anything with TRF_ID starting "CC-TRF-TEST-" (Traficos) or
 * trafico_id starting "CC-TRF-TEST-" / "__TEST__" (Trafico_Events).
 *
 * Run: npx tsx scripts/_cleanup-test-rows.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

const main = async () => {
  const { google } = await import("googleapis");
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const idByTitle = new Map<string, number>();
  for (const s of meta.data.sheets ?? []) {
    if (s.properties?.title && s.properties.sheetId !== undefined && s.properties.sheetId !== null) {
      idByTitle.set(s.properties.title, s.properties.sheetId);
    }
  }

  const cleanTab = async (tab: "Traficos" | "Trafico_Events", idCol: number, idMatcher: (v: string) => boolean) => {
    // Read all columns up to the one we care about (idCol is 0-indexed)
    const lastCol = String.fromCharCode(65 + idCol);
    const r = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${tab}!A:${lastCol}`,
    });
    const rows = r.data.values ?? [];
    // rows[0] = header. Find data rows (1-indexed) where col matches.
    const sheetRowsToDelete: number[] = [];
    for (let i = 1; i < rows.length; i++) {
      const v = (rows[i][idCol] ?? "").trim();
      if (idMatcher(v)) sheetRowsToDelete.push(i); // 0-indexed sheet row
    }
    if (sheetRowsToDelete.length === 0) {
      console.log(`= ${tab}: no test rows to clean`);
      return;
    }
    console.log(`- ${tab}: deleting ${sheetRowsToDelete.length} test row(s)`);
    const sheetId = idByTitle.get(tab);
    if (sheetId === undefined) throw new Error(`${tab} sheetId not found`);
    // Delete from bottom up so indices don't shift
    sheetRowsToDelete.sort((a, b) => b - a);
    for (const r of sheetRowsToDelete) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: { sheetId, dimension: "ROWS", startIndex: r, endIndex: r + 1 },
            },
          }],
        },
      });
    }
  };

  await cleanTab("Traficos", 0, (v) => v.startsWith("CC-TRF-TEST-"));
  await cleanTab("Trafico_Events", 1, (v) => v.startsWith("CC-TRF-TEST-") || v === "__TEST__");

  console.log("\n✅ Cleanup complete.");
};

main().catch((e) => { console.error("\n❌ FAILED:", e?.message || e); process.exit(1); });
