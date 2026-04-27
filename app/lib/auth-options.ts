/**
 * NextAuth v4 configuration. Google SSO, JWT session, restricted to
 * @countercultures.com.mx with a small allowlist for external collaborators
 * (e.g. joshua@untold.works).
 *
 * Role is read from the `Users` Sheet tab at sign-in and embedded in the JWT
 * so callers can read it without re-querying. If a user signs in successfully
 * at the OAuth layer but has no row in `Users` (or `active=false`), sign-in
 * is rejected with `AccessDenied`.
 */

import type { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { findUserByEmail, type UserRole } from "./users-sheet";

const ALLOWED_DOMAIN = "countercultures.com.mx";

const parseAllowlist = (): string[] =>
  (process.env.PORTAL_EMAIL_ALLOWLIST ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export const authOptions: AuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 }, // 7 days
  secret: process.env.SESSION_SECRET, // reuse existing secret — no new env var
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "",
      authorization: {
        params: { hd: ALLOWED_DOMAIN, prompt: "select_account" },
      },
    }),
  ],
  pages: {
    signIn: "/dashboard/login",
    error: "/dashboard/login",
  },
  callbacks: {
    async signIn({ profile }) {
      const email = profile?.email?.toLowerCase();
      if (!email) return false;
      const allowlist = parseAllowlist();
      const inDomain = email.endsWith(`@${ALLOWED_DOMAIN}`);
      if (!inDomain && !allowlist.includes(email)) return false;

      // Bootstrap mode: if the Users sheet has no rows yet (fresh deploy),
      // allow domain + allowlist members through so the first user can seed
      // it from inside the portal. Once any row exists, enforce membership.
      const { getAllUsers } = await import("./users-sheet");
      const allUsers = await getAllUsers();
      if (allUsers.length === 0) return true;

      const user = await findUserByEmail(email);
      if (!user || !user.active) return false;
      return true;
    },
    async jwt({ token, user, profile, trigger }) {
      const email = (token.email ?? user?.email ?? profile?.email)?.toLowerCase();
      // Refresh role + overrides on every sign-in/update so admin changes
      // propagate without requiring the affected user to log out and back in
      // (next request after their JWT refreshes will have the new values).
      if (email && (!token.role || trigger === "update" || trigger === "signIn")) {
        const u = await findUserByEmail(email);
        // Default to "owner" for bootstrap users (no Users-sheet row yet) so
        // the first sign-in can populate the sheet. Once seeded, this branch
        // resolves to the row's actual role.
        token.role = (u?.role ?? "owner") as UserRole;
        token.name = u?.name ?? token.name;
        token.featureOverrides = u?.featureOverrides ?? "";
      }
      if (email) token.email = email;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = (token.email as string | null) ?? session.user.email;
        session.user.name = (token.name as string | null) ?? session.user.name;
        const u = session.user as {
          role?: UserRole;
          featureOverrides?: string;
        };
        u.role = token.role as UserRole;
        u.featureOverrides = (token.featureOverrides as string) ?? "";
      }
      return session;
    },
  },
};
