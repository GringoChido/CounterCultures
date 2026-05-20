import { NextResponse, type NextRequest } from "next/server";
import { readSheet } from "@/app/lib/dashboard-sheets";

interface PromoCodeRow extends Record<string, string> {
  code: string;
  type: string;
  discount_pct: string;
  discount_fixed: string;
  max_uses: string;
  used_count: string;
  issued_to: string;
  issued_at: string;
  expires_at: string;
  active: string;
  notes: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      code?: string;
      cartSubtotal?: number;
      customerEmail?: string;
    };

    const code = body.code?.trim();
    if (!code) {
      return NextResponse.json(
        { valid: false, reason: "Code is required" },
        { status: 400 }
      );
    }

    const rows = await readSheet<PromoCodeRow>("Promo_Codes");
    const match = rows.find(
      (r) => r.code.trim().toLowerCase() === code.toLowerCase()
    );

    if (!match) {
      return NextResponse.json(
        { valid: false, reason: "Invalid code" },
        { status: 404 }
      );
    }

    if (match.active?.toUpperCase() !== "TRUE") {
      return NextResponse.json(
        { valid: false, reason: "This code is no longer active" },
        { status: 410 }
      );
    }

    if (match.expires_at) {
      const expires = new Date(match.expires_at);
      if (!isNaN(expires.getTime()) && expires < new Date()) {
        return NextResponse.json(
          { valid: false, reason: "This code has expired" },
          { status: 410 }
        );
      }
    }

    const maxUses = parseInt(match.max_uses, 10) || 0;
    const usedCount = parseInt(match.used_count, 10) || 0;
    if (maxUses > 0 && usedCount >= maxUses) {
      return NextResponse.json(
        { valid: false, reason: "This code has been fully redeemed" },
        { status: 410 }
      );
    }

    const discountPct = parseFloat(match.discount_pct) || 0;
    const discountFixed = parseFloat(match.discount_fixed) || 0;

    const isFixed = discountFixed > 0 && discountPct === 0;
    const cartSubtotal = body.cartSubtotal ?? 0;

    let discountAmount = 0;
    if (isFixed) {
      discountAmount = Math.min(discountFixed, cartSubtotal);
    } else if (discountPct > 0) {
      discountAmount = Math.round(cartSubtotal * discountPct / 100);
    }

    return NextResponse.json({
      valid: true,
      discountAmount,
      discountType: isFixed ? "fixed" : "percent",
      discountPct: isFixed ? 0 : discountPct,
      discountFixed: isFixed ? discountFixed : 0,
      codeName: match.code,
    });
  } catch (err) {
    console.error("[discount-validate] Error:", err);
    return NextResponse.json(
      { valid: false, reason: "Unable to validate code" },
      { status: 500 }
    );
  }
}
