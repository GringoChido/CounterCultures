"use client";

/**
 * Mine vs All — segmented control for filtering a rep-scoped list (leads,
 * pipeline) between "Mine" (assignedRep matches the current user) and "All".
 *
 * Default per role: sales → "mine", owner/finance → "all".
 * Persistence: localStorage key `cc:rep-filter:<scope>:<email>`. Per-user so
 * Roger and Carlos opening the same browser don't shadow each other.
 */

import { useEffect, useState } from "react";
import type { ClientUser } from "@/app/lib/use-current-user";

export type MineAllMode = "mine" | "all";

interface MineAllToggleProps {
  user: ClientUser | null;
  scope: string;
  mode: MineAllMode;
  onChange: (mode: MineAllMode) => void;
  disabled?: boolean;
}

const storageKey = (scope: string, email: string): string =>
  `cc:rep-filter:${scope}:${email}`;

export const defaultMode = (role: ClientUser["role"] | undefined): MineAllMode =>
  role === "sales" ? "mine" : "all";

/**
 * Compare an `assignedRep` field on a row to the current user. Tries email
 * first (most reliable), then falls back to name with accent + case
 * normalization. "Roger Treviño" matches "roger trevino" or just "Roger"
 * — the Users sheet often diverges from typed-by-hand assignedRep values,
 * and losing rows from the Mine view because of an accent or shorthand
 * is a worse outcome than a slightly permissive match.
 */
const normalize = (s: string): string =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

export const matchesUser = (
  assignedRep: string,
  user: ClientUser | null
): boolean => {
  if (!user) return false;
  const ar = (assignedRep ?? "").trim();
  if (!ar) return false;
  if (ar.toLowerCase() === user.email.toLowerCase()) return true;
  const userName = user.name ?? "";
  if (!userName) return false;
  const normAr = normalize(ar);
  const normName = normalize(userName);
  if (!normAr || !normName) return false;
  if (normAr === normName) return true;
  // First-name shorthand: "Roger" matches "Roger Treviño"
  const firstName = normName.split(/\s+/)[0];
  return normAr === firstName;
};

/**
 * Reads the persisted mode for this user+scope, falling back to the role
 * default. Safe to call from useState initializer once the user is known.
 */
export const readPersistedMode = (
  user: ClientUser | null,
  scope: string
): MineAllMode => {
  if (!user || typeof window === "undefined") return defaultMode(user?.role);
  try {
    const v = window.localStorage.getItem(storageKey(scope, user.email));
    if (v === "mine" || v === "all") return v;
  } catch {
    // SSR / disabled storage — fall through
  }
  return defaultMode(user.role);
};

export const MineAllToggle = ({
  user,
  scope,
  mode,
  onChange,
  disabled,
}: MineAllToggleProps): React.ReactElement => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleSelect = (next: MineAllMode): void => {
    if (disabled || !user) return;
    onChange(next);
    try {
      window.localStorage.setItem(storageKey(scope, user.email), next);
    } catch {
      // best-effort
    }
  };

  // Avoid hydration mismatch — render only after mount so persisted value wins
  if (!mounted) {
    return (
      <div className="inline-flex h-9 items-center gap-1 rounded-lg border border-dash-border bg-dash-bg px-1" />
    );
  }

  const btn = (value: MineAllMode, label: string): React.ReactElement => {
    const active = mode === value;
    return (
      <button
        key={value}
        type="button"
        onClick={() => handleSelect(value)}
        disabled={disabled || !user}
        aria-pressed={active}
        className={`px-3 h-7 text-xs font-medium rounded-md transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
          active
            ? "bg-brand-copper text-white"
            : "text-dash-text-secondary hover:text-dash-text"
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="inline-flex h-9 items-center gap-1 rounded-lg border border-dash-border bg-dash-bg px-1">
      {btn("mine", "Mine")}
      {btn("all", "All")}
    </div>
  );
};
