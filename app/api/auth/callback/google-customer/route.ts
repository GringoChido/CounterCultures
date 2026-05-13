import { NextRequest, NextResponse } from "next/server";

// NextAuth v4 hard-codes /api/auth as its base path, so the Google OAuth
// redirect_uri it sends to Google is /api/auth/callback/google-customer.
// Google redirects here after consent. Forward to the customer NextAuth
// handler at /api/auth/customer/callback/google-customer, preserving all
// query params (code, state, etc.). 307 keeps the GET method.
export const GET = (req: NextRequest) => {
  const target = new URL(
    `/api/auth/customer/callback/google-customer`,
    req.url
  );
  target.search = req.nextUrl.search;
  return NextResponse.redirect(target, 307);
};
