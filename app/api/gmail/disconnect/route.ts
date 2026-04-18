import { NextResponse } from "next/server";
import { getActiveToken, markRevoked } from "@/app/lib/gmail-tokens";

export const POST = async () => {
  try {
    const token = await getActiveToken();
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

    await markRevoked(token.gmailAddress);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "disconnect_failed";
    console.error("[Gmail disconnect]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
};
