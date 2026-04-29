"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { useState } from "react";
import type { DriveHomeFile } from "@/app/lib/google-drive-user";
import { FileIcon } from "./file-icon";
import { formatRelative, fileHref, isExternal } from "./utils";

interface FileGridProps {
  files: DriveHomeFile[];
  loading?: boolean;
  emptyLabel?: string;
}

const Thumbnail = ({ file }: { file: DriveHomeFile }) => {
  const [failed, setFailed] = useState(false);
  if (file.thumbnailLink && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={file.thumbnailLink}
        alt={file.name ? `Thumbnail for ${file.name}` : "File thumbnail"}
        onError={() => setFailed(true)}
        className="w-full h-full object-cover"
      />
    );
  }
  return (
    <div className="w-full h-full flex items-center justify-center bg-dash-surface-2">
      <FileIcon mimeType={file.mimeType} size={48} />
    </div>
  );
};

const Card = ({ file }: { file: DriveHomeFile }) => (
  <Link
    href={fileHref(file)}
    target={isExternal(file) ? "_blank" : undefined}
    rel={isExternal(file) ? "noopener noreferrer" : undefined}
    className="rounded-lg border border-dash-border bg-dash-surface overflow-hidden hover:border-dash-border-strong transition-colors group flex flex-col"
  >
    <div className="aspect-[3/2] overflow-hidden border-b border-dash-border">
      <Thumbnail file={file} />
    </div>
    <div className="p-3">
      <div className="flex items-center gap-2 min-w-0">
        <FileIcon mimeType={file.mimeType} size={16} className="shrink-0" />
        <p
          className="text-[13px] text-dash-text leading-snug flex-1"
          style={{
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 2,
            overflow: "hidden",
          }}
        >
          {file.name}
        </p>
        {file.starred && (
          <Star
            size={12}
            className="text-dash-warn fill-amber-500 shrink-0"
          />
        )}
      </div>
      <p className="text-[11px] text-dash-text-muted mt-1.5">
        {formatRelative(file.modifiedTime)}
      </p>
    </div>
  </Link>
);

const Skeleton = () => (
  <div className="rounded-lg border border-dash-border bg-dash-surface overflow-hidden animate-pulse">
    <div className="aspect-[3/2] bg-dash-surface-2" />
    <div className="p-3">
      <div className="h-3 bg-dash-surface-2 rounded mb-2" />
      <div className="h-2.5 bg-dash-surface-2 rounded w-1/2" />
    </div>
  </div>
);

export const FileGrid = ({ files, loading, emptyLabel }: FileGridProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
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
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {files.map((f) => (
        <Card key={f.id} file={f} />
      ))}
    </div>
  );
};
