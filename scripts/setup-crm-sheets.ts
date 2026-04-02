/**
 * One-time setup script: creates all CRM tabs with headers in the Google Sheet.
 *
 * Run with: npx tsx scripts/setup-crm-sheets.ts
 *
 * Prerequisites:
 *   - GOOGLE_SERVICE_ACCOUNT_EMAIL set in .env.local
 *   - GOOGLE_PRIVATE_KEY set in .env.local
 *   - GOOGLE_SHEETS_ID set in .env.local
 *   - The spreadsheet must be shared with the service account email (Editor)
 */

import { google } from "googleapis";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID!;

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

const TABS = [
  {
    title: "Products",
    headers: ["id", "sku", "brand", "name", "nameEn", "category", "subcategory", "price", "tradePrice", "currency", "finishes", "images", "artisanal", "description", "descriptionEn", "availability", "featured", "slug"],
  },
  {
    title: "Leads",
    headers: ["id", "name", "email", "phone", "source", "status", "assignedRep", "score", "createdAt", "updatedAt", "message"],
  },
  {
    title: "Pipeline",
    headers: ["id", "contactId", "name", "stage", "value", "probability", "expectedClose", "assignedRep", "createdAt", "updatedAt", "notes"],
  },
  {
    title: "Contacts",
    headers: ["id", "name", "email", "phone", "company", "type", "tags", "createdAt", "notes"],
  },
  {
    title: "Activity_Log",
    headers: ["id", "contactId", "type", "description", "createdBy", "createdAt"],
  },
  {
    title: "Reps",
    headers: ["id", "name", "email", "role", "active"],
  },
  {
    title: "Trade_Applications",
    headers: ["id", "company", "profession", "license", "status", "createdAt", "approvedAt", "details"],
  },
  {
    title: "Content_Calendar",
    headers: ["id", "title", "type", "channel", "scheduledDate", "status", "assignedTo", "notes"],
  },
  {
    title: "Email_Campaigns",
    headers: ["id", "name", "subject", "status", "sentDate", "opens", "clicks", "recipients"],
  },
  {
    title: "Social_Posts",
    headers: ["id", "platform", "content", "scheduledDate", "status", "engagement", "link"],
  },
  {
    title: "Newsletter",
    headers: ["email", "subscribedAt", "status"],
  },
  {
    title: "Bookings",
    headers: ["id", "name", "email", "phone", "date", "time", "status", "notes"],
  },
  {
    title: "Website_Analytics",
    headers: ["date", "pageViews", "sessions", "users", "bounceRate", "avgSessionDuration", "topPages"],
  },
  {
    title: "Sales_Metrics",
    headers: ["date", "totalRevenue", "newLeads", "closedDeals", "conversionRate", "avgDealValue", "pipelineValue"],
  },
  {
    title: "Marketing_Metrics",
    headers: ["date", "emailsSent", "openRate", "clickRate", "socialFollowers", "websiteTraffic", "leadSource"],
  },
  {
    title: "Settings",
    headers: ["key", "value", "description", "updatedAt"],
  },
];

async function main() {
  console.log("Setting up Counter Cultures CRM spreadsheet...\n");

  // Get existing sheets
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const existingSheets = spreadsheet.data.sheets?.map((s) => s.properties?.title) ?? [];
  console.log("Existing tabs:", existingSheets.join(", "));

  // Build batch requests
  const requests: any[] = [];

  // Rename Sheet1 if it exists
  if (existingSheets.includes("Sheet1")) {
    const sheet1 = spreadsheet.data.sheets?.find((s) => s.properties?.title === "Sheet1");
    if (sheet1?.properties?.sheetId !== undefined) {
      requests.push({
        updateSheetProperties: {
          properties: { sheetId: sheet1.properties.sheetId, title: TABS[0].title },
          fields: "title",
        },
      });
    }
  }

  // Add missing tabs
  for (const tab of TABS) {
    if (!existingSheets.includes(tab.title) && !(existingSheets.includes("Sheet1") && tab.title === TABS[0].title)) {
      requests.push({
        addSheet: { properties: { title: tab.title } },
      });
    }
  }

  if (requests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests },
    });
    console.log(`Created/renamed ${requests.length} tab(s)`);
  }

  // Add header rows to each tab
  for (const tab of TABS) {
    // Check if headers already exist
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tab.title}!A1:A1`,
    });

    if (!existing.data.values?.length) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${tab.title}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: [tab.headers] },
      });
      console.log(`  ✓ ${tab.title}: added ${tab.headers.length} headers`);
    } else {
      console.log(`  · ${tab.title}: headers already exist, skipping`);
    }
  }

  console.log("\n✅ CRM spreadsheet setup complete!");
  console.log(`   Spreadsheet: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}`);
}

main().catch((err) => {
  console.error("Setup failed:", err.message);
  process.exit(1);
});
