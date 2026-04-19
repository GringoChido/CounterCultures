/**
 * Dashboard chat agent — tool definitions + executor.
 *
 * Extracted from app/api/dashboard-chat/route.ts (W5+ refactor) so the
 * route handler stays focused on transport + agentic loop, and tool
 * surface area can grow (W6 v2) without bloating the route.
 *
 * Tool tiers (per webchat-v2-design.md §4.3):
 *   - read       — read-only lookups, silent execution
 *   - log        — append-only writes, silent execution
 *   - crm-update — CRM mutations, agent asks user "Want me to ...?" first
 *   - customer-facing — outbound email/WhatsApp, agent asks user first + previews
 */

import Anthropic from "@anthropic-ai/sdk";
import { readSheet, appendRow, type SheetTab } from "./dashboard-sheets";
import {
  searchFiles,
  listFiles,
  createFolder,
  getFile,
  isConfigured as driveConfigured,
} from "./google-drive";
import {
  readMasterPriceList,
  summarizePriceList,
  listPriceListFiles,
  syncPriceLists,
  isConfigured as priceListConfigured,
} from "./price-lists";

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

export const TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: "search_products",
    description:
      "Search the Products sheet by name, SKU, brand, or category. Returns matching rows. Use when the user asks about a specific product or wants to find products.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Search term — product name, SKU, brand, or category",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_leads",
    description:
      "Read leads from the CRM. Optionally filter by status, source, or rep. Use when the user asks about leads, prospects, or inquiries.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          description:
            'Filter by status (e.g., "new", "contacted", "qualified", "proposal", "won", "lost"). Leave empty for all.',
        },
        source: {
          type: "string",
          description:
            'Filter by source (e.g., "website", "instagram", "trade_show", "referral"). Leave empty for all.',
        },
        limit: {
          type: "number",
          description: "Max number of leads to return. Default: 20.",
        },
      },
      required: [],
    },
  },
  {
    name: "get_pipeline",
    description:
      "Read pipeline deals from the CRM. Optionally filter by stage. Use when the user asks about deals, pipeline value, opportunities.",
    input_schema: {
      type: "object" as const,
      properties: {
        stage: {
          type: "string",
          description:
            'Filter by stage (e.g., "Discovery", "Proposal", "Negotiation", "Closed Won", "Closed Lost"). Leave empty for all.',
        },
      },
      required: [],
    },
  },
  {
    name: "read_crm_tab",
    description:
      "Read data from any CRM spreadsheet tab. Available tabs: Products, Leads, Pipeline, Contacts, Activity_Log, Reps, Trade_Applications, Content_Calendar, Email_Campaigns, Social_Posts, Newsletter, Bookings, Website_Analytics, Sales_Metrics, Marketing_Metrics, Settings, Notes, Brand_NOM_Status, Brand_Lead_Times, HS_Code_Lookup, FTA_Rates, Trafico_Events.",
    input_schema: {
      type: "object" as const,
      properties: {
        tab: {
          type: "string",
          description: "The sheet tab name to read from",
        },
      },
      required: ["tab"],
    },
  },
  {
    name: "add_crm_row",
    description:
      "Add a new row to any CRM spreadsheet tab. Use when the user asks to log something, add a lead, create a record, etc. You must know the column headers first (call read_crm_tab to check). For Notes specifically, prefer the dedicated add_note tool.",
    input_schema: {
      type: "object" as const,
      properties: {
        tab: {
          type: "string",
          description: "The sheet tab to append to",
        },
        values: {
          type: "array",
          items: { type: "string" },
          description:
            "Array of cell values in column order. Match the header row exactly.",
        },
      },
      required: ["tab", "values"],
    },
  },
  {
    name: "search_drive",
    description:
      "Search Google Drive for files by name or content. Use when the user asks to find a file, document, image, or spreadsheet in Drive.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Search query — file name or content keywords",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "list_drive_folder",
    description:
      "List files inside a Google Drive folder. If no folderId is given, lists the root CRM folder. Use when the user asks to see what's in a folder or browse Drive.",
    input_schema: {
      type: "object" as const,
      properties: {
        folderId: {
          type: "string",
          description:
            "Google Drive folder ID to list. Omit for root CRM folder.",
        },
      },
      required: [],
    },
  },
  {
    name: "create_drive_folder",
    description:
      "Create a new folder in Google Drive. Use when the user asks to create, make, or set up a new folder.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "Name for the new folder",
        },
        parentFolderId: {
          type: "string",
          description:
            "Parent folder ID. Omit to create in the root CRM folder.",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "get_file_info",
    description:
      "Get detailed info about a specific file in Google Drive, including its preview/view link. Use when the user asks about a specific file by ID.",
    input_schema: {
      type: "object" as const,
      properties: {
        fileId: {
          type: "string",
          description: "The Google Drive file ID",
        },
      },
      required: ["fileId"],
    },
  },
  {
    name: "search_price_list",
    description:
      "Search the master price list across all supplier brands. Filter by brand, SKU, product name, or category. Use when the user asks about wholesale prices, dealer costs, MAP pricing, margins, or supplier pricing.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Search term — SKU, product name, brand, or category",
        },
        brand: {
          type: "string",
          description:
            'Filter by brand (e.g., "Ruvati", "BLANCO", "Deltana", "California Faucets"). Leave empty for all brands.',
        },
      },
      required: [],
    },
  },
  {
    name: "get_price_list_summary",
    description:
      "Get a summary of the master price list: total products, brand breakdown with counts and average MSRPs. Use when the user asks for an overview of pricing, how many products we carry, or brand statistics.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "list_price_list_files",
    description:
      "List all files in the PRICE LIST Shared Drive — shows which supplier price books are available (Excel files and PDF catalogs). Use when the user asks what price lists or catalogs we have.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "sync_price_lists",
    description:
      "Trigger a sync of all supplier Excel price books into the master price list. Downloads and parses each file, normalizing data into a unified format. Use when the user asks to refresh, update, or sync price data.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_new_leads_today",
    description:
      "Return leads created in the last 24 hours (or N hours if specified). Use when the user asks about today's leads, recent leads, or the latest inquiries.",
    input_schema: {
      type: "object" as const,
      properties: {
        hours: {
          type: "number",
          description: "Window in hours. Default 24.",
        },
      },
      required: [],
    },
  },
  {
    name: "get_week_kpis",
    description:
      "Compute this week's headline numbers: active pipeline value, deals won, deals created, new leads. Use when the user asks about this week, week-in-review, or weekly numbers.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool execution — calls real APIs / libs
// ---------------------------------------------------------------------------

export async function executeTool(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  try {
    switch (name) {
      case "search_products": {
        const rows = await readSheet<Record<string, string>>("Products");
        const q = (input.query as string).toLowerCase();
        const matches = rows.filter((r) =>
          Object.values(r).some((v) => v.toLowerCase().includes(q))
        );
        if (matches.length === 0) return "No products found matching that query.";
        return JSON.stringify(matches.slice(0, 15), null, 2);
      }

      case "get_leads": {
        let rows = await readSheet<Record<string, string>>("Leads");
        if (input.status) {
          const s = (input.status as string).toLowerCase();
          rows = rows.filter((r) => (r.Status || r.status || "").toLowerCase() === s);
        }
        if (input.source) {
          const s = (input.source as string).toLowerCase();
          rows = rows.filter((r) => (r.Source || r.source || "").toLowerCase().includes(s));
        }
        const limit = (input.limit as number) || 20;
        return rows.length === 0
          ? "No leads found matching those filters."
          : JSON.stringify(rows.slice(0, limit), null, 2);
      }

      case "get_pipeline": {
        let rows = await readSheet<Record<string, string>>("Pipeline");
        if (input.stage) {
          const s = (input.stage as string).toLowerCase();
          rows = rows.filter((r) => (r.Stage || r.stage || "").toLowerCase().includes(s));
        }
        return rows.length === 0
          ? "No pipeline deals found."
          : JSON.stringify(rows.slice(0, 20), null, 2);
      }

      case "read_crm_tab": {
        const tab = input.tab as SheetTab;
        const rows = await readSheet<Record<string, string>>(tab);
        if (rows.length === 0) return `The "${tab}" tab is empty or has no data rows.`;
        const summary = `Tab "${tab}" has ${rows.length} rows. Columns: ${Object.keys(rows[0]).join(", ")}`;
        const preview = rows.slice(0, 10);
        return `${summary}\n\nFirst ${preview.length} rows:\n${JSON.stringify(preview, null, 2)}`;
      }

      case "add_crm_row": {
        const ALLOWED_WRITE_TABS: SheetTab[] = [
          "Products", "Leads", "Pipeline", "Contacts", "Activity_Log",
          "Trade_Applications", "Content_Calendar", "Documents",
          "Purchase_Orders", "Shipments", "Deal_Payments",
        ];
        const tab = input.tab as SheetTab;
        if (!ALLOWED_WRITE_TABS.includes(tab)) {
          return `Cannot write to tab "${tab}". Allowed tabs: ${ALLOWED_WRITE_TABS.join(", ")}`;
        }
        const values = input.values as string[];
        await appendRow(tab, values);
        return `Successfully added a new row to "${tab}" with ${values.length} values.`;
      }

      case "search_drive": {
        if (!driveConfigured()) return "Google Drive is not configured yet.";
        const files = await searchFiles(input.query as string, 10);
        if (files.length === 0) return "No files found matching that search.";
        return JSON.stringify(
          files.map((f) => ({
            id: f.id,
            name: f.name,
            type: f.mimeType,
            modified: f.modifiedTime,
            link: f.webViewLink,
            isFolder: f.isFolder,
          })),
          null,
          2
        );
      }

      case "list_drive_folder": {
        if (!driveConfigured()) return "Google Drive is not configured yet.";
        const result = await listFiles(
          (input.folderId as string) || undefined,
          20
        );
        if (result.files.length === 0) return "This folder is empty.";
        return JSON.stringify(
          result.files.map((f) => ({
            id: f.id,
            name: f.name,
            type: f.isFolder ? "folder" : f.mimeType,
            modified: f.modifiedTime,
            link: f.webViewLink,
          })),
          null,
          2
        );
      }

      case "create_drive_folder": {
        if (!driveConfigured()) return "Google Drive is not configured yet.";
        const folder = await createFolder(
          input.name as string,
          (input.parentFolderId as string) || undefined
        );
        return `Created folder "${folder.name}" (ID: ${folder.id}). Link: ${folder.webViewLink}`;
      }

      case "get_file_info": {
        if (!driveConfigured()) return "Google Drive is not configured yet.";
        const file = await getFile(input.fileId as string);
        return JSON.stringify(
          {
            id: file.id,
            name: file.name,
            type: file.mimeType,
            size: file.size,
            modified: file.modifiedTime,
            created: file.createdTime,
            link: file.webViewLink,
            thumbnail: file.thumbnailLink,
            isFolder: file.isFolder,
          },
          null,
          2
        );
      }

      case "search_price_list": {
        if (!priceListConfigured()) return "Price List Drive is not configured yet. Set GOOGLE_PRICE_LIST_DRIVE_ID.";
        let rows = await readMasterPriceList();
        if (input.brand) {
          const b = (input.brand as string).toLowerCase();
          rows = rows.filter((r) => r.brand.toLowerCase() === b);
        }
        if (input.query) {
          const q = (input.query as string).toLowerCase();
          rows = rows.filter(
            (r) =>
              r.sku.toLowerCase().includes(q) ||
              r.productName.toLowerCase().includes(q) ||
              r.brand.toLowerCase().includes(q) ||
              r.category.toLowerCase().includes(q)
          );
        }
        if (rows.length === 0) return "No products found in the master price list matching those criteria.";
        const limited = rows.slice(0, 20);
        return `Found ${rows.length} products (showing first ${limited.length}):\n${JSON.stringify(
          limited.map((r) => ({
            brand: r.brand,
            sku: r.sku,
            name: r.productName,
            category: r.category,
            msrp: r.msrp ? `$${r.msrp}` : "N/A",
            map: r.mapPrice ? `$${r.mapPrice}` : "N/A",
            dealerCost: r.dealerCost ? `$${r.dealerCost}` : "N/A",
            margin: r.marginPct ? `${r.marginPct}%` : "N/A",
          })),
          null,
          2
        )}`;
      }

      case "get_price_list_summary": {
        if (!priceListConfigured()) return "Price List Drive is not configured yet.";
        const rows = await readMasterPriceList();
        if (rows.length === 0) return "The master price list is empty. Try running a sync first.";
        const summary = summarizePriceList(rows);
        return JSON.stringify(summary, null, 2);
      }

      case "list_price_list_files": {
        if (!priceListConfigured()) return "Price List Drive is not configured yet.";
        const files = await listPriceListFiles();
        return JSON.stringify(
          files.map((f) => ({
            name: f.name,
            type: f.isParseable ? "Excel (parseable)" : f.mimeType,
            size: f.size,
            modified: f.modifiedTime,
          })),
          null,
          2
        );
      }

      case "sync_price_lists": {
        if (!priceListConfigured()) return "Price List Drive is not configured yet.";
        const result = await syncPriceLists();
        return `Sync complete: ${result.totalRows} total products parsed from ${result.results.length} files.\n\nDetails:\n${result.results.map((r) => `- ${r.brand} (${r.fileName}): ${r.rowsParsed} rows — ${r.status}${r.error ? ` — ${r.error}` : ""}`).join("\n")}`;
      }

      case "get_new_leads_today": {
        const hours = Number(input.hours) > 0 ? Number(input.hours) : 24;
        const cutoff = Date.now() - hours * 60 * 60 * 1000;
        const rows = await readSheet<Record<string, string>>("Leads");
        const recent = rows.filter((r) => {
          const created = r.created_at || r.createdAt || r.Created_At;
          if (!created) return false;
          const t = new Date(created).getTime();
          return !Number.isNaN(t) && t >= cutoff;
        });
        if (recent.length === 0) {
          return `No new leads in the last ${hours}h.`;
        }
        return `${recent.length} new leads in the last ${hours}h:\n${JSON.stringify(
          recent.slice(0, 15).map((r) => ({
            id: r.id,
            name: r.name,
            source: r.source,
            status: r.status,
            brand_slugs: r.brand_slugs,
            created_at: r.created_at,
          })),
          null,
          2
        )}`;
      }

      case "get_week_kpis": {
        const now = new Date();
        const day = now.getDay(); // 0=Sun
        const daysSinceMonday = (day + 6) % 7; // Monday=0
        const weekStart = new Date(now);
        weekStart.setHours(0, 0, 0, 0);
        weekStart.setDate(weekStart.getDate() - daysSinceMonday);
        const weekStartMs = weekStart.getTime();

        const [leads, pipeline] = await Promise.all([
          readSheet<Record<string, string>>("Leads"),
          readSheet<Record<string, string>>("Pipeline"),
        ]);

        const newLeadsThisWeek = leads.filter((r) => {
          const t = new Date(r.created_at || "").getTime();
          return !Number.isNaN(t) && t >= weekStartMs;
        }).length;

        const parseValue = (v: string): number => {
          const n = Number(String(v).replace(/[^0-9.-]/g, ""));
          return Number.isFinite(n) ? n : 0;
        };

        let pipelineValue = 0;
        let wonThisWeek = 0;
        let newDealsThisWeek = 0;
        for (const r of pipeline) {
          const stage = (r.stage || r.Stage || "").toLowerCase();
          const isOpen = stage && !stage.includes("closed-won") && !stage.includes("closed-lost");
          if (isOpen) pipelineValue += parseValue(r.value || "0");
          const created = new Date(r.created_at || "").getTime();
          if (!Number.isNaN(created) && created >= weekStartMs) newDealsThisWeek++;
          const closed = new Date(r.closed_at || "").getTime();
          if (
            stage.includes("closed-won") &&
            !Number.isNaN(closed) &&
            closed >= weekStartMs
          ) {
            wonThisWeek += parseValue(r.value || "0");
          }
        }

        return JSON.stringify(
          {
            weekStart: weekStart.toISOString().slice(0, 10),
            activePipelineValue: pipelineValue,
            revenueWonThisWeek: wonThisWeek,
            newDealsThisWeek,
            newLeadsThisWeek,
          },
          null,
          2
        );
      }

      default:
        return `Unknown tool: ${name}`;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Tool ${name}]`, msg);
    return `Error executing ${name}: ${msg}`;
  }
}

// ---------------------------------------------------------------------------
// System prompt (v1 — replaced by v2 prompt in webchat-v2 Task 4)
// ---------------------------------------------------------------------------

export const SYSTEM_PROMPT = `You are the Counter Cultures Dashboard AI Assistant — a smart, helpful digital assistant embedded in the Counter Portal CRM dashboard.

## YOUR CAPABILITIES
You have **real-time access** to the CRM data and Google Drive through tools. You can:
- Look up products by name, SKU, brand, or category
- Pull up leads, filter by status/source, and add new ones
- View the sales pipeline and deal stages
- Read any CRM spreadsheet tab (Products, Leads, Pipeline, Contacts, Trade_Applications, Bookings, etc.)
- Add new rows to any CRM tab
- Search Google Drive for documents, images, spreadsheets
- Browse Drive folders and see what's inside
- Create new folders in Drive
- Get file details and preview links
- Search the master price list across all supplier brands (Ruvati, BLANCO, Deltana, California Faucets, etc.)
- Get price list summaries with brand breakdowns and average MSRPs
- See which supplier price books and catalogs are available
- Trigger a price list sync to refresh data from supplier Excel files

## YOUR PERSONALITY
- Concise and action-oriented — give answers, not lectures
- Use real data from the tools when possible, not guesses
- Format data clearly: use bullet points for lists, bold for key values
- When you perform an action (add a lead, create a folder), confirm what you did
- If you can link to a file or Drive item, include the link
- Speak in a warm, professional tone — you're a teammate, not a robot

## DASHBOARD SECTIONS (for navigation help)
- **Overview** (/dashboard/overview): KPIs, revenue, pipeline chart
- **Leads** (/dashboard/leads): Lead management, filtering, CSV export
- **Pipeline** (/dashboard/pipeline): Kanban board with deal stages
- **Drive** (/dashboard/drive): Google Drive file browser
- **Products** (/dashboard/products): Product catalog
- **Trade Program** (/dashboard/trade-program): Trade partners
- **Social Media** (/dashboard/social): Facebook & Instagram via Meta API
- **Content Calendar** (/dashboard/content-calendar): Post scheduling
- **Email Campaigns** (/dashboard/email-campaigns): Campaign management
- **Analytics**: Website, Sales, and Marketing analytics pages
- **Reports** (/dashboard/reports): Generate monthly reports
- **Settings** (/dashboard/settings): Account & integrations

## TIPS
- Press **⌘K** to open global search
- The Leads page has an Export CSV button
- The Drive page lets you upload files and create folders directly

## RULES
- Always use your tools to get real data — never make up numbers
- If a tool returns an error, explain what happened and suggest next steps
- When asked about data you don't have a tool for, tell them which dashboard section to check
- Keep responses under ~300 words unless the user asks for more detail`;
