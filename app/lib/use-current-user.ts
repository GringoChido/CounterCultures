"use client";

/**
 * Client hook for the current logged-in user. Single fetch on mount, shared
 * across the page via a module-level promise cache so multiple consumers
 * don't fan out duplicate /api/dashboard/me calls.
 *
 * The cache invalidates itself on any non-OK response from /api/dashboard/me
 * (401 most commonly — session expired). This prevents a stale identity
 * from sticking after logout when the same browser tab gets re-used by a
 * different user, or after a session timeout.
 */

import { useEffect, useState } from "react";
import type { UserRole } from "./users-sheet";

export interface ClientUser {
  email: string;
  name: string | null;
  role: UserRole;
  featureOverrides: string;
}

let cached: Promise<ClientUser | null> | null = null;

/**
 * Invalidate the in-memory cache so the next consumer re-fetches /me.
 * Call this on logout or any signal that user identity may have changed.
 */
export const invalidateCurrentUserCache = (): void => {
  cached = null;
};

const fetchMe = (): Promise<ClientUser | null> => {
  if (cached) return cached;
  const inflight = fetch("/api/dashboard/me")
    .then(async (res) => {
      if (!res.ok) {
        // Session expired / unauthenticated — tear cache down so the next
        // call retries rather than returning a stale null for a session
        // that has since changed.
        cached = null;
        return null;
      }
      const data: { user: ClientUser | null } = await res.json();
      return data.user;
    })
    .catch(() => {
      cached = null;
      return null;
    });
  cached = inflight;
  return inflight;
};

export const useCurrentUser = (): { user: ClientUser | null; loading: boolean } => {
  const [user, setUser] = useState<ClientUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchMe().then((u) => {
      if (alive) {
        setUser(u);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  return { user, loading };
};
