/**
 * GET  /api/dashboard/banking-fees — list fee entries + rates
 * POST /api/dashboard/banking-fees — post a banking fee entry
 *
 * Rules 23-26 of CLAUDE-FINANCE-RULES.
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireFeature, FeatureDeniedError } from "@/app/lib/auth";
import { appendRow } from "@/app/lib/dashboard-sheets";
import {
  getFeeRates,
  listFeeEntries,
  lookupFeeRate,
  calculateFee,
  postFeeEntry,
  NETPAY_MONTHLY_RENTAL,
  type FeeSource,
  type CardType,
  type IssuerCountry,
} from "@/app/lib/banking-fees";

export const GET = async (_req: NextRequest): Promise<Response> => {
  try {
    const [rates, entries] = await Promise.all([
      getFeeRates(),
      listFeeEntries(),
    ]);
    return NextResponse.json({
      rates,
      entries,
      netpayMonthlyRental: NETPAY_MONTHLY_RENTAL,
    });
  } catch (err) {
    console.error("[banking-fees] GET error:", err);
    return NextResponse.json(
      { error: "Failed to load banking fees" },
      { status: 500 }
    );
  }
};

const PostBody = z.object({
  source: z.enum(["santander", "netpay"]),
  reference: z.string().min(1),
  lineId: z.string().min(1),
  depositAmount: z.number().positive(),
  currency: z.string().default("MXN"),
  cardType: z.enum(["debit", "credit"]),
  issuerCountry: z.enum(["mexican", "foreign"]),
});

export const POST = async (req: NextRequest): Promise<Response> => {
  try {
    const user = await requireFeature("register_payment");
    const body = PostBody.parse(await req.json());

    const rate = await lookupFeeRate(
      body.source as FeeSource,
      body.cardType as CardType,
      body.issuerCountry as IssuerCountry
    );
    if (!rate) {
      return NextResponse.json(
        { error: "No matching fee rate found" },
        { status: 400 }
      );
    }

    const feeAmount = calculateFee(body.depositAmount, rate);
    const vendorName =
      body.source === "santander"
        ? "Comisiones Bancarias - Santander"
        : "Comisiones Bancarias - NetPay";

    const result = await postFeeEntry(
      {
        source: body.source as FeeSource,
        reference: body.reference,
        lineId: body.lineId,
        depositAmount: body.depositAmount,
        feeAmount,
        feeRatePercent: rate.feePercent,
        currency: body.currency,
        cardType: body.cardType as CardType,
        issuerCountry: body.issuerCountry as IssuerCountry,
        vendorName,
        createdBy: user.email,
      },
      user.email
    );

    if (result.action === "duplicate") {
      return NextResponse.json({
        ok: true,
        action: "duplicate",
        id: result.id,
        message: "Fee already posted for this reference + line",
      });
    }

    const logId = `EA-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    appendRow("Activity_Log", [
      logId,
      new Date().toISOString(),
      user.email,
      "post_banking_fee",
      "bank_fee",
      result.id,
      JSON.stringify({
        source: body.source,
        reference: body.reference,
        deposit_amount: body.depositAmount,
        fee_amount: feeAmount,
        fee_rate: rate.feePercent,
        vendor: vendorName,
      }),
    ]).catch((err) =>
      console.error("[banking-fees] Activity_Log append failed:", err)
    );

    return NextResponse.json({
      ok: true,
      action: "created",
      id: result.id,
      feeAmount,
      feeRatePercent: rate.feePercent,
      vendorName,
    });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json(
        { error: "Forbidden", feature: err.feature },
        { status: 403 }
      );
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid body", issues: err.issues },
        { status: 400 }
      );
    }
    console.error("[banking-fees] POST error:", err);
    return NextResponse.json(
      { error: "Failed to post banking fee" },
      { status: 500 }
    );
  }
};
