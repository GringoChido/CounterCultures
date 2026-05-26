import { NextResponse, type NextRequest } from "next/server";
import { appendRow } from "@/app/lib/dashboard-sheets";
import { upsertPreferences } from "@/app/lib/customer-preferences";
import { signQuoteToken } from "@/app/lib/quote-token";
import { SITE_URL } from "@/app/lib/seo";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { locale, contact, address, project, items, cartSessionId, tradeCode, subtotal, total, currency, shippingMethod, shippingCost, requiresFreightQuote } = body;

    if (!contact?.email || !contact?.name || !items?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const dealId = `DEAL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();

    // ── Generate response data FIRST — customer gets the URL immediately ──
    let trackerUrl = `${SITE_URL}/${locale}/quote/${dealId}`;
    try {
      const trackerToken = signQuoteToken(dealId);
      trackerUrl = `${SITE_URL}/${locale}/quote/${dealId}?t=${encodeURIComponent(trackerToken)}`;
    } catch (tokenErr) {
      console.error("[checkout/quote] signQuoteToken failed (non-blocking):", tokenErr);
    }

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
            JSON.stringify(address), locale, "quote", "submitted", "", now, now,
          ]),
          ...items.map((item: { productId: string; sku: string; name: string; brand: string; quantity: number; listPrice: number; tradePrice?: number; selectedFinish?: string; notes?: string; availability: string; buyable: boolean }) =>
            appendRow("Deal_Line_Items", [
              dealId, item.productId, item.sku, item.name, item.brand,
              String(item.quantity),
              String(item.tradePrice != null && item.tradePrice > 0 ? item.tradePrice : item.listPrice),
              currency,
              item.selectedFinish ?? "", item.notes ?? "", item.availability,
              item.buyable ? "true" : "false", now,
            ])
          ),
        ]);
      } catch (err) {
        console.error("[checkout/quote] Sheet writes failed (non-blocking):", err);
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
        console.error("[checkout/quote] upsertPreferences failed (non-blocking):", prefErr);
      }

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
        // Non-blocking
      }
    };

    sheetWrites().catch(() => {});

    return NextResponse.json({ dealId, trackerUrl });
  } catch (err) {
    console.error("[checkout/quote] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
