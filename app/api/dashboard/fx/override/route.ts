/**
 * POST /api/dashboard/fx/override
 *
 * Records a manual FX rate override for a specific date.
 * Used when Tonina overrides the ECB rate with the actual rate.
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireFeature, FeatureDeniedError } from "@/app/lib/auth";
import { recordManualRate } from "@/app/lib/fx";
import { appendRow } from "@/app/lib/dashboard-sheets";

const Body = z.object({
  from: z.string().length(3),
  to: z.string().length(3),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rate: z.number().positive(),
  source: z.string().default("manual_override"),
});

export const POST = async (req: NextRequest): Promise<Response> => {
  try {
    const user = await requireFeature("register_payment");
    const body = Body.parse(await req.json());

    await recordManualRate(body.from, body.to, body.date, body.rate, body.source);

    const logId = `EA-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    appendRow("Activity_Log", [
      logId,
      new Date().toISOString(),
      user.email,
      "fx.override",
      "fx_rate",
      `${body.from}_${body.to}_${body.date}`,
      JSON.stringify({ from: body.from, to: body.to, date: body.date, rate: body.rate, source: body.source }),
    ]).catch((err) => console.error("[fx/override] Activity_Log append failed:", err));

    return NextResponse.json({ ok: true, rate: body.rate, date: body.date });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid body", issues: err.issues }, { status: 400 });
    }
    console.error("[fx/override]", err);
    return NextResponse.json({ error: "Failed to override rate" }, { status: 500 });
  }
};
