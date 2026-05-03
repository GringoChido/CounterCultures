"use client";

/**
 * Centralised sign-out for the dashboard. Clears every per-user client
 * cache before NextAuth tears down the session so the next sign-in (which
 * may be a different person on the same browser) starts clean.
 */

import { signOut } from "next-auth/react";
import { invalidateCurrentUserCache } from "./use-current-user";

const PER_USER_LOCAL_KEYS = [
  "cc_chat_history_v2",
  "cc_palette_recent",
  "cc-portal-settings",
  "cc-weekly-focus",
];

const PER_USER_SESSION_KEYS = ["cc_chat_dismissed_session"];

export const signOutAndCleanup = async (
  callbackUrl: string = "/dashboard/login"
): Promise<void> => {
  invalidateCurrentUserCache();
  try {
    for (const k of PER_USER_LOCAL_KEYS) localStorage.removeItem(k);
    for (const k of PER_USER_SESSION_KEYS) sessionStorage.removeItem(k);
  } catch {
    // storage unavailable — no-op
  }
  await signOut({ callbackUrl });
};
