import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireFeature, FeatureDeniedError } from "@/app/lib/auth";
import { createCustomer } from "@/app/lib/odoo/write";
import { appendRow } from "@/app/lib/dashboard-sheets";

const Body = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
  company: z.string().max(200).optional().or(z.literal("")),
});

export const POST = async (req: NextRequest): Promise<Response> => {
  try {
    const user = await requireFeature("create_quote");
    const body = Body.parse(await req.json());

    const result = await createCustomer({
      name: body.name,
      email: body.email || undefined,
      phone: body.phone || undefined,
      company: body.company || undefined,
    });

    appendRow("Activity_Log", [
      `EA-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      new Date().toISOString(),
      user.email,
      "create_customer",
      "res_partner",
      String(result.partnerId),
      JSON.stringify({ name: body.name, email: body.email }),
    ]).catch((err) =>
      console.error("[customers/create] Activity_Log append failed:", err)
    );

    return NextResponse.json({ ok: true, ...result });
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
    const msg = err instanceof Error ? err.message : "create_customer_failed";
    console.error("[/api/dashboard/customers/create]", msg);
    const status = msg.includes("not configured")
      ? 503
      : msg.includes("Odoo authentication failed")
        ? 502
        : 500;
    return NextResponse.json({ error: msg }, { status });
  }
};
