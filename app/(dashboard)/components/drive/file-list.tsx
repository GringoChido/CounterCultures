"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import type { DriveHomeFile } from "@/app/lib/google-drive-user";
import { FileIcon } from "./file-icon";
import { formatRelative, formatSize, fileHref, isExternal } from "./utils";

interface FileListProps {
  files: DriveHomeFile[];
  loading?: boolean;
  emptyLabel?: string;
}

const Skeleton = () => (
  <div className="flex items-center px-4 py-3 border-b border-dash-border">
    <div className="w-5 h-5 bg-dash-surface-2 rounded mr-3 animate-pulse" />
    <div className="h-3 bg-dash-surface-2 rounded flex-1 max-w-[280px] animate-pulse" />
    <div className="h-3 bg-dash-surface-2 rounded w-24 ml-4 animate-pulse" />
    <div className="h-3 bg-dash-surface-2 rounded w-20 ml-4 animate-pulse" />
    <div className="h-3 bg-dash-surface-2 rounded w-16 ml-4 animate-pulse" />
  </div>
);

export const FileList = ({ files, loading, emptyLabel }: FileListProps) => {
  if (loading) {
    return (
      <div className="bg-dash-surface rounded-xl border border-dash-border overflow-hidden">
        <div className="grid grid-cols-[1fr_160px_140px_80px] gap-4 px-4 py-2 border-b border-dash-border bg-dash-surface-2/50 text-[11px] uppercase tracking-wider text-dash-text-muted font-semibold">
          <span>Name</span>
          <span>Owner</span>
          <span>Modified</span>
          <span className="text-right">Size</span>
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} />
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="bg-dash-surface rounded-xl border border-dash-border py-16 text-center text-[13px] text-dash-text-muted">
        {emptyLabel ?? "No files to display"}
      </div>
    );
  }

  return (
    <div className="bg-dash-surface rounded-xl border border-dash-border overflow-hidden">
      <div className="grid grid-cols-[1fr_160px_140px_80px] gap-4 px-4 py-2 border-b border-dash-border bg-dash-surface-2/50 text-[11px] uppercase tracking-wider text-dash-text-muted font-semibold">
        <span>Name</span>
        <span className="hidden md:block">Owner</span>
        <span className="hidden md:block">Modified</span>
        <span className="text-right">Size</span>
      </div>
      <ul>
        {files.map((file) => (
          <li key={file.id}>
            <Link
              href={fileHref(file)}
              target={isExternal(file) ? "_blank" : undefined}
              rel={isExternal(file) ? "noopener noreferrer" : undefined}
              className="grid grid-cols-[1fr_160px_140px_80px] gap-4 items-center px-4 py-2.5 hover:bg-dash-surface-2 transition-colors border-b border-dash-border last:border-b-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileIcon mimeType={file.mimeType} size={20} />
                <span className="text-[14px] text-dash-text truncate">
                  {file.name}
                </span>
                {file.starred && (
                  <Star
                    size={12}
                    className="text-amber-500 fill-amber-500 shrink-0"
                  />
                )}
              </div>
              <span className="hidden md:block text-[13px] text-dash-text-secondary truncate">
                {file.owners[0]?.displayName ?? "—"}
              </span>
              <span className="hidden md:block text-[13px] text-dash-text-secondary">
                {formatRelative(file.modifiedTime)}
              </span>
              <span className="text-[13px] text-dash-text-muted text-right">
                {formatSize(file.size)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
