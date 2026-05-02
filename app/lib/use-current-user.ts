"use client";

/**
 * Client hook for the current logged-in user. Single fetch on mount, shared
 * across the page via a module-level promise cache so multiple consumers
 * don't fan out duplicate /api/dashboard/me calls.
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

const fetchMe = (): Promise<ClientUser | null> => {
  if (cached) return cached;
  cached = fetch("/api/dashboard/me")
    .then((res) => (res.ok ? res.json() : { user: null }))
    .then((data: { user: ClientUser | null }) => data.user)
    .catch(() => null);
  return cached;
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
