/**
 * Edge-runtime auth check used by middleware. Validates the NextAuth JWT
 * cookie via next-auth/jwt's `getToken`, which is edge-safe (no Node crypto
 * imports).
 */

import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export const validateSessionEdge = async (
  req: NextRequest
): Promise<boolean> => {
  const token = await getToken({
    req,
    secret: process.env.SESSION_SECRET,
  });
  return Boolean(token?.email);
};
