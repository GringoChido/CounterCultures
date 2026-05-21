import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { ensureTab, ensureColumns } from "@/app/lib/sheet-migrations";
import { notifyRoger, notifyWhatsApp } from "@/app/lib/email";
import { GoogleAuth } from "google-auth-library";
import { sheets as sheetsApi } from "@googleapis/sheets";
import { getGooglePrivateKey } from "@/app/lib/google-private-key";

const schema = z.object({
  brandName: z.string().min(1).max(200),
  contactName: z.string().min(1).max(100),
  email: z.email(),
  whatsapp: z.string().max(30).optional().default(""),
  productCategory: z.string().max(200).optional().default(""),
  location: z.string().max(200).optional().default(""),
  description: z.string().max(2000).optional().default(""),
});

const TAB = "Brand_Applications";

const COLUMNS = [
  "id",
  "brand_name",
  "contact_name",
  "email",
  "whatsapp",
  "product_category",
  "location",
  "description",
  "source",
  "status",
  "created_at",
] as const;

const getSheets = () => {
  const auth = new GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: getGooglePrivateKey(),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return sheetsApi({ version: "v4", auth });
};

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Brand name, contact name, and a valid email are required" },
        { status: 400 },
      );
    }

    const data = result.data;
    const appId = `BP-${Date.now()}`;
    const now = new Date().toISOString();

    await ensureTab(TAB, [...COLUMNS]);
    await ensureColumns(TAB, [...COLUMNS]);

    const row: Record<(typeof COLUMNS)[number], string> = {
      id: appId,
      brand_name: data.brandName,
      contact_name: data.contactName,
      email: data.email,
      whatsapp: data.whatsapp,
      product_category: data.productCategory,
      location: data.location,
      description: data.description,
      source: "brand_partner",
      status: "new",
      created_at: now,
    };

    const sheets = getSheets();
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID!,
      range: `${TAB}!A:K`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [COLUMNS.map((c) => row[c])] },
    });

    // Alert the sales team (STAGING_EMAIL_REDIRECT governs delivery on staging)
    void Promise.all([
      notifyRoger(
        `New Brand Partner Application: ${data.brandName}`,
        `Brand: ${data.brandName}\nContact: ${data.contactName}\nEmail: ${data.email}\nWhatsApp: ${data.whatsapp || "—"}\nCategory: ${data.productCategory || "—"}\nLocation: ${data.location || "—"}\nDescription: ${data.description || "—"}`,
      ).catch(() => {}),
      notifyWhatsApp(
        `New brand partner application: ${data.brandName} — ${data.contactName} (${data.email})`,
      ).catch(() => {}),
    ]);

    return NextResponse.json({ success: true, id: appId });
  } catch {
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 },
    );
  }
};
