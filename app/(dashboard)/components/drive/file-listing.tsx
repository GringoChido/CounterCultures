"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DriveHomeFile } from "@/app/lib/google-drive-user";
import {
  DriveLayout,
  ReconnectPrompt,
} from "./drive-layout";
import { FileList } from "./file-list";
import { FileGrid } from "./file-grid";
import { Toolbar, type ViewMode } from "./toolbar";

interface FileListingProps {
  title: string;
  endpoint: string;
  emptyLabel: string;
  sectionLabel: string;
}

export const FileListing = ({
  title,
  endpoint,
  emptyLabel,
  sectionLabel,
}: FileListingProps) => {
  const [files, setFiles] = useState<DriveHomeFile[]>([]);
  const [searchResults, setSearchResults] = useState<DriveHomeFile[] | null>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("list");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint);
      if (res.status === 503) {
        const data = await res.json();
        setNeedsReconnect(Boolean(data.needsReconnect));
        setError(data.error ?? null);
        return;
      }
      if (!res.ok) throw new Error("Failed to load files");
      const data = await res.json();
      setFiles(data.files ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load files");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    load();
  }, [load]);

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
      <DriveLayout title={title}>
        <ReconnectPrompt />
      </DriveLayout>
    );
  }

  const isSearching = searchResults !== null;
  const displayFiles = isSearching ? searchResults : files;
  const currentEmpty = isSearching
    ? `No files matching "${query}"`
    : emptyLabel;

  return (
    <DriveLayout title={title}>
      <Toolbar
        query={query}
        onQueryChange={setQuery}
        view={view}
        onViewChange={setView}
      />
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-[13px] text-red-700">
          {error}
        </div>
      )}
      <section>
        <h3 className="text-[11px] uppercase tracking-wider text-dash-text-muted font-semibold mb-3">
          {isSearching ? `Results for "${query}"` : sectionLabel}
        </h3>
        {view === "list" ? (
          <FileList
            files={displayFiles ?? []}
            loading={loading || searching}
            emptyLabel={currentEmpty}
          />
        ) : (
          <FileGrid
            files={displayFiles ?? []}
            loading={loading || searching}
            emptyLabel={currentEmpty}
          />
        )}
      </section>
    </DriveLayout>
  );
};
