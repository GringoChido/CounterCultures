import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getCustomerCart, upsertCustomerCart } from "@/app/lib/customer-sheet";

const getCustomerEmail = async (req: NextRequest): Promise<string | null> => {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_CUSTOMER_SECRET,
    cookieName: "__Secure-cc-customer-session",
  });
  if (token?.audience !== "customer") return null;
  return (token.email as string) ?? null;
};

export const GET = async (req: NextRequest) => {
  const email = await getCustomerEmail(req);
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cart = await getCustomerCart(email);
  return NextResponse.json(cart ?? { items: [], updated_at: new Date().toISOString() });
};

export const POST = async (req: NextRequest) => {
  const email = await getCustomerEmail(req);
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const items = Array.isArray(body?.items) ? body.items : [];
  await upsertCustomerCart(email, items);
  return NextResponse.json({ ok: true });
};
