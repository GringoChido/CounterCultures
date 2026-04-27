import { NextResponse } from "next/server";
import { getTokenForUser, markRevoked } from "@/app/lib/gmail-tokens";
import { getCurrentUserEmail } from "@/app/lib/auth";

export const POST = async () => {
  try {
    const portalUser = await getCurrentUserEmail();
    if (!portalUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getTokenForUser(portalUser);
    if (!token) {
      return NextResponse.json({ ok: true, alreadyDisconnected: true });
    }

    // Best-effort revoke at Google — always continue to local revoke
    try {
      await fetch(
        `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token.refreshToken)}`,
        { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
    } catch {
      // ignore — revocation is best-effort
    }

    await markRevoked(portalUser);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "disconnect_failed";
    console.error("[Gmail disconnect]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
};
