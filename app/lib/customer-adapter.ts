import type { Adapter, AdapterUser, VerificationToken } from "next-auth/adapters";
import {
  readSheet,
  appendRowByHeader,
  findRowIndex,
  deleteRow,
  type SheetTab,
} from "./dashboard-sheets";

const TAB: SheetTab = "Verification_Tokens";

interface TokenRow extends Record<string, string> {
  identifier: string;
  token: string;
  expires: string;
}

export const customerAdapter: Adapter = {
  async createVerificationToken(
    data: VerificationToken
  ): Promise<VerificationToken> {
    await appendRowByHeader(TAB, {
      identifier: data.identifier,
      token: data.token,
      expires: data.expires.toISOString(),
    });
    return data;
  },

  async useVerificationToken(params: {
    identifier: string;
    token: string;
  }): Promise<VerificationToken | null> {
    const rows = await readSheet<TokenRow>(TAB);
    const idx = rows.findIndex(
      (r) => r.identifier === params.identifier && r.token === params.token
    );
    if (idx === -1) return null;

    const row = rows[idx];
    await deleteRow(TAB, idx);

    return {
      identifier: row.identifier,
      token: row.token,
      expires: new Date(row.expires),
    };
  },

  // User-management methods. With JWT strategy we don't persist users in a
  // separate users table — the Customers sheet IS the user store, looked up
  // by email in customer-auth.ts callbacks. These methods must still
  // propagate the email so NextAuth's EmailProvider flow can hand it off
  // to the jwt/session callbacks.
  //
  // BUG FIX (2026-05-13): the previous stubs returned empty strings here,
  // which caused NextAuth to mint sessions with `user.email = ""`. That
  // broke the entire customer-auth pipeline silently: the jwt callback
  // would skip the customer lookup (no email), `isTrade` stayed false,
  // and trade pricing never hydrated on PDPs.
  async createUser(user: Omit<AdapterUser, "id">) {
    const email = (user.email ?? "").toLowerCase();
    return { id: email, email, emailVerified: user.emailVerified ?? null };
  },
  async getUser(id) {
    if (!id) return null;
    const email = id.toLowerCase();
    return { id: email, email, emailVerified: null };
  },
  async getUserByEmail(email) {
    if (!email) return null;
    const e = email.toLowerCase();
    return { id: e, email: e, emailVerified: null };
  },
  async getUserByAccount() { return null; },
  async updateUser(u) {
    const email = (u.email ?? u.id ?? "").toLowerCase();
    return { id: email, email, emailVerified: u.emailVerified ?? null };
  },
  async linkAccount() { return undefined as never; },
  async createSession() { return { sessionToken: "", userId: "", expires: new Date() }; },
  async getSessionAndUser() { return null; },
  async updateSession() { return null; },
  async deleteSession() {},
};
