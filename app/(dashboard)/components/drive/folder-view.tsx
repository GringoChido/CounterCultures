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

interface FolderViewProps {
  folderId: string;
}

export const FolderView = ({ folderId }: FolderViewProps) => {
  const [files, setFiles] = useState<DriveHomeFile[]>([]);
  const [folderName, setFolderName] = useState<string>("Folder");
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
      const [filesRes, metaRes] = await Promise.all([
        fetch(`/api/dashboard/drive-home?action=folder&folderId=${folderId}`),
        fetch(
          `/api/dashboard/drive-home?action=folder-meta&folderId=${folderId}`
        ),
      ]);
      if (filesRes.status === 503) {
        const data = await filesRes.json();
        setNeedsReconnect(Boolean(data.needsReconnect));
        setError(data.error ?? null);
        return;
      }
      if (!filesRes.ok) throw new Error("Failed to load folder");
      const filesData = await filesRes.json();
      setFiles(filesData.files ?? []);
      if (metaRes.ok) {
        const metaData = await metaRes.json();
        setFolderName(metaData.meta?.name ?? "Folder");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load folder");
    } finally {
      setLoading(false);
    }
  }, [folderId]);

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
      <DriveLayout title="Drive">
        <ReconnectPrompt />
      </DriveLayout>
    );
  }

  const isSearching = searchResults !== null;
  const displayFiles = isSearching ? searchResults : files;
  const emptyLabel = isSearching
    ? `No files matching "${query}"`
    : "This folder is empty";

  return (
    <DriveLayout title={folderName}>
      <Toolbar
        query={query}
        onQueryChange={setQuery}
        view={view}
        onViewChange={setView}
      />
      {error && (
        <div className="bg-dash-danger-soft border border-dash-danger rounded-lg px-4 py-3 text-[13px] text-dash-danger">
          {error}
        </div>
      )}
      <section>
        <h3 className="text-[11px] uppercase tracking-wider text-dash-text-muted font-semibold mb-3">
          {isSearching ? `Results for "${query}"` : "Files"}
        </h3>
        {view === "list" ? (
          <FileList
            files={displayFiles ?? []}
            loading={loading || searching}
            emptyLabel={emptyLabel}
          />
        ) : (
          <FileGrid
            files={displayFiles ?? []}
            loading={loading || searching}
            emptyLabel={emptyLabel}
          />
        )}
      </section>
    </DriveLayout>
  );
};
