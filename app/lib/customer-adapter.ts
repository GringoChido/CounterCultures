import type { Adapter, VerificationToken } from "next-auth/adapters";
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

  // Stubs — not used with JWT strategy, but NextAuth requires the shape.
  async createUser() { return { id: "", email: "", emailVerified: null }; },
  async getUser() { return null; },
  async getUserByEmail() { return null; },
  async getUserByAccount() { return null; },
  async updateUser(u) { return { id: u.id ?? "", email: "", emailVerified: null }; },
  async linkAccount() { return undefined as never; },
  async createSession() { return { sessionToken: "", userId: "", expires: new Date() }; },
  async getSessionAndUser() { return null; },
  async updateSession() { return null; },
  async deleteSession() {},
};
