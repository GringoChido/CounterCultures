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

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("[checkout/buy] STRIPE_SECRET_KEY not set in environment");
      const msg = locale === "en"
        ? "Payments are temporarily unavailable. Please contact us on WhatsApp."
        : "Pagos no disponibles temporalmente. Por favor contáctanos por WhatsApp.";
      return NextResponse.json({ error: msg }, { status: 503 });
    }

    const hasQuoteOnly = items.some((i: { buyable: boolean }) => !i.buyable);
    if (hasQuoteOnly) {
      return NextResponse.json(
        { error: "Cart contains quote-only items. Use the quote path." },
        { status: 400 }
      );
    }

    const dealId = `DEAL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();
    const safeCurrency = (currency ?? "mxn").toLowerCase();
    const isEs = locale === "es";

    // ── Stripe session FIRST — this is the only thing the customer waits for ──
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
      (item: { name: string; sku: string; listPrice: number; quantity: number }) => ({
        price_data: {
          currency: safeCurrency,
          product_data: {
            name: item.name,
            metadata: { sku: item.sku },
          },
          unit_amount: Math.round(item.listPrice * 100),
        },
        quantity: item.quantity,
      })
    );

    if (ivaAmount > 0) {
      lineItems.push({
        price_data: {
          currency: safeCurrency,
          product_data: { name: "IVA (16%)" },
          unit_amount: Math.round(ivaAmount * 100),
        },
        quantity: 1,
      });
    }

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
      custom_text: {
        submit: {
          message: isEs
            ? "Counter Cultures — Distribuidor autorizado en San Miguel de Allende. Gracias por tu compra. Recibirás confirmación por correo electrónico."
            : "Counter Cultures — Authorized dealer in San Miguel de Allende. Thank you for your purchase. You'll receive confirmation by email.",
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://countercultures.mx"}/${locale}/payment-success?session_id={CHECKOUT_SESSION_ID}&deal_id=${dealId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://countercultures.mx"}/${locale}/cart`,
    });

    // ── Sheet writes + side-effects — fire in parallel, never block response ──
    const sheetWrites = async () => {
      try {
        await Promise.all([
          appendRow("Pipeline", [
            dealId, "", "cart_submitted", contact.name, contact.email,
            contact.phone ?? "", contact.company ?? "", project.projectName ?? "",
            "website", String(total), currency, now, now, "", "", locale,
            cartSessionId, tradeCode ?? "", JSON.stringify(address),
            project.room ?? "", project.timeline ?? "",
            project.isTrade ? "true" : "false", contact.commLocale ?? locale,
          ]),
          appendRow("Cart_Sessions", [
            cartSessionId, dealId, JSON.stringify(items), JSON.stringify(contact),
            JSON.stringify(address), locale, "buy", "pending", "", now, now,
          ]),
          ...items.map((item: { productId: string; sku: string; name: string; brand: string; quantity: number; listPrice: number; selectedFinish?: string; notes?: string; availability: string }) =>
            appendRow("Deal_Line_Items", [
              dealId, item.productId, item.sku, item.name, item.brand,
              String(item.quantity), String(item.listPrice), currency,
              item.selectedFinish ?? "", item.notes ?? "", item.availability,
              "true", now,
            ])
          ),
        ]);
      } catch (err) {
        console.error("[checkout/buy] Sheet writes failed (non-blocking):", err);
      }

      try {
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
      } catch (prefErr) {
        console.error("[checkout/buy] upsertPreferences failed (non-blocking):", prefErr);
      }

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
    };

    // Fire and don't await — response goes out immediately
    sheetWrites().catch(() => {});

    return NextResponse.json({ stripeUrl: session.url, dealId, payUrl: `/${locale ?? "en"}/checkout/pay/${dealId}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[checkout/buy] Error:", message, err);
    return NextResponse.json(
      { error: message.includes("STRIPE")
          ? "Pagos no disponibles temporalmente. Por favor contáctanos por WhatsApp."
          : "Internal error" },
      { status: 500 }
    );
  }
}
