/**
 * NextAuth v4 configuration. Google SSO, JWT session, HARD-LOCKED to
 * @countercultures.com.mx. ANY @countercultures.com.mx account may sign in —
 * a `Users` Sheet row is NOT required (role defaults to "sales" when there is
 * no row). The only ways to be denied are: not being on the domain, or having
 * an explicit `active=false` row (an admin revoke). There is no email
 * allowlist, so no non-Counter-Cultures address can ever get in.
 */

import type { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { findUserByEmail, type UserRole } from "./users-sheet";

const ALLOWED_DOMAIN = "countercultures.com.mx";

// Break-glass accounts — always allowed in, even if the Users sheet row is
// missing, deactivated, or the Sheets API is down.
const BREAK_GLASS: Record<string, UserRole> = {
  "admin@countercultures.com.mx": "owner",
  "roger@countercultures.com.mx": "owner",
  "control@countercultures.com.mx": "finance",
};

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

      // HARD DOMAIN LOCK. Only @countercultures.com.mx accounts may ever sign
      // in. There is no allowlist and no other-domain path, so untold.works and
      // every non-Counter-Cultures address stays permanently locked out.
      const inDomain = email.endsWith(`@${ALLOWED_DOMAIN}`);
      if (!inDomain) {
        const domain = email.split("@")[1];
        console.warn(`[auth] signIn rejected: domain "${domain}" not allowed for ${email}`);
        return false;
      }

      // Break-glass accounts sign in WITHOUT any Users-sheet read, so a slow,
      // hanging, or failing Sheets call can never block or time out their login.
      if (email in BREAK_GLASS) {
        return true;
      }

      // ANY @countercultures.com.mx account is allowed in. A Users-sheet row is
      // NOT required — domain membership alone is enough (role defaults to
      // "sales" in the jwt callback below). The only way to block a domain
      // account is an explicit active=false row, which is how an admin revokes
      // someone. A Sheets read failure must NEVER lock a valid domain user out.
      let user: Awaited<ReturnType<typeof findUserByEmail>> | null = null;
      try {
        user = await findUserByEmail(email);
      } catch (err) {
        console.error(
          `[auth] signIn: Users-sheet read failed for ${email}; allowing domain account through`,
          err
        );
        return true;
      }
      if (user && !user.active) {
        console.warn(`[auth] signIn rejected: active=false for ${email}`);
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
        if (email in BREAK_GLASS) {
          // Break-glass: assign role directly, never read the Users sheet.
          token.role = BREAK_GLASS[email];
          token.featureOverrides = "";
        } else {
          let u: Awaited<ReturnType<typeof findUserByEmail>> | null = null;
          try {
            u = await findUserByEmail(email);
          } catch (err) {
            console.error(`[auth] jwt: Users-sheet read failed for ${email}`, err);
          }
          if (!u) {
            console.warn(`[auth] No Users-sheet row for ${email}; defaulting to sales role`);
          }
          token.role = (u?.role ?? "sales") as UserRole;
          token.name = u?.name ?? token.name;
          token.featureOverrides = u?.featureOverrides ?? "";
        }
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
