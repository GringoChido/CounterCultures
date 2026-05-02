/**
 * Returns the current logged-in user as JSON for client components that need
 * to know who's looking. Mirrors `getCurrentUser()` shape; returns 401 when
 * unauthenticated so the client hook can short-circuit.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/auth";

export const GET = async (): Promise<Response> => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user });
};
