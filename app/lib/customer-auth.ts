import type { AuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import { Resend } from "resend";
import {
  upsertCustomer,
  getCustomer,
  backfillPipelineByEmail,
} from "./customer-sheet";

// Mirror the redirect pattern from app/lib/email.ts exactly.
const STAGING_EMAIL_REDIRECT = process.env.STAGING_EMAIL_REDIRECT;
const FROM_ADDRESS =
  process.env.RESEND_FROM_TRANSACTIONAL || "onboarding@resend.dev";
const FROM = `Counter Cultures <${FROM_ADDRESS}>`;

const redirectRecipient = (to: string): string => {
  if (!STAGING_EMAIL_REDIRECT) return to;
  if (to === STAGING_EMAIL_REDIRECT) return to;
  console.info(
    `[Email] STAGING_EMAIL_REDIRECT active — recipient rewritten ` +
      `(original: ${to}, delivered: ${STAGING_EMAIL_REDIRECT})`
  );
  return STAGING_EMAIL_REDIRECT;
};

export const customerAuthOptions: AuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 }, // 30 days
  secret: process.env.NEXTAUTH_CUSTOMER_SECRET,
  cookies: {
    sessionToken: {
      name: "__Secure-cc-customer-session",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
  },
  providers: [
    EmailProvider({
      from: FROM,
      maxAge: 24 * 60 * 60,
      sendVerificationRequest: async ({ identifier: email, url }) => {
        const key = process.env.RESEND_API_KEY;
        if (!key) {
          console.warn(
            "[customer-auth] RESEND_API_KEY not set — magic link not sent"
          );
          return;
        }

        const resend = new Resend(key);
        const deliverTo = redirectRecipient(email);

        await resend.emails.send({
          from: FROM,
          to: deliverTo,
          subject: "Sign in to Counter Cultures",
          html: `
            <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #2C2C2C;">
              <h2 style="font-weight: 400; letter-spacing: 0.05em;">Sign in to Counter Cultures</h2>
              <p style="line-height: 1.7; color: #6B6B6B;">
                Click the button below to sign in. This link expires in 24 hours.
              </p>
              <div style="margin: 24px 0;">
                <a href="${url}"
                   style="display: inline-block; padding: 12px 32px; background: #B87333;
                          color: white; text-decoration: none; border-radius: 6px;
                          font-size: 14px; letter-spacing: 0.05em;">
                  Sign in
                </a>
              </div>
              <p style="font-size: 12px; color: #999; line-height: 1.6;">
                If you didn't request this email, you can safely ignore it.
              </p>
              <hr style="border: none; border-top: 1px solid #E5E0DB; margin: 32px 0;" />
              <p style="font-size: 12px; color: #999;">Counter Cultures &middot; San Miguel de Allende, M&eacute;xico</p>
            </div>
          `,
        });

        console.info(
          `[customer-auth] Magic link sent (original: ${email}, delivered: ${deliverTo})`
        );
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID_CUSTOMER ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET_CUSTOMER ?? "",
      id: "google-customer",
      name: "Google",
    }),
  ],
  pages: {
    signIn: "/account/sign-in",
    verifyRequest: "/account/check-email",
    error: "/account/sign-in",
  },
  callbacks: {
    async signIn({ user, account }) {
      const email = user.email?.toLowerCase().trim();
      if (!email) return false;

      const now = new Date().toISOString();
      const existing = await getCustomer(email);
      const { action } = await upsertCustomer({
        email,
        name: user.name ?? undefined,
        lastLoginAt: now,
        createdAt: existing?.created_at ?? now,
      });

      if (action === "created") {
        await backfillPipelineByEmail(email);
      }

      // Google OAuth: allow any email. Email magic link: allow any.
      // No domain restriction for customers (unlike staff).
      if (account?.provider === "google-customer" || account?.provider === "email") {
        return true;
      }

      return true;
    },
    async jwt({ token, user }) {
      const email = (
        token.email ?? user?.email
      )?.toLowerCase();
      if (email) {
        token.email = email;
        token.audience = "customer";

        const customer = await getCustomer(email);
        if (customer) {
          token.isTrade = customer.is_trade === "TRUE";
          token.tradeTier = customer.trade_tier;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = (token.email as string) ?? session.user.email;
        const u = session.user as {
          audience?: string;
          isTrade?: boolean;
          tradeTier?: string;
        };
        u.audience = "customer";
        u.isTrade = (token.isTrade as boolean) ?? false;
        u.tradeTier = (token.tradeTier as string) ?? "default";
      }
      return session;
    },
  },
};
