/**
 * Shared utilities for the Counter Cultures asset scrape.
 *
 * Design tenets:
 *  - Resumable: every script writes one file per item; reruns skip existing files.
 *  - No external deps: Node 20+ has fetch, fs, path. We use only those.
 *  - Polite: bounded concurrency + jittered delay so we don't hammer
 *    countercultures.com.mx or partner sites.
 *  - Idempotent: rerunning never corrupts staging — atomic file writes.
 */
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

export const REPO_ROOT = path.resolve(__dirname, "..", "..");
export const STAGING = path.join(REPO_ROOT, "staging");
export const PUBLIC_PRODUCTS = path.join(REPO_ROOT, "public", "products");
export const PUBLIC_SPECS = path.join(REPO_ROOT, "public", "specs");

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15 CounterCultures-AssetMigration/1.0";

export interface FetchOptions {
  /** Bytes max — abort larger payloads. Default: 10 MB */
  maxBytes?: number;
  /** Per-request timeout (ms). Default: 30s */
  timeoutMs?: number;
  /** Retry on 429/5xx/network error. Default: 3 */
  retries?: number;
  /** Extra request headers. */
  headers?: Record<string, string>;
}

const DEFAULT_OPTS: Required<Omit<FetchOptions, "headers">> = {
  maxBytes: 10 * 1024 * 1024,
  timeoutMs: 30_000,
  retries: 3,
};

/** GET with retries, timeout, and User-Agent. Returns text. */
export const getText = async (url: string, opts: FetchOptions = {}): Promise<string> => {
  const o = { ...DEFAULT_OPTS, ...opts };
  let lastErr: unknown;
  for (let attempt = 0; attempt <= o.retries; attempt++) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), o.timeoutMs);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, "Accept": "text/html,application/xhtml+xml,application/xml,*/*;q=0.8", ...opts.headers },
        signal: controller.signal,
      });
      if (res.status === 429 || res.status >= 500) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText} (non-retryable)`);
      }
      return await res.text();
    } catch (e) {
      lastErr = e;
      if (attempt === o.retries) break;
      const backoff = 800 * Math.pow(2, attempt) + Math.random() * 400;
      await sleep(backoff);
    } finally {
      clearTimeout(t);
    }
  }
  throw new Error(`getText failed after ${o.retries + 1} attempts for ${url}: ${lastErr}`);
};

/** GET binary file → write to disk atomically. Returns bytes written. */
export const downloadBinary = async (url: string, destPath: string, opts: FetchOptions = {}): Promise<number> => {
  await fs.mkdir(path.dirname(destPath), { recursive: true });
  const tmp = `${destPath}.partial-${process.pid}`;
  const o = { ...DEFAULT_OPTS, ...opts };
  let lastErr: unknown;
  for (let attempt = 0; attempt <= o.retries; attempt++) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), o.timeoutMs);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, ...opts.headers },
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.byteLength > o.maxBytes) throw new Error(`Response too large: ${buf.byteLength} > ${o.maxBytes}`);
      await fs.writeFile(tmp, buf);
      await fs.rename(tmp, destPath);
      return buf.byteLength;
    } catch (e) {
      lastErr = e;
      try { await fs.unlink(tmp); } catch {}
      if (attempt === o.retries) break;
      const backoff = 800 * Math.pow(2, attempt) + Math.random() * 400;
      await sleep(backoff);
    } finally {
      clearTimeout(t);
    }
  }
  throw new Error(`downloadBinary failed after ${o.retries + 1} attempts for ${url}: ${lastErr}`);
};

/** Bounded-concurrency map over items. Returns results in order; failures yield undefined. */
export const pool = async <T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, i: number) => Promise<R>,
  onProgress?: (done: number, total: number) => void
): Promise<(R | undefined)[]> => {
  const results: (R | undefined)[] = new Array(items.length);
  let cursor = 0;
  let done = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      try {
        results[i] = await fn(items[i], i);
      } catch (e) {
        results[i] = undefined;
        console.warn(`[pool] item ${i} failed:`, e instanceof Error ? e.message : e);
      }
      done++;
      if (onProgress) onProgress(done, items.length);
    }
  });
  await Promise.all(workers);
  return results;
};

/** Atomic JSON write. */
export const writeJson = async (filePath: string, data: unknown): Promise<void> => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tmp = `${filePath}.partial-${process.pid}`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2));
  await fs.rename(tmp, filePath);
};

export const readJson = async <T = unknown>(filePath: string): Promise<T> => {
  const text = await fs.readFile(filePath, "utf-8");
  return JSON.parse(text) as T;
};

export const exists = async (p: string): Promise<boolean> => {
  try { await fs.access(p); return true; } catch { return false; }
};

/** Decode common HTML entities used by Squarespace meta strings. */
export const decodeEntities = (s: string): string =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&aacute;/g, "á")
    .replace(/&eacute;/g, "é")
    .replace(/&iacute;/g, "í")
    .replace(/&oacute;/g, "ó")
    .replace(/&uacute;/g, "ú")
    .replace(/&ntilde;/g, "ñ")
    .replace(/&Aacute;/g, "Á")
    .replace(/&Eacute;/g, "É")
    .replace(/&Iacute;/g, "Í")
    .replace(/&Oacute;/g, "Ó")
    .replace(/&Uacute;/g, "Ú")
    .replace(/&Ntilde;/g, "Ñ")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&hellip;/g, "…")
    .replace(/&lsquo;/g, "‘")
    .replace(/&rsquo;/g, "’")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)));

/** Pull a single regex group; throws if absent. */
export const must = (s: string, re: RegExp, what: string): string => {
  const m = re.exec(s);
  if (!m) throw new Error(`Could not extract ${what}`);
  return m[1];
};

/** Pull a single regex group; returns null if absent. */
export const maybe = (s: string, re: RegExp): string | null => {
  const m = re.exec(s);
  return m ? m[1] : null;
};

/** Pull ALL captures of group 1. */
export const all = (s: string, re: RegExp): string[] => {
  const out: string[] = [];
  for (const m of s.matchAll(re)) out.push(m[1]);
  return out;
};

/** Strip HTML tags and collapse whitespace. */
export const stripHtml = (s: string): string =>
  decodeEntities(s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());

/** Normalize a Squarespace CDN URL to a specific width (default 2500). */
export const cdnAtWidth = (url: string, width = 2500): string => {
  if (!url.includes("squarespace-cdn.com")) return url;
  return url.replace(/\?format=\d+w$/, "") + `?format=${width}w`;
};

/** Slug-safe filename. */
export const slugify = (s: string): string =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);
