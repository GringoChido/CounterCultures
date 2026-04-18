import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { buildAuthUrl } from "@/app/lib/gmail";

const STATE_COOKIE = "cc_gmail_oauth_state";

export const GET = async () => {
  try {
    const state = randomBytes(24).toString("hex");
    const url = buildAuthUrl(state);

    const jar = await cookies();
    jar.set(STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10, // 10 min
    });

    return NextResponse.redirect(url);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to start OAuth";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
};
