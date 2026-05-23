/**
 * Users sheet tab reader. Source of truth for who can sign into the portal,
 * what role they hold, and per-user feature overrides. Schema:
 *   email | name | role | active | feature_overrides
 *
 *   role:               "owner" | "finance" | "sales"
 *   active:             "true" | "false"
 *   feature_overrides:  pipe-delimited `+feature` / `-feature` tokens
 *
 * Roger (or any owner) manages this from /dashboard/settings/users. New
 * hires get a row added; departures get `active=false` (NOT row deletion —
 * preserves audit trail and prevents accidental email reuse from picking up
 * someone else's history).
 */

import {
  readSheet,
  appendRow,
  updateRow,
  findRowIndex,
  type SheetTab,
} from "./dashboard-sheets";

export type UserRole = "owner" | "finance" | "sales";

export interface PortalUser {
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  /** Raw `feature_overrides` cell — pipe-delimited `+feat|-feat` tokens. */
  featureOverrides: string;
}

interface UserRow extends Record<string, string> {
  email: string;
  name: string;
  role: string;
  active: string;
  feature_overrides: string;
}

const COLUMNS: (keyof UserRow)[] = [
  "email",
  "name",
  "role",
  "active",
  "feature_overrides",
];

const CACHE_TTL = 60 * 1000; // 1 minute — user/role changes propagate fast
let cache: { at: number; users: PortalUser[] } | null = null;

/** Retry a Sheets read with brief backoff to survive cold-start / transient 429s.
 *  If every attempt fails the error propagates — callers see a thrown error,
 *  NOT a silently-empty result that looks like "user not found." */
const retryRead = async <T extends Record<string, string>>(
  tab: SheetTab,
  attempts = 3,
): Promise<T[]> => {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await readSheet<T>(tab);
    } catch (err) {
      lastErr = err;
      console.warn(
        `[users-sheet] readSheet attempt ${i + 1}/${attempts} failed:`,
        err instanceof Error ? err.message : err,
      );
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 500 * (i + 1)));
      }
    }
  }
  throw lastErr;
};

const isRole = (s: string): s is UserRole =>
  s === "owner" || s === "finance" || s === "sales";

const toUser = (row: UserRow): PortalUser | null => {
  const email = (row.email ?? "").trim().toLowerCase();
  if (!email) return null;
  const role = (row.role ?? "").trim().toLowerCase();
  return {
    email,
    name: (row.name ?? "").trim() || email,
    role: isRole(role) ? role : "sales",
    active: (row.active ?? "").trim().toLowerCase() === "true",
    featureOverrides: (row.feature_overrides ?? "").trim(),
  };
};

const toRow = (u: PortalUser): UserRow => ({
  email: u.email,
  name: u.name,
  role: u.role,
  active: u.active ? "true" : "false",
  feature_overrides: u.featureOverrides,
});

export const getAllUsers = async (): Promise<PortalUser[]> => {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL) return cache.users;
  // retryRead retries up to 3× with backoff. If all attempts fail the error
  // propagates — the signIn callback sees a server error, NOT an empty user
  // list that would masquerade as "no such user" and reject a legitimate login.
  const rows = await retryRead<UserRow>("Users");
  const users = rows
    .map(toUser)
    .filter((u): u is PortalUser => u !== null);
  cache = { at: now, users };
  return users;
};

export const findUserByEmail = async (
  email: string
): Promise<PortalUser | null> => {
  const target = email.trim().toLowerCase();
  const users = await getAllUsers();
  return users.find((u) => u.email === target) ?? null;
};

export const invalidateUsersCache = (): void => {
  cache = null;
};

// ── Write operations (admin UI) ────────────────────────────────────────

export interface UserUpsertInput {
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  featureOverrides: string;
}

const normalizeUpsert = (input: UserUpsertInput): PortalUser => ({
  email: input.email.trim().toLowerCase(),
  name: input.name.trim() || input.email.trim().toLowerCase(),
  role: input.role,
  active: input.active,
  featureOverrides: input.featureOverrides.trim(),
});

/** Insert a new user row. Throws if a row with this email already exists. */
export const createUser = async (input: UserUpsertInput): Promise<PortalUser> => {
  const user = normalizeUpsert(input);
  const existing = await findRowIndex("Users", "email", user.email);
  if (existing !== null) {
    throw new Error(`User ${user.email} already exists`);
  }
  await appendRow("Users", COLUMNS.map((c) => toRow(user)[c]));
  invalidateUsersCache();
  return user;
};

/** Update an existing user row. Throws if no row with this email exists. */
export const updateUser = async (input: UserUpsertInput): Promise<PortalUser> => {
  const user = normalizeUpsert(input);
  const idx = await findRowIndex("Users", "email", user.email);
  if (idx === null) {
    throw new Error(`User ${user.email} not found`);
  }
  await updateRow("Users", idx, COLUMNS.map((c) => toRow(user)[c]));
  invalidateUsersCache();
  return user;
};

/** Soft-delete by flipping active=false. Row is never removed. */
export const deactivateUser = async (email: string): Promise<void> => {
  const target = email.trim().toLowerCase();
  const idx = await findRowIndex("Users", "email", target);
  if (idx === null) throw new Error(`User ${target} not found`);
  const all = await getAllUsers();
  const current = all.find((u) => u.email === target);
  if (!current) throw new Error(`User ${target} not found`);
  const updated: PortalUser = { ...current, active: false };
  await updateRow("Users", idx, COLUMNS.map((c) => toRow(updated)[c]));
  invalidateUsersCache();
};
