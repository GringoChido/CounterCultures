import type { DriveHomeFile } from "@/app/lib/google-drive-user";

export const formatSize = (bytes: string | null): string => {
  if (!bytes) return "—";
  const n = Number(bytes);
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

export const formatRelative = (iso: string): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const fileHref = (file: DriveHomeFile): string => {
  if (file.isFolder) return `/dashboard/drive/folder/${file.id}`;
  return file.webViewLink;
};

export const isExternal = (file: DriveHomeFile): boolean => !file.isFolder;
