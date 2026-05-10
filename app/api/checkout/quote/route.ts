import { NextResponse, type NextRequest } from "next/server";
import { appendRow } from "@/app/lib/dashboard-sheets";
import { upsertPreferences } from "@/app/lib/customer-preferences";
import { signQuoteToken } from "@/app/lib/quote-token";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { locale, contact, address, project, items, cartSessionId, tradeCode, subtotal, total, currency } = body;

    if (!contact?.email || !contact?.name || !items?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const dealId = `DEAL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();

    // Write Pipeline row
    await appendRow("Pipeline", [
      dealId,
      "", // leadId
      "cart_submitted",
      contact.name,
      contact.email,
      contact.phone ?? "",
      contact.company ?? "",
      project.projectName ?? "",
      "website",
      String(total),
      currency,
      now, // created_at
      now, // stage_entered_at
      "", // expected_close
      "", // win_loss_reason
      locale,
      cartSessionId,
      tradeCode ?? "",
      JSON.stringify(address),
      project.room ?? "",
      project.timeline ?? "",
      project.isTrade ? "true" : "false",
      contact.commLocale ?? locale,
    ]);

    // Write Deal_Line_Items
    for (const item of items) {
      await appendRow("Deal_Line_Items", [
        dealId,
        item.productId,
        item.sku,
        item.name,
        item.brand,
        String(item.quantity),
        String(item.listPrice),
        currency,
        item.selectedFinish ?? "",
        item.notes ?? "",
        item.availability,
        item.buyable ? "true" : "false",
        now,
      ]);
    }

    // Write Cart_Sessions
    await appendRow("Cart_Sessions", [
      cartSessionId,
      dealId,
      JSON.stringify(items),
      JSON.stringify(contact),
      JSON.stringify(address),
      locale,
      "quote",
      "submitted",
      "", // odoo_sale_order_id
      now,
      now,
    ]);

    // Upsert customer preferences
    await upsertPreferences(
      contact.email,
      {
        locale: contact.commLocale ?? locale,
        email_opt_in: true,
        whatsapp_opt_in: contact.channelPreference !== "email",
        channel_preference: contact.channelPreference ?? "both",
      },
      `guest:${cartSessionId}`
    );

    // Generate tracker token
    const trackerToken = signQuoteToken(dealId);
    const trackerUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://countercultures.mx"}/${locale}/quote/${dealId}?t=${encodeURIComponent(trackerToken)}`;

    // Fire lifecycle transition (deferred import to avoid circular)
    try {
      const { evaluateAndTransition } = await import("@/app/lib/rule-engine");
      await evaluateAndTransition(
        "cart_submitted",
        dealId,
        {
          mode: "quote",
          customer_name: contact.name,
          customer_email: contact.email,
          customer_phone: contact.phone,
          total_value: `${currency} ${total}`,
          item_count: String(items.length),
          project_name: project.projectName || "Unnamed project",
          tracker_url: trackerUrl,
          dashboard_link: `/dashboard/deals/${dealId}`,
        },
        `guest:${cartSessionId}`
      );
    } catch {
      // Non-blocking: lifecycle fires asynchronously
    }

    return NextResponse.json({ dealId, trackerUrl });
  } catch (err) {
    console.error("[checkout/quote] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
