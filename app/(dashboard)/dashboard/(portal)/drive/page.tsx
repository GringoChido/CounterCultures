"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DriveHomeFile } from "@/app/lib/google-drive-user";
import { DriveLayout, ReconnectPrompt } from "@/app/(dashboard)/components/drive/drive-layout";
import { SuggestedFiles } from "@/app/(dashboard)/components/drive/suggested-files";
import { FileList } from "@/app/(dashboard)/components/drive/file-list";
import { FileGrid } from "@/app/(dashboard)/components/drive/file-grid";
import { Toolbar, type ViewMode } from "@/app/(dashboard)/components/drive/toolbar";

const DrivePage = () => {
  const [suggested, setSuggested] = useState<DriveHomeFile[]>([]);
  const [recent, setRecent] = useState<DriveHomeFile[]>([]);
  const [searchResults, setSearchResults] = useState<DriveHomeFile[] | null>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("list");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadHome = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [suggestedRes, recentRes] = await Promise.all([
        fetch("/api/dashboard/drive-home?action=suggested"),
        fetch("/api/dashboard/drive-home?action=recent"),
      ]);
      if (suggestedRes.status === 503 || recentRes.status === 503) {
        const data = await (suggestedRes.status === 503 ? suggestedRes : recentRes).json();
        setNeedsReconnect(Boolean(data.needsReconnect));
        setError(data.error ?? null);
        return;
      }
      if (!suggestedRes.ok || !recentRes.ok) throw new Error("Failed to load Drive");
      const suggestedData = await suggestedRes.json();
      const recentData = await recentRes.json();
      setSuggested(suggestedData.files ?? []);
      setRecent(recentData.files ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Drive");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHome();
  }, [loadHome]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const q = query.trim();
    if (!q) {
      setSearchResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/dashboard/drive-home?action=search&q=${encodeURIComponent(q)}`
        );
        if (!res.ok) {
          setSearchResults([]);
          return;
        }
        const data = await res.json();
        setSearchResults(data.files ?? []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [query]);

  if (needsReconnect) {
    return (
      <DriveLayout title="Drive">
        <ReconnectPrompt />
      </DriveLayout>
    );
  }

  const isSearching = searchResults !== null;
  const listFiles = isSearching ? searchResults : recent;
  const emptyLabel = isSearching
    ? `No files matching "${query}"`
    : "Your recent files will appear here";

  return (
    <DriveLayout title="Drive">
      <Toolbar
        query={query}
        onQueryChange={setQuery}
        view={view}
        onViewChange={setView}
      />

      {error && !needsReconnect && (
        <div className="bg-dash-danger-soft border border-dash-danger rounded-lg px-4 py-3 text-[13px] text-dash-danger">
          {error}
        </div>
      )}

      {!isSearching && (
        <SuggestedFiles files={suggested} loading={loading} />
      )}

      <section>
        <h3 className="text-[11px] uppercase tracking-wider text-dash-text-muted font-semibold mb-3">
          {isSearching ? `Results for "${query}"` : "Recent"}
        </h3>
        {view === "list" ? (
          <FileList
            files={listFiles ?? []}
            loading={loading || searching}
            emptyLabel={emptyLabel}
          />
        ) : (
          <FileGrid
            files={listFiles ?? []}
            loading={loading || searching}
            emptyLabel={emptyLabel}
          />
        )}
      </section>
    </DriveLayout>
  );
};

export default DrivePage;
