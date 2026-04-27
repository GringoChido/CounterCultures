/**
 * Server-side auth helpers. Reads the NextAuth JWT session for the current
 * request. Anything that needs "who is calling this" goes through here.
 *
 * `getCurrentUserEmail` returns the lowercased email or null. No env-var
 * fallback — if there's no session, there is no user.
 */

import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "./auth-options";
import type { UserRole } from "./users-sheet";
import { hasFeature, type Feature } from "./features";

export interface CurrentUser {
  email: string;
  name: string | null;
  role: UserRole;
  featureOverrides: string;
}

export const getCurrentUser = async (): Promise<CurrentUser | null> => {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  const email = user?.email?.toLowerCase();
  if (!user || !email) return null;
  const u = user as { role?: UserRole; featureOverrides?: string };
  return {
    email,
    name: user.name ?? null,
    role: u.role ?? "sales",
    featureOverrides: u.featureOverrides ?? "",
  };
};

/**
 * API route guard. Throws a typed `FeatureDeniedError` if the current user
 * lacks the feature; route handlers catch it and return 403.
 */
export class FeatureDeniedError extends Error {
  constructor(public feature: Feature) {
    super(`Feature denied: ${feature}`);
  }
}

export const requireFeature = async (feature: Feature): Promise<CurrentUser> => {
  const user = await getCurrentUser();
  if (!user) throw new FeatureDeniedError(feature);
  if (!hasFeature(user, feature)) throw new FeatureDeniedError(feature);
  return user;
};

export const getCurrentUserEmail = async (): Promise<string | null> =>
  (await getCurrentUser())?.email ?? null;

export const validateSession = async (): Promise<boolean> =>
  (await getCurrentUser()) !== null;

/**
 * Request-scoped variant for API routes. Reads the NextAuth JWT directly off
 * the request cookie — no need for `cookies()` (which is route-handler-only).
 */
export const getCurrentUserEmailFromRequest = async (req: {
  headers: { get(name: string): string | null };
  cookies?: unknown;
}): Promise<string | null> => {
  const token = await getToken({
    // next-auth/jwt accepts NextRequest; the loose typing keeps callers happy
    req: req as Parameters<typeof getToken>[0]["req"],
    secret: process.env.SESSION_SECRET,
  });
  const email = (token?.email as string | undefined)?.toLowerCase();
  return email ?? null;
};
