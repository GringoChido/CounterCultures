import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  computeLandedCost,
  loadReferenceSnapshot,
  type LandedCostInput,
} from "@/app/lib/landed-cost";

const inputSchema = z.object({
  brandId: z.string().min(1),
  shopifyProductId: z.string(),
  fobPriceUsd: z.number().nonnegative(),
  quantity: z.number().int().positive(),
  hsCode: z.string().optional(),
  destinationType: z.enum(["warehouse_sma", "client_jobsite"]),
  destinationCity: z.string().optional(),
  fxRateUsdToMxn: z.number().positive().optional(),
  quoteDate: z.coerce.date(),
});

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }
    const input: LandedCostInput = parsed.data;
    const snapshot = await loadReferenceSnapshot();
    const output = computeLandedCost(input, snapshot);
    return NextResponse.json(output);
  } catch (err) {
    console.error("[Landed Cost API] POST error:", err);
    return NextResponse.json({ error: "Failed to compute landed cost" }, { status: 500 });
  }
};
