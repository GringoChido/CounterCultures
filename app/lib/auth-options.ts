/**
 * NextAuth v4 configuration. Google SSO, JWT session, restricted to
 * @countercultures.com.mx. Role is read from the `Users` Sheet tab at
 * sign-in and embedded in the JWT. If a user has no row in `Users` (or
 * `active=false`), sign-in is rejected with `AccessDenied`.
 */

import type { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { findUserByEmail, type UserRole } from "./users-sheet";

const ALLOWED_DOMAIN = "countercultures.com.mx";

// Break-glass superadmin — always allowed in, even if the Users sheet row is
// missing, deactivated, or the Sheets API is down. Gets owner role as fallback.
const SUPERADMIN_EMAIL = "admin@countercultures.com.mx";

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
      if (!email) {
        console.warn("[auth] signIn rejected: no email on profile");
        return false;
      }
      const allowlist = parseAllowlist();
      const domain = email.split("@")[1];
      const inDomain = email.endsWith(`@${ALLOWED_DOMAIN}`);
      if (!inDomain && !allowlist.includes(email)) {
        console.warn(`[auth] signIn rejected: domain "${domain}" not allowed for ${email}`);
        return false;
      }

      const user = await findUserByEmail(email);
      if (!user || !user.active) {
        if (email === SUPERADMIN_EMAIL) {
          console.warn(`[auth] superadmin bypass: ${email} allowed in despite ${!user ? "missing sheet row" : "active=false"}`);
          return true;
        }
        console.warn(`[auth] signIn rejected: ${!user ? "no Users-sheet row" : "active=false"} for ${email}`);
        return false;
      }
      return true;
    },
    async jwt({ token, user, profile, trigger }) {
      const email = (token.email ?? user?.email ?? profile?.email)?.toLowerCase();
      // Refresh role + overrides on every sign-in/update so admin changes
      // propagate without requiring the affected user to log out and back in
      // (next request after their JWT refreshes will have the new values).
      if (email && (!token.role || trigger === "update" || trigger === "signIn")) {
        const u = await findUserByEmail(email);
        if (!u && email !== SUPERADMIN_EMAIL) {
          console.warn(`[auth] No Users-sheet row for ${email}; defaulting to sales role`);
        }
        token.role = (u?.role ?? (email === SUPERADMIN_EMAIL ? "owner" : "sales")) as UserRole;
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
