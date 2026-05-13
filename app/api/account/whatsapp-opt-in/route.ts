import { NextResponse } from "next/server";
import {
  getCustomer,
  upsertCustomer,
} from "@/app/lib/customer-sheet";
import { findRowIndex, updateRowByHeader } from "@/app/lib/dashboard-sheets";

export const POST = async (req: Request) => {
  try {
    const { email, optIn } = await req.json();
    if (!email || typeof optIn !== "boolean") {
      return NextResponse.json(
        { error: "email and optIn required" },
        { status: 400 }
      );
    }

    const target = (email as string).toLowerCase().trim();
    const existing = await getCustomer(target);

    if (existing) {
      const idx = await findRowIndex("Customers", "email", target);
      if (idx !== null) {
        await updateRowByHeader("Customers", idx, {
          whatsapp_marketing_opt_in: optIn ? "TRUE" : "FALSE",
        });
      }
    } else {
      await upsertCustomer({
        email: target,
        lastLoginAt: new Date().toISOString(),
      });
      const idx = await findRowIndex("Customers", "email", target);
      if (idx !== null) {
        await updateRowByHeader("Customers", idx, {
          whatsapp_marketing_opt_in: optIn ? "TRUE" : "FALSE",
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[whatsapp-opt-in]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
};
