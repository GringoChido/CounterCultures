import { NextResponse } from "next/server";
import { getStatusForUser } from "@/app/lib/gmail-tokens";
import { getCurrentUserEmail } from "@/app/lib/auth";

export const GET = async () => {
  try {
    const oauthConfigured = Boolean(
      process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET
    );
    const portalUser = await getCurrentUserEmail();
    if (!portalUser) {
      return NextResponse.json({ connected: false, oauthConfigured });
    }
    const status = await getStatusForUser(portalUser);
    return NextResponse.json({ ...status, oauthConfigured });
  } catch (err) {
    console.error("[Gmail status]", err);
    return NextResponse.json({ connected: false, oauthConfigured: false });
  }
};
