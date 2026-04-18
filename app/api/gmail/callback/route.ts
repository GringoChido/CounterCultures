import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { exchangeCodeForTokens } from "@/app/lib/gmail";
import { saveToken } from "@/app/lib/gmail-tokens";

const STATE_COOKIE = "cc_gmail_oauth_state";

const redirectSettings = (req: NextRequest, params: Record<string, string>) => {
  const url = req.nextUrl.clone();
  url.pathname = "/dashboard/settings";
  url.search = "";
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return NextResponse.redirect(url);
};

export const GET = async (req: NextRequest) => {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const oauthError = req.nextUrl.searchParams.get("error");

  const jar = await cookies();
  const expected = jar.get(STATE_COOKIE)?.value;
  jar.delete(STATE_COOKIE);

  if (oauthError) {
    return redirectSettings(req, { gmail: "error", reason: oauthError });
  }
  if (!code || !state || !expected || state !== expected) {
    return redirectSettings(req, { gmail: "error", reason: "state_mismatch" });
  }

  try {
    const { refreshToken, gmailAddress, scopes } = await exchangeCodeForTokens(code);
    if (!gmailAddress) {
      return redirectSettings(req, {
        gmail: "error",
        reason: "no_gmail_address",
      });
    }
    await saveToken({ gmailAddress, refreshToken, scopes });
    return redirectSettings(req, {
      gmail: "connected",
      as: gmailAddress,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "oauth_failed";
    console.error("[Gmail OAuth callback]", msg);
    return redirectSettings(req, {
      gmail: "error",
      reason: encodeURIComponent(msg.slice(0, 200)),
    });
  }
};
