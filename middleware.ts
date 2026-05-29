import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/app/i18n/routing";
import { validateSessionEdge } from "@/app/lib/auth-edge";

const intlMiddleware = createMiddleware(routing);

const PROTECTED_API_PREFIXES = [
  "/api/dashboard",
  "/api/stripe",
  "/api/odoo",
  "/api/social",
  "/api/dashboard-chat",
];

const isProtectedApi = (pathname: string) =>
  PROTECTED_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));

const isDashboardPath = (pathname: string) => pathname.startsWith("/dashboard");
const isAccountPath = (pathname: string) => pathname.startsWith("/account");

// Public dashboard paths (login, NextAuth's own callbacks/error pages live
// under /api/auth which is exempt below).
const PUBLIC_DASHBOARD_PATHS = new Set(["/dashboard/login"]);

const PUBLIC_ACCOUNT_PATHS = new Set([
  "/account/sign-in",
  "/account/check-email",
  "/account/sign-out",
]);

const isProtectedAccountPath = (pathname: string) =>
  pathname.startsWith("/account/projects");

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  try {
    // Dashboard routes bypass next-intl entirely (they live outside [locale])
    if (isDashboardPath(pathname)) {
      if (PUBLIC_DASHBOARD_PATHS.has(pathname)) {
        return NextResponse.next();
      }
      if (!(await validateSessionEdge(req))) {
        const loginUrl = new URL("/dashboard/login", req.url);
        return NextResponse.redirect(loginUrl);
      }
      return NextResponse.next();
    }

    // Customer account pages bypass next-intl (separate from [locale])
    if (isAccountPath(pathname)) {
      if (PUBLIC_ACCOUNT_PATHS.has(pathname)) {
        return NextResponse.next();
      }
      if (isProtectedAccountPath(pathname)) {
        if (!(await validateSessionEdge(req))) {
          const signInUrl = new URL("/account/sign-in", req.url);
          signInUrl.searchParams.set("callbackUrl", pathname);
          return NextResponse.redirect(signInUrl);
        }
      }
      return NextResponse.next();
    }

    // NextAuth's own routes must always be reachable (staff + customer).
    if (pathname.startsWith("/api/auth/")) {
      return NextResponse.next();
    }

    // Auth check for protected API routes
    if (isProtectedApi(pathname)) {
      if (!(await validateSessionEdge(req))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.next();
    }

    // Skip middleware for other API routes, static files, etc.
    if (
      pathname.startsWith("/api") ||
      pathname.startsWith("/_next") ||
      pathname.startsWith("/_vercel") ||
      pathname === "/how-it-works" ||
      pathname.startsWith("/this-week") ||
      pathname.includes(".")
    ) {
      return NextResponse.next();
    }

    // Already-localed public pages skip intlMiddleware entirely.
    // intlMiddleware only redirects non-localed URLs to the default locale;
    // if the URL already has /en/ or /es/, pass through immediately so the
    // edge function does not block waiting for the slow upstream handler.
    if (/^\/(en|es)(\/|$)/.test(pathname)) {
      return NextResponse.next();
    }

    // i18n middleware for public pages (non-localed URLs only at this point)
    return intlMiddleware(req);
  } catch (err) {
    console.error(JSON.stringify({
      where: "middleware",
      pathname: req.nextUrl.pathname,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    }));
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
