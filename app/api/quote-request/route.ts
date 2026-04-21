import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod/v4";
import { submitLead } from "@/app/lib/sheets";
import {
  notifyRoger,
  notifyWhatsApp,
  sendContactConfirmation,
} from "@/app/lib/email";

const schema = z.object({
  productId: z.string().min(1).max(50),
  productSku: z.string().min(1).max(100),
  productName: z.string().min(1).max(300),
  productBrand: z.string().max(100).optional().default(""),
  locale: z.enum(["en", "es"]).optional().default("en"),
  name: z.string().min(1).max(100),
  email: z.email().max(150),
  phone: z.string().max(30).optional().default(""),
  quantity: z.string().max(20).optional().default("1"),
  finish: z.string().max(60).optional().default(""),
  notes: z.string().max(1000).optional().default(""),
});

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const message = [
      `Product: ${d.productName}`,
      `SKU: ${d.productSku}`,
      `Brand: ${d.productBrand || "—"}`,
      `Qty: ${d.quantity}`,
      `Finish: ${d.finish || "—"}`,
      d.notes ? `Notes: ${d.notes}` : "",
    ].filter(Boolean).join("\n");

    await submitLead({
      name: d.name,
      email: d.email,
      phone: d.phone,
      source: `quote-request:${d.productSku}`,
      message,
    });

    const firstName = d.name.split(" ")[0] || d.name;
    const rogerBody = [
      `NEW QUOTE REQUEST`,
      ``,
      `Product:  ${d.productName}`,
      `SKU:      ${d.productSku}`,
      `Brand:    ${d.productBrand || "—"}`,
      `Odoo ID:  ${d.productId}`,
      ``,
      `Customer: ${d.name}`,
      `Email:    ${d.email}`,
      `Phone:    ${d.phone || "—"}`,
      `Locale:   ${d.locale}`,
      ``,
      `Qty:      ${d.quantity}`,
      `Finish:   ${d.finish || "—"}`,
      d.notes ? `\nNotes:\n${d.notes}` : "",
    ].filter(Boolean).join("\n");

    void Promise.all([
      sendContactConfirmation(d.email, firstName).catch(() => {}),
      notifyRoger(`Quote Request: ${d.productSku} — ${d.name}`, rogerBody).catch(() => {}),
      notifyWhatsApp(
        `Quote: ${d.productSku} · ${d.name} (${d.email}) · qty ${d.quantity}${d.finish ? ` · ${d.finish}` : ""}`
      ).catch(() => {}),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[quote-request] error:", err);
    return NextResponse.json(
      { error: "Failed to submit quote request" },
      { status: 500 }
    );
  }
};
