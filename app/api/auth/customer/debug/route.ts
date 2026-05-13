import { NextResponse } from "next/server";

export const GET = () =>
  NextResponse.json({
    hasCustomerSecret: Boolean(process.env.NEXTAUTH_CUSTOMER_SECRET),
    hasResendKey: Boolean(process.env.RESEND_API_KEY),
    hasGoogleClientId: Boolean(process.env.GOOGLE_CLIENT_ID_CUSTOMER),
    hasGoogleClientSecret: Boolean(process.env.GOOGLE_CLIENT_SECRET_CUSTOMER),
    nextauthUrl: process.env.NEXTAUTH_URL ?? "(unset)",
  });
