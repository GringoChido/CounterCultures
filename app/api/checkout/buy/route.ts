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
import { SITE_URL } from "@/app/lib/seo";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { locale, contact, address, project, items, cartSessionId, tradeCode, subtotal, ivaAmount, total, currency, shippingMethod, shippingCost, requiresFreightQuote } = body;

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

    // ── Server-side discount validation (never trust client) ──
    const discountCode: string | undefined = body.discountCode;
    let discountMultiplier = 1;
    let validatedDiscountPct = 0;
    let validatedDiscountFixed = 0;
    let validatedDiscountType: "percent" | "fixed" = "percent";

    if (discountCode) {
      try {
        const { readSheet } = await import("@/app/lib/dashboard-sheets");
        const promos = await readSheet<Record<string, string>>("Promo_Codes");
        const match = promos.find(
          (r) => r.code?.trim().toLowerCase() === discountCode.trim().toLowerCase()
        );
        if (match && match.active?.toUpperCase() === "TRUE") {
          const maxUses = parseInt(match.max_uses, 10) || 0;
          const usedCount = parseInt(match.used_count, 10) || 0;
          const expired = match.expires_at
            ? new Date(match.expires_at) < new Date()
            : false;
          if (!expired && (maxUses === 0 || usedCount < maxUses)) {
            const pct = parseFloat(match.discount_pct) || 0;
            const fixed = parseFloat(match.discount_fixed) || 0;
            if (fixed > 0 && pct === 0) {
              validatedDiscountType = "fixed";
              validatedDiscountFixed = fixed;
            } else if (pct > 0) {
              validatedDiscountPct = pct;
              discountMultiplier = 1 - pct / 100;
            }
          }
        }
      } catch (err) {
        console.error("[checkout/buy] Discount validation failed (ignoring):", err);
      }
    }

    // ── Stripe session FIRST — this is the only thing the customer waits for ──
    const rawItems = items.map(
      (item: { name: string; sku: string; listPrice: number; tradePrice?: number; quantity: number }) => {
        const basePrice = item.tradePrice != null && item.tradePrice > 0
          ? item.tradePrice
          : item.listPrice;
        return { ...item, basePrice };
      }
    );

    const cartGross = rawItems.reduce(
      (s: number, i: { basePrice: number; quantity: number }) => s + i.basePrice * i.quantity, 0
    );

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = rawItems.map(
      (item: { name: string; sku: string; basePrice: number; quantity: number }) => {
        let effectivePrice = item.basePrice;
        if (validatedDiscountType === "percent" && discountMultiplier < 1) {
          effectivePrice = Math.round(item.basePrice * discountMultiplier);
        } else if (validatedDiscountType === "fixed" && validatedDiscountFixed > 0 && cartGross > 0) {
          const proportion = (item.basePrice * item.quantity) / cartGross;
          const itemDiscount = Math.round(validatedDiscountFixed * proportion / item.quantity);
          effectivePrice = Math.max(0, item.basePrice - itemDiscount);
        }
        return {
          price_data: {
            currency: safeCurrency,
            product_data: {
              name: item.name,
              metadata: { sku: item.sku },
            },
            unit_amount: Math.round(effectivePrice * 100),
          },
          quantity: item.quantity,
        };
      }
    );

    // ── Drift reconciliation: per-item rounding can diverge from displayed total ──
    if (discountCode && (discountMultiplier < 1 || validatedDiscountFixed > 0)) {
      const targetDiscountCentavos = validatedDiscountType === "fixed"
        ? Math.round(Math.min(validatedDiscountFixed, cartGross) * 100)
        : Math.round(cartGross * validatedDiscountPct / 100 * 100);
      const targetTotalCentavos = Math.round(cartGross * 100) - targetDiscountCentavos;
      const actualTotalCentavos = lineItems.reduce(
        (s, li) => s + (li.price_data?.unit_amount ?? 0) * (li.quantity ?? 1), 0
      );
      const driftCentavos = actualTotalCentavos - targetTotalCentavos;
      if (driftCentavos !== 0 && lineItems.length > 0) {
        const adjustIdx = lineItems.findIndex((li) => (li.quantity ?? 1) === 1);
        const li = lineItems[adjustIdx !== -1 ? adjustIdx : 0];
        const qty = li.quantity ?? 1;
        if (li.price_data && li.price_data.unit_amount != null) {
          if (qty === 1) {
            li.price_data.unit_amount = Math.max(0, li.price_data.unit_amount - driftCentavos);
          } else {
            li.price_data.unit_amount = Math.max(0,
              li.price_data.unit_amount - Math.round(driftCentavos / qty));
          }
        }
      }
    }

    // IVA is already included in the published listPrice — do NOT add a separate line.
    // The cart UI breaks out the IVA for display, but Stripe charges the published total.

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
        ...(discountCode ? {
          discount_code: discountCode,
          discount_type: validatedDiscountType,
          discount_pct: String(validatedDiscountPct),
          discount_fixed: String(validatedDiscountFixed),
        } : {}),
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
      success_url: `${SITE_URL}/${locale}/payment-success?session_id={CHECKOUT_SESSION_ID}&deal_id=${dealId}`,
      cancel_url: `${SITE_URL}/${locale}/cart`,
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
            shippingMethod ?? "", String(shippingCost ?? ""),
            requiresFreightQuote ? "true" : "false",
          ]),
          appendRow("Cart_Sessions", [
            cartSessionId, dealId, JSON.stringify(items), JSON.stringify(contact),
            JSON.stringify(address), locale, "buy", "pending", "", now, now,
          ]),
          ...items.map((item: { productId: string; sku: string; name: string; brand: string; quantity: number; listPrice: number; tradePrice?: number; selectedFinish?: string; notes?: string; availability: string }) =>
            appendRow("Deal_Line_Items", [
              dealId, item.productId, item.sku, item.name, item.brand,
              String(item.quantity),
              String(item.tradePrice != null && item.tradePrice > 0 ? item.tradePrice : item.listPrice),
              currency,
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

      if (discountCode && (validatedDiscountPct > 0 || validatedDiscountFixed > 0)) {
        try {
          const { readSheet, updateRowByHeader, appendRowByHeader } = await import("@/app/lib/dashboard-sheets");
          const promos = await readSheet<Record<string, string>>("Promo_Codes");
          const idx = promos.findIndex(
            (r) => r.code?.trim().toLowerCase() === discountCode.trim().toLowerCase()
          );
          if (idx !== -1) {
            const usedCount = parseInt(promos[idx].used_count, 10) || 0;
            await updateRowByHeader("Promo_Codes", idx, {
              used_count: String(usedCount + 1),
            });
          }
          await appendRowByHeader("Activity_Log", {
            id: `PROMO-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: now,
            actor_email: contact.email,
            action: "promo_code_redeemed",
            entity_type: "promo_code",
            entity_id: discountCode,
            details: JSON.stringify({
              deal_id: dealId,
              discount_type: validatedDiscountType,
              discount_pct: validatedDiscountPct,
              discount_fixed: validatedDiscountFixed,
              cart_total: total,
            }),
          });
        } catch (promoErr) {
          console.error("[checkout/buy] Promo redemption log failed (non-blocking):", promoErr);
        }
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
