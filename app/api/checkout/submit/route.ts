import { NextResponse, type NextRequest } from "next/server";
import { appendRow } from "@/app/lib/dashboard-sheets";
import { upsertPreferences } from "@/app/lib/customer-preferences";
import { signQuoteToken } from "@/app/lib/quote-token";
import { isConfigured as isStripeConfigured } from "@/app/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      locale = "en",
      contact,
      address,
      billingAddress,
      factura,
      project,
      items,
      cartSessionId,
      tradeCode,
      total,
      currency,
      selectedShippingRate,
    } = body;

    if (!contact?.email || !contact?.name || !items?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const dealId = `DEAL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();
    const commLocale = contact.commLocale ?? locale;

    // Write Pipeline row
    await appendRow("Pipeline", [
      dealId,
      "",
      "cart_submitted",
      contact.name,
      contact.email,
      contact.phone ?? "",
      contact.company ?? "",
      project.projectName ?? "",
      "website",
      String(total),
      currency,
      now,
      now,
      "",
      "",
      commLocale,
      cartSessionId,
      tradeCode ?? "",
      JSON.stringify(address),
      project.room ?? "",
      project.timeline ?? "",
      project.isTrade ? "true" : "false",
      commLocale,
    ]);

    // Write Cart_Sessions
    await appendRow("Cart_Sessions", [
      cartSessionId,
      dealId,
      JSON.stringify(items),
      JSON.stringify(contact),
      JSON.stringify(address),
      commLocale,
      "buy",
      "pending",
      "",
      now,
      now,
      factura ? JSON.stringify(factura) : "",
      billingAddress ? JSON.stringify(billingAddress) : "",
      selectedShippingRate ? JSON.stringify(selectedShippingRate) : "",
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

    // Upsert customer preferences
    await upsertPreferences(
      contact.email,
      {
        locale: commLocale,
        email_opt_in: true,
        whatsapp_opt_in: contact.channelPreference !== "email",
        channel_preference: contact.channelPreference ?? "both",
      },
      `guest:${cartSessionId}`
    );

    // Fire cart_submitted lifecycle transition
    const trackerToken = signQuoteToken(dealId);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://countercultures.mx";
    const trackerUrl = `${baseUrl}/${locale}/quote/${dealId}?t=${encodeURIComponent(trackerToken)}`;

    try {
      const { evaluateAndTransition } = await import("@/app/lib/rule-engine");
      await evaluateAndTransition(
        "cart_submitted",
        dealId,
        {
          mode: "buy",
          customer_name: contact.name,
          customer_email: contact.email,
          customer_phone: contact.phone,
          total_value: `${currency} ${total}`,
          item_count: String(items.length),
          project_name: project.projectName || "Unnamed project",
          tracker_url: trackerUrl,
          dashboard_link: `/dashboard/deals/${dealId}`,
          has_factura: factura?.enabled ? "true" : "false",
          rfc: factura?.rfc ?? "",
        },
        `guest:${cartSessionId}`
      );
    } catch {
      // Non-blocking
    }

    // Always attempt Stripe Payment Intent
    if (isStripeConfigured()) {
      const payUrl = `/${locale}/checkout/pay/${dealId}`;
      return NextResponse.json({ dealId, payUrl, trackerUrl });
    }

    // Fallback: no Stripe configured — treat as quote
    return NextResponse.json({ dealId, trackerUrl });
  } catch (err) {
    console.error("[checkout/submit] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
