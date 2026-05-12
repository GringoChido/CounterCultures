/**
 * @deprecated Use /api/checkout/submit instead. This route is kept for backward
 * compatibility with legacy quote-acceptance flows. New checkout always goes
 * through the unified submit route + Payment Element.
 */
import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { appendRow } from "@/app/lib/dashboard-sheets";
import { upsertPreferences } from "@/app/lib/customer-preferences";
import { getStripe } from "@/app/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { locale, contact, address, project, items, cartSessionId, tradeCode, subtotal, ivaAmount, total, currency } = body;

    if (!contact?.email || !contact?.name || !items?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Guard: only buyable items allowed on buy path
    const hasQuoteOnly = items.some((i: { buyable: boolean }) => !i.buyable);
    if (hasQuoteOnly) {
      return NextResponse.json(
        { error: "Cart contains quote-only items. Use the quote path." },
        { status: 400 }
      );
    }

    const dealId = `DEAL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();

    // Build Stripe line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
      (item: { name: string; sku: string; listPrice: number; quantity: number }) => ({
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: item.name,
            metadata: { sku: item.sku },
          },
          unit_amount: Math.round(item.listPrice * 100),
        },
        quantity: item.quantity,
      })
    );

    // Add IVA line if applicable
    if (ivaAmount > 0) {
      lineItems.push({
        price_data: {
          currency: currency.toLowerCase(),
          product_data: { name: "IVA (16%)" },
          unit_amount: Math.round(ivaAmount * 100),
        },
        quantity: 1,
      });
    }

    // Create Stripe Checkout Session
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: contact.email,
      line_items: lineItems,
      metadata: {
        kind: "cart_purchase",
        cart_session_id: cartSessionId,
        deal_id: dealId,
        locale,
        customer_name: contact.name,
        customer_phone: contact.phone ?? "",
      },
      shipping_address_collection: {
        allowed_countries: ["MX", "US"],
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://countercultures.mx"}/${locale}/payment-success?session_id={CHECKOUT_SESSION_ID}&deal_id=${dealId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://countercultures.mx"}/${locale}/cart`,
    });

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
      locale,
      cartSessionId,
      tradeCode ?? "",
      JSON.stringify(address),
      project.room ?? "",
      project.timeline ?? "",
      project.isTrade ? "true" : "false",
      contact.commLocale ?? locale,
    ]);

    // Write Cart_Sessions
    await appendRow("Cart_Sessions", [
      cartSessionId,
      dealId,
      JSON.stringify(items),
      JSON.stringify(contact),
      JSON.stringify(address),
      locale,
      "buy",
      "pending",
      "",
      now,
      now,
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
        "true",
        now,
      ]);
    }

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

    // Fire payment_initiated transition
    try {
      const { evaluateAndTransition } = await import("@/app/lib/rule-engine");
      await evaluateAndTransition(
        "payment_initiated",
        dealId,
        {
          stripe_session_id: session.id,
          customer_name: contact.name,
          customer_email: contact.email,
          total_value: `${currency} ${total}`,
          stripe_link: session.url,
          project_name: project.projectName || "Unnamed project",
        },
        `guest:${cartSessionId}`
      );
    } catch {
      // Non-blocking
    }

    return NextResponse.json({ stripeUrl: session.url, dealId, payUrl: `/${locale ?? "en"}/checkout/pay/${dealId}` });
  } catch (err) {
    console.error("[checkout/buy] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
