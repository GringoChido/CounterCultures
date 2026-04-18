import { NextResponse } from "next/server";
import { getActiveStatus } from "@/app/lib/gmail-tokens";

export const GET = async () => {
  try {
    const status = await getActiveStatus();
    const oauthConfigured = Boolean(
      process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET
    );
    return NextResponse.json({ ...status, oauthConfigured });
  } catch (err) {
    console.error("[Gmail status]", err);
    return NextResponse.json({ connected: false, oauthConfigured: false });
  }
};
