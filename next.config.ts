import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./app/i18n/request.ts");

const nextConfig: NextConfig = {
  compiler: {
    // Strip console.* from production bundles, but keep error and warn —
    // those are intentional and aid post-deploy debugging via the browser
    // console / error reporting (Sentry, etc.).
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
  // Server-only deps that should NOT be inlined into the Lambda handler.
  // Netlify's @netlify/plugin-nextjs traces these from node_modules at
  // runtime instead. Without this, googleapis chain gets inlined and
  // pushes the upload past Netlify's function-size limit (deploy step
  // returns "request body too large").
  serverExternalPackages: [
    "@googleapis/sheets",
    "@googleapis/drive",
    "@googleapis/gmail",
    "google-auth-library",
    "googleapis-common",
    "gaxios",
    "gtoken",
    "xlsx",
  ],
  async rewrites() {
    return [
      // Clean URL for the client-pitch walkthrough served from public/.
      { source: "/how-it-works", destination: "/how-it-works.html" },
    ];
  },
  async redirects() {
    return [
      // /projects rebranded to /inspiration (Apr 2026). Permanent so search
      // and external links roll over cleanly.
      { source: "/:locale(en|es)/projects", destination: "/:locale/inspiration", permanent: true },
      { source: "/:locale(en|es)/projects/:slug", destination: "/:locale/inspiration/:slug", permanent: true },
      { source: "/projects", destination: "/en/inspiration", permanent: true },
      { source: "/projects/:slug", destination: "/en/inspiration/:slug", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.squarespace-cdn.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "static1.squarespace.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
