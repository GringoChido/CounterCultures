"use client";

import { useState, useEffect, useRef } from "react";

/**
 * React hook: debounced fetch with req-id race guard and AbortController.
 * Pass `null` as url to skip fetching.
 */
export const useDebouncedFetch = <T>(
  url: string | null,
  delayMs: number
): { data: T | null; loading: boolean; error: string | null } => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reqRef = useRef(0);

  useEffect(() => {
    if (!url) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    const myReq = ++reqRef.current;
    const abort = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(url, {
          cache: "no-store",
          signal: abort.signal,
        });
        if (myReq !== reqRef.current) return;
        if (!res.ok) {
          setError(`HTTP ${res.status}`);
          setData(null);
          return;
        }
        setData((await res.json()) as T);
        setError(null);
      } catch (e) {
        if (myReq !== reqRef.current) return;
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Fetch failed");
        setData(null);
      } finally {
        if (myReq === reqRef.current) setLoading(false);
      }
    }, delayMs);
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [url, delayMs]);

  return { data, loading, error };
};
