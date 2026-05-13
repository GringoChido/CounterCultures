import { NextResponse } from "next/server";
import { getCustomer } from "@/app/lib/customer-sheet";

export const GET = async (req: Request) => {
  const url = new URL(req.url);
  const email = url.searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const customer = await getCustomer(email);
  if (!customer) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({
    whatsapp_marketing_opt_in:
      (customer as unknown as Record<string, string>).whatsapp_marketing_opt_in || "FALSE",
    marketing_opt_in: customer.marketing_opt_in || "TRUE",
  });
};
