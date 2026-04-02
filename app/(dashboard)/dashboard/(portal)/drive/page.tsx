"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Folder,
  FileText,
  FileSpreadsheet,
  Image,
  Film,
  File,
  Search,
  ChevronRight,
  Home,
  Plus,
  Upload,
  Trash2,
  ExternalLink,
  Loader2,
  FolderOpen,
  AlertCircle,
  X,
  Eye,
  DollarSign,
} from "lucide-react";
import { PreviewPanel, type PreviewFile } from "@/app/(dashboard)/components/preview-panel";

// ── Types ─────────────────────────────────────────────────────────────

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  modifiedTime: string;
  webViewLink: string;
  thumbnailLink: string | null;
  isFolder: boolean;
}

interface DriveFolder {
  id: string;
  name: string;
  fileCount: number;
  modifiedTime: string;
  webViewLink: string;
}

interface Breadcrumb {
  id: string;
  name: string;
}

// ── Helpers ───────────────────────────────────────────────────────────

const formatSize = (bytes: string) => {
  const n = Number(bytes);
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const formatDate = (iso: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getFileIcon = (mimeType: string) => {
  if (mimeType.includes("folder")) return Folder;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
    return FileSpreadsheet;
  if (mimeType.includes("image")) return Image;
  if (mimeType.includes("video")) return Film;
  if (mimeType.includes("document") || mimeType.includes("pdf"))
    return FileText;
  return File;
};

const getFileColor = (mimeType: string) => {
  if (mimeType.includes("folder"))
    return "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
    return "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400";
  if (mimeType.includes("image"))
    return "bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400";
  if (mimeType.includes("video"))
    return "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400";
  if (mimeType.includes("document"))
    return "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
  if (mimeType.includes("pdf"))
    return "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400";
  return "bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
};

// ── Component ─────────────────────────────────────────────────────────

const DrivePage = () => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DriveFile[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);

  // Modal states
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Preview state
  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null);

  const openPreview = (file: DriveFile) => {
    setPreviewFile({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      webViewLink: file.webViewLink,
      thumbnailLink: file.thumbnailLink,
      size: file.size,
      modifiedTime: file.modifiedTime,
    });
  };

  // ── Fetch data ────────────────────────────────────────────────────

  const fetchFolder = useCallback(async (folderId?: string | null) => {
    setLoading(true);
    setError(null);
    setSearchResults(null);
    setSearchQuery("");

    try {
      const params = new URLSearchParams();
      if (folderId) params.set("folderId", folderId);

      // Fetch files and folders in parallel
      const [filesRes, foldersRes, crumbsRes] = await Promise.all([
        fetch(`/api/dashboard/drive?action=list&${params}`),
        fetch(`/api/dashboard/drive?action=folders&${params}`),
        folderId
          ? fetch(
              `/api/dashboard/drive?action=breadcrumbs&folderId=${folderId}`
            )
          : Promise.resolve(null),
      ]);

      if (filesRes.status === 503) {
        setNotConfigured(true);
        setLoading(false);
        return;
      }

      if (!filesRes.ok) throw new Error("Failed to load files");

      const filesData = await filesRes.json();
      const foldersData = await foldersRes.json();
      const crumbsData = crumbsRes ? await crumbsRes.json() : { breadcrumbs: [] };

      // Filter out folders from files list (they'll show in the folders section)
      setFiles(
        filesData.files?.filter((f: DriveFile) => !f.isFolder) ?? []
      );
      setFolders(foldersData.folders ?? []);
      setBreadcrumbs(crumbsData.breadcrumbs ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Drive");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFolder(currentFolderId);
  }, [currentFolderId, fetchFolder]);

  // ── Search ────────────────────────────────────────────────────────

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/dashboard/drive?action=search&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await res.json();
      setSearchResults(data.files ?? []);
    } catch {
      setError("Search failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Create folder ─────────────────────────────────────────────────

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setCreating(true);

    try {
      await fetch("/api/dashboard/drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createFolder",
          name: newFolderName,
          parentId: currentFolderId,
        }),
      });

      setNewFolderName("");
      setShowNewFolder(false);
      fetchFolder(currentFolderId);
    } catch {
      setError("Failed to create folder");
    } finally {
      setCreating(false);
    }
  };

  // ── Upload file ───────────────────────────────────────────────────

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (currentFolderId) formData.append("parentId", currentFolderId);

      await fetch("/api/dashboard/drive", {
        method: "POST",
        body: formData,
      });

      fetchFolder(currentFolderId);
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // ── Trash file ────────────────────────────────────────────────────

  const handleTrash = async (fileId: string, fileName: string) => {
    if (!confirm(`Move "${fileName}" to trash?`)) return;

    try {
      await fetch("/api/dashboard/drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "trash", fileId }),
      });
      fetchFolder(currentFolderId);
    } catch {
      setError("Failed to trash file");
    }
  };

  // ── Navigation ────────────────────────────────────────────────────

  const navigateToFolder = (folderId: string) => {
    setCurrentFolderId(folderId);
  };

  const navigateToRoot = () => {
    setCurrentFolderId(null);
  };

  // ── Not configured state ──────────────────────────────────────────

  if (notConfigured) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-dash-text">Drive</h2>
          <p className="text-sm text-dash-text-secondary mt-1">
            Connect your Google Drive CRM hub
          </p>
        </div>
        <div className="bg-dash-surface rounded-xl border border-dash-border p-8 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-dash-text mb-2">
            Google Drive Not Connected
          </h3>
          <p className="text-sm text-dash-text-secondary max-w-md mx-auto mb-6">
            Set up a Google Cloud Service Account and add the environment
            variables to connect your Drive CRM hub.
          </p>
          <div className="bg-dash-bg rounded-lg p-4 text-left max-w-lg mx-auto">
            <p className="text-xs font-mono text-dash-text-secondary mb-2">
              Required environment variables:
            </p>
            <code className="text-xs text-brand-copper block">
              GOOGLE_SERVICE_ACCOUNT_EMAIL
            </code>
            <code className="text-xs text-brand-copper block">
              GOOGLE_PRIVATE_KEY
            </code>
            <code className="text-xs text-brand-copper block">
              GOOGLE_DRIVE_FOLDER_ID
            </code>
            <code className="text-xs text-brand-copper block">
              GOOGLE_SHEETS_ID
            </code>
          </div>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────

  const displayFiles = searchResults ?? files;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-dash-text">Drive</h2>
          <p className="text-sm text-dash-text-secondary mt-1">
            Counter Cultures CRM file hub
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dash-text-secondary" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9 pr-4 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper w-56"
            />
          </div>

          {/* New folder */}
          <button
            onClick={() => setShowNewFolder(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-dash-surface border border-dash-border rounded-lg hover:border-brand-copper/30 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Folder</span>
          </button>

          {/* Upload */}
          <label className="flex items-center gap-1.5 px-3 py-2 text-sm bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 transition-colors cursor-pointer">
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Upload</span>
            <input
              type="file"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Breadcrumbs + Quick Nav */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 text-sm overflow-x-auto">
          <button
            onClick={navigateToRoot}
            className="flex items-center gap-1 text-dash-text-secondary hover:text-brand-copper transition-colors shrink-0 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>CRM Drive</span>
          </button>
          {breadcrumbs.map((crumb) => (
            <div key={crumb.id} className="flex items-center gap-1 shrink-0">
              <ChevronRight className="w-3 h-3 text-dash-text-secondary" />
              <button
                onClick={() => navigateToFolder(crumb.id)}
                className="text-dash-text-secondary hover:text-brand-copper transition-colors cursor-pointer"
              >
                {crumb.name}
              </button>
            </div>
          ))}
        </div>

        {/* Quick nav to Price List Shared Drive */}
        {process.env.NEXT_PUBLIC_PRICE_LIST_DRIVE_ID && (
          <button
            onClick={() => navigateToFolder(process.env.NEXT_PUBLIC_PRICE_LIST_DRIVE_ID!)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-brand-copper/10 text-brand-copper border border-brand-copper/20 rounded-lg hover:bg-brand-copper/20 transition-colors shrink-0 cursor-pointer"
          >
            <DollarSign className="w-3.5 h-3.5" />
            Price Lists
          </button>
        )}
      </div>

      {/* New Folder Modal */}
      {showNewFolder && (
        <div className="bg-dash-surface rounded-xl border border-brand-copper/30 p-4 flex items-center gap-3">
          <FolderOpen className="w-5 h-5 text-brand-copper shrink-0" />
          <input
            type="text"
            placeholder="New folder name..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
            autoFocus
            className="flex-1 text-sm bg-transparent border-b border-dash-border focus:border-brand-copper focus:outline-none py-1"
          />
          <button
            onClick={handleCreateFolder}
            disabled={creating}
            className="px-3 py-1.5 text-sm bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 disabled:opacity-50 cursor-pointer"
          >
            {creating ? "Creating..." : "Create"}
          </button>
          <button
            onClick={() => {
              setShowNewFolder(false);
              setNewFolderName("");
            }}
            className="p-1 hover:bg-dash-bg rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-brand-copper animate-spin" />
        </div>
      )}

      {/* Content */}
      {!loading && (
        <>
          {/* Search results label */}
          {searchResults && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-dash-text-secondary">
                {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for &ldquo;{searchQuery}&rdquo;
              </p>
              <button
                onClick={() => {
                  setSearchResults(null);
                  setSearchQuery("");
                }}
                className="text-xs text-brand-copper hover:underline cursor-pointer"
              >
                Clear search
              </button>
            </div>
          )}

          {/* Folders grid (only when not searching) */}
          {!searchResults && folders.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => navigateToFolder(folder.id)}
                  className="bg-dash-surface rounded-xl border border-dash-border p-5 hover:border-brand-copper/30 hover:shadow-sm transition-all cursor-pointer group text-left"
                >
                  <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Folder className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-dash-text group-hover:text-brand-copper transition-colors truncate">
                    {folder.name}
                  </h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-dash-text-secondary">
                      {folder.fileCount} items
                    </span>
                    <span className="text-[10px] text-dash-text-secondary">
                      {formatDate(folder.modifiedTime)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Files table */}
          {displayFiles.length > 0 && (
            <div className="bg-dash-surface rounded-xl border border-dash-border">
              <div className="p-5 border-b border-dash-border">
                <h3 className="text-sm font-semibold text-dash-text">
                  {searchResults ? "Search Results" : "Files"}
                </h3>
              </div>
              <div className="divide-y divide-dash-border">
                {displayFiles.map((file) => {
                  const Icon = getFileIcon(file.mimeType);
                  const colorClass = getFileColor(file.mimeType);

                  return (
                    <div
                      key={file.id}
                      className="flex items-center justify-between px-5 py-3 hover:bg-dash-bg/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center shrink-0`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          {file.isFolder ? (
                            <button
                              onClick={() => navigateToFolder(file.id)}
                              className="text-sm font-medium text-dash-text hover:text-brand-copper transition-colors truncate block cursor-pointer"
                            >
                              {file.name}
                            </button>
                          ) : (
                            <button
                              onClick={() => openPreview(file)}
                              className="text-sm font-medium text-dash-text hover:text-brand-copper transition-colors truncate block cursor-pointer text-left"
                            >
                              {file.name}
                            </button>
                          )}
                          <p className="text-xs text-dash-text-secondary truncate">
                            {formatDate(file.modifiedTime)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 ml-4">
                        <span className="text-xs text-dash-text-secondary w-16 text-right">
                          {formatSize(file.size)}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!file.isFolder && (
                            <button
                              onClick={() => openPreview(file)}
                              className="p-1.5 rounded hover:bg-brand-copper/10 transition-colors cursor-pointer"
                              title="Preview"
                            >
                              <Eye className="w-3.5 h-3.5 text-brand-copper" />
                            </button>
                          )}
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded hover:bg-dash-bg transition-colors"
                              title="Open in Google Drive"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-dash-text-secondary" />
                            </a>
                          )}
                          <button
                            onClick={() => handleTrash(file.id, file.name)}
                            className="p-1.5 rounded hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
                            title="Move to trash"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!searchResults && folders.length === 0 && files.length === 0 && (
            <div className="bg-dash-surface rounded-xl border border-dash-border p-12 text-center">
              <FolderOpen className="w-12 h-12 text-dash-text-secondary mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-dash-text mb-1">
                This folder is empty
              </h3>
              <p className="text-xs text-dash-text-secondary">
                Upload files or create a folder to get started
              </p>
            </div>
          )}
        </>
      )}

      {/* Preview Panel */}
      <PreviewPanel
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
};

export default DrivePage;
