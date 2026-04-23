import { NextResponse, type NextRequest } from "next/server";
import { loadQuoteData } from "@/app/lib/quote-data";
import { buildQuoteShareUrl } from "@/app/lib/quote-token";
import { getOrCreateDepositLink } from "@/app/lib/stripe-deposit";

const siteUrl = () => {
  // Prefer the explicit public URL; fall back to the request origin during dev.
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://countercultures.mx"
  );
};

/**
 * Mint a signed customer-facing quote share URL, plus a Stripe deposit
 * payment link. Returned to the client so the Pipeline slideout can show
 * "Copy link" and "Email to customer" actions.
 */
export const GET = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: dealId } = await context.params;

  try {
    const data = await loadQuoteData(dealId);
    if (!data) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    const base = req.nextUrl.origin || siteUrl();
    const shareUrl = buildQuoteShareUrl(dealId, base);

    let depositLinkUrl: string | null = null;
    if (data.grandTotal > 0) {
      depositLinkUrl = await getOrCreateDepositLink({
        dealId,
        amountMxn: data.depositAmount,
        description: `${data.docNumber} — 50% deposit for ${data.deal.company || data.deal.name}`,
      });
    }

    return NextResponse.json({
      shareUrl,
      depositLinkUrl,
      docNumber: data.docNumber,
      company: data.deal.company || data.deal.name,
      grandTotal: data.grandTotal,
      depositAmount: data.depositAmount,
      validUntil: data.validUntil,
    });
  } catch (err) {
    console.error("[deals/share] error:", err);
    return NextResponse.json({ error: "Failed to generate share" }, { status: 500 });
  }
};
