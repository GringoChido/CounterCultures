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
  // Auto-tree-shake named imports from heavy packages. Without this, a single
  // `import { Search } from "lucide-react"` pulls the full package as a side
  // effect. With it, only the icons/utilities actually used ship to the client.
  // Safe to add for any package that exports named symbols cleanly.
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "recharts",
      "date-fns",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
      "@dnd-kit/utilities",
      "@tanstack/react-table",
      "sonner",
    ],
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
      // /projects rebranded to /inspiration (May 2026). Detail pages were
      // retired (the case-study catalog was sample content, no real
      // photography to back it). Slug-level URLs collapse to /inspiration.
      { source: "/:locale(en|es)/projects", destination: "/:locale/inspiration", permanent: true },
      { source: "/:locale(en|es)/projects/:slug", destination: "/:locale/inspiration", permanent: true },
      { source: "/projects", destination: "/en/inspiration", permanent: true },
      { source: "/projects/:slug", destination: "/en/inspiration", permanent: true },
      // Stranded inspiration detail URLs (the case-study slug pages were
      // retired with sample content). Bounce to the index instead of 404.
      { source: "/:locale(en|es)/inspiration/:slug", destination: "/:locale/inspiration", permanent: true },
      // /shop/quote deprecated (Day 2 PDP consolidation, 2026-05-20).
      // Quote detail slugs used `p-{id}` format which can't map to canonical
      // PDP slugs, so all quote URLs land on the catalog.
      { source: "/:locale(en|es)/shop/quote/:slug", destination: "/:locale/shop/catalog", permanent: true },
      { source: "/:locale(en|es)/shop/quote", destination: "/:locale/shop/catalog", permanent: true },
      { source: "/shop/quote/:slug", destination: "/en/shop/catalog", permanent: true },
      { source: "/shop/quote", destination: "/en/shop/catalog", permanent: true },
      // /portal → staff login (the public "Portal" button was removed)
      { source: "/portal", destination: "/dashboard/login", permanent: false },
      { source: "/:locale(en|es)/portal", destination: "/dashboard/login", permanent: false },
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
  outputFileTracingIncludes: {
    "/*": ["./app/lib/generated/products-snapshot.json.gz"],
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
