"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";
import { hasFeature, type Feature } from "./features";
import type { UserRole } from "./users-sheet";

interface SessionUser {
  email?: string | null;
  name?: string | null;
  role?: UserRole;
  featureOverrides?: string;
}

interface UseFeaturesResult {
  ready: boolean;
  email: string | null;
  name: string | null;
  role: UserRole | null;
  has: (feature: Feature) => boolean;
}

/**
 * Hook for client components to check the signed-in user's role/features.
 * `ready` is false until the session is resolved (NextAuth fetches it on
 * mount). When `ready=false`, treat features as denied — render skeletons
 * or hide UI rather than flashing it.
 */
export const useFeatures = (): UseFeaturesResult => {
  const { data, status } = useSession();
  const user = (data?.user ?? null) as SessionUser | null;

  return useMemo<UseFeaturesResult>(() => {
    const ready = status !== "loading";
    if (!user || !user.role) {
      return {
        ready,
        email: user?.email ?? null,
        name: user?.name ?? null,
        role: null,
        has: () => false,
      };
    }
    const role = user.role;
    const featureOverrides = user.featureOverrides ?? "";
    return {
      ready,
      email: user.email ?? null,
      name: user.name ?? null,
      role,
      has: (feature: Feature) => hasFeature({ role, featureOverrides }, feature),
    };
  }, [user, status]);
};
