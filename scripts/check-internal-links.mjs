#!/usr/bin/env node

/**
 * Internal link checker for Counter Cultures.
 * Crawls from seed URLs, follows internal links up to depth 3, reports non-200s.
 *
 * Usage: node scripts/check-internal-links.mjs https://countercultures.netlify.app
 *
 * Exit 0 = all links OK. Exit 1 = 4xx/5xx found.
 *
 * To allowlist URLs (e.g. intentional external-redirect pages), add them
 * one-per-line to scripts/.linkcheckerignore (glob patterns not supported,
 * just exact path prefixes like /api/ or full paths like /en/some-page).
 */

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const MAX_DEPTH = 3;
const CONCURRENCY = 8;
const TIMEOUT_MS = 10_000;
const MAX_RETRIES = 1;

const SEEDS = [
  "/es",
  "/en",
  "/es/brands",
  "/en/brands",
  "/es/shop/catalog",
  "/en/shop/catalog",
  "/es/shop/bathroom",
  "/en/shop/bathroom",
  "/es/shop/kitchen",
  "/en/shop/kitchen",
  "/es/shop/hardware",
  "/en/shop/hardware",
];

const baseUrl = process.argv[2];
if (!baseUrl) {
  console.error("Usage: node scripts/check-internal-links.mjs <base-url>");
  process.exit(2);
}

const origin = new URL(baseUrl).origin;

const scriptDir = dirname(fileURLToPath(import.meta.url));
let ignorePrefixes = [];
try {
  const raw = await readFile(join(scriptDir, ".linkcheckerignore"), "utf8");
  ignorePrefixes = raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
} catch {
  // no ignore file — that's fine
}

function shouldIgnore(path) {
  return ignorePrefixes.some((prefix) => path.startsWith(prefix));
}

function isInternalPath(href) {
  if (!href) return false;
  if (
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("wa.me") ||
    href.startsWith("https://wa.me") ||
    href.startsWith("http://wa.me") ||
    href.startsWith("javascript:") ||
    href.startsWith("data:")
  )
    return false;
  if (href.startsWith("#")) return false;

  if (href.startsWith("/")) return true;

  try {
    const url = new URL(href);
    return url.origin === origin;
  } catch {
    return false;
  }
}

function normalizePath(href) {
  let path;
  if (href.startsWith("/")) {
    path = href;
  } else {
    try {
      path = new URL(href).pathname;
    } catch {
      return null;
    }
  }
  path = path.split("#")[0].split("?")[0];
  if (path !== "/" && path.endsWith("/")) {
    path = path.slice(0, -1);
  }
  return path || "/";
}

function extractHrefs(html) {
  const hrefs = new Set();
  const regex = /href\s*=\s*["']([^"']+)["']/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    hrefs.add(match[1]);
  }
  return hrefs;
}

async function fetchWithRetry(url, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const res = await fetch(url, {
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent": "CC-LinkChecker/1.0",
          Accept: "text/html,*/*",
        },
      });
      clearTimeout(timer);
      const text = res.headers.get("content-type")?.includes("text/html")
        ? await res.text()
        : null;
      return { status: res.status, redirected: res.redirected, url: res.url, html: text };
    } catch (err) {
      if (attempt === retries) {
        return { status: 0, error: err.message, html: null };
      }
    }
  }
}

// --- Crawler state ---
const visited = new Map(); // path → { status, redirected, finalUrl, depth }
const queue = []; // { path, depth }
let inFlight = 0;
let resolveIdle;
let idlePromise = new Promise((r) => (resolveIdle = r));

for (const seed of SEEDS) {
  const path = normalizePath(seed);
  if (path && !visited.has(path) && !shouldIgnore(path)) {
    visited.set(path, null); // mark queued
    queue.push({ path, depth: 0 });
  }
}

function scheduleNext() {
  while (inFlight < CONCURRENCY && queue.length > 0) {
    const item = queue.shift();
    inFlight++;
    processUrl(item).finally(() => {
      inFlight--;
      if (queue.length > 0) {
        scheduleNext();
      } else if (inFlight === 0) {
        resolveIdle();
      }
    });
  }
}

async function processUrl({ path, depth }) {
  const fullUrl = `${origin}${path}`;
  const result = await fetchWithRetry(fullUrl);

  const record = {
    status: result.status,
    redirected: result.redirected || false,
    finalUrl: result.url || fullUrl,
    depth,
    error: result.error || null,
  };
  visited.set(path, record);

  const statusChar =
    result.status >= 200 && result.status < 300
      ? "."
      : result.status >= 300 && result.status < 400
        ? "→"
        : result.status >= 400
          ? "✗"
          : "?";
  process.stdout.write(statusChar);

  if (result.html && depth < MAX_DEPTH) {
    const hrefs = extractHrefs(result.html);
    for (const href of hrefs) {
      if (!isInternalPath(href)) continue;
      const normalized = normalizePath(href);
      if (!normalized) continue;
      if (visited.has(normalized)) continue;
      if (shouldIgnore(normalized)) continue;
      // skip API routes, _next, static assets
      if (
        normalized.startsWith("/api/") ||
        normalized.startsWith("/_next/") ||
        normalized.startsWith("/favicon") ||
        /\.(css|js|png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|eot|mp4|webm|pdf)$/i.test(normalized)
      )
        continue;

      visited.set(normalized, null); // mark queued
      queue.push({ path: normalized, depth: depth + 1 });
    }
  }
}

// --- Run ---
console.log(`\nCrawling ${origin} (max depth ${MAX_DEPTH}, concurrency ${CONCURRENCY})\n`);
scheduleNext();
await idlePromise;
console.log("\n");

// --- Report ---
const results = [...visited.entries()]
  .filter(([, r]) => r !== null)
  .sort(([a], [b]) => a.localeCompare(b));

const ok = results.filter(([, r]) => r.status >= 200 && r.status < 300 && !r.redirected);
const redirects = results.filter(([, r]) => r.redirected || (r.status >= 300 && r.status < 400));
const notFound = results.filter(([, r]) => r.status >= 400 && r.status < 500);
const serverErr = results.filter(([, r]) => r.status >= 500);
const networkErr = results.filter(([, r]) => r.status === 0);

console.log(`✅ 200 OK: ${ok.length} urls`);
console.log();

if (redirects.length > 0) {
  console.log(`⚠️  3xx / redirect: ${redirects.length} urls`);
  for (const [path, r] of redirects) {
    console.log(`   ${path} → ${r.finalUrl} (${r.status})`);
  }
  console.log();
}

if (notFound.length > 0) {
  console.log(`❌ 4xx NOT FOUND: ${notFound.length} urls`);
  for (const [path, r] of notFound) {
    console.log(`   ${path} (${r.status})`);
  }
  console.log();
}

if (serverErr.length > 0) {
  console.log(`❌ 5xx SERVER ERROR: ${serverErr.length} urls`);
  for (const [path, r] of serverErr) {
    console.log(`   ${path} (${r.status})`);
  }
  console.log();
}

if (networkErr.length > 0) {
  console.log(`⚠️  Network errors: ${networkErr.length} urls`);
  for (const [path, r] of networkErr) {
    console.log(`   ${path} — ${r.error}`);
  }
  console.log();
}

console.log(`Total crawled: ${results.length}`);

const hasErrors = notFound.length > 0 || serverErr.length > 0;
if (hasErrors) {
  console.log("\n💥 FAIL — broken links found");
  process.exit(1);
} else {
  console.log("\n🎉 PASS — no broken links");
  process.exit(0);
}
