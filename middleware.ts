import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/app/i18n/routing";
import { validateSessionFromCookie } from "@/app/lib/auth";

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

const isDashboardPage = (pathname: string) =>
  pathname.startsWith("/dashboard") && pathname !== "/dashboard/login";

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Auth check for protected dashboard pages
  if (isDashboardPage(pathname)) {
    const session = req.cookies.get("cc-portal-session")?.value;
    if (!validateSessionFromCookie(session)) {
      return NextResponse.redirect(new URL("/dashboard/login", req.url));
    }
    return NextResponse.next();
  }

  // Auth check for protected API routes
  if (isProtectedApi(pathname)) {
    const session = req.cookies.get("cc-portal-session")?.value;
    if (!validateSessionFromCookie(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Skip middleware for other API routes, static files, etc.
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/_vercel") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // i18n middleware for public pages
  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
