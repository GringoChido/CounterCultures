import { NextResponse, type NextRequest } from "next/server";
import { readSheet } from "@/app/lib/dashboard-sheets";

interface TradeCodeRow extends Record<string, string> {
  code: string;
  partner_name: string;
  discount_pct: string;
  active: string;
  issued_to: string;
  expires_at: string;
}

export async function POST(req: NextRequest) {
  try {
    const { code } = (await req.json()) as { code?: string };
    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { ok: false, message: "Code is required" },
        { status: 400 }
      );
    }

    const rows = await readSheet<TradeCodeRow>("Trade_Codes");
    const match = rows.find(
      (r) => r.code.trim().toLowerCase() === code.trim().toLowerCase()
    );

    if (!match) {
      return NextResponse.json(
        { ok: false, message: "Invalid trade code" },
        { status: 404 }
      );
    }

    if (match.active?.toLowerCase() !== "true") {
      return NextResponse.json(
        { ok: false, message: "This code is no longer active" },
        { status: 410 }
      );
    }

    if (match.expires_at) {
      const expires = new Date(match.expires_at);
      if (!isNaN(expires.getTime()) && expires < new Date()) {
        return NextResponse.json(
          { ok: false, message: "This code has expired" },
          { status: 410 }
        );
      }
    }

    const discountPct = parseFloat(match.discount_pct) || 0;

    return NextResponse.json({
      ok: true,
      discountPct,
      partnerName: match.partner_name,
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Unable to validate code" },
      { status: 500 }
    );
  }
}
