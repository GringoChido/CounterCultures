"use client";

import Link from "next/link";
import type { DriveHomeFile } from "@/app/lib/google-drive-user";
import { FileIcon } from "./file-icon";
import { formatRelative, fileHref, isExternal } from "./utils";

interface SuggestedFilesProps {
  files: DriveHomeFile[];
  loading?: boolean;
}

const SuggestedCard = ({ file }: { file: DriveHomeFile }) => (
  <Link
    href={fileHref(file)}
    target={isExternal(file) ? "_blank" : undefined}
    rel={isExternal(file) ? "noopener noreferrer" : undefined}
    className="w-[180px] min-w-[180px] rounded-lg border border-dash-border bg-dash-surface p-3.5 hover:border-dash-border-strong hover:bg-dash-surface-2 transition-colors group"
  >
    <div className="flex items-center justify-center h-16 bg-dash-surface-2 rounded mb-3 group-hover:bg-white/60 transition-colors">
      <FileIcon mimeType={file.mimeType} size={32} />
    </div>
    <p
      className="text-[13px] text-dash-text leading-snug"
      style={{
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: 2,
        overflow: "hidden",
      }}
    >
      {file.name}
    </p>
    <p className="text-[11px] text-dash-text-muted mt-1">
      {formatRelative(file.viewedByMeTime ?? file.modifiedTime)}
    </p>
  </Link>
);

const Skeleton = () => (
  <div className="w-[180px] min-w-[180px] h-[148px] rounded-lg border border-dash-border bg-dash-surface p-3.5 animate-pulse">
    <div className="h-16 bg-dash-surface-2 rounded mb-3" />
    <div className="h-3 bg-dash-surface-2 rounded w-full mb-1.5" />
    <div className="h-2.5 bg-dash-surface-2 rounded w-2/3" />
  </div>
);

export const SuggestedFiles = ({ files, loading }: SuggestedFilesProps) => (
  <section>
    <h3 className="text-[11px] uppercase tracking-wider text-dash-text-muted font-semibold mb-3">
      Suggested
    </h3>
    <div
      className="flex gap-3 overflow-x-auto pb-1"
      style={{ scrollbarWidth: "none" }}
    >
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {loading
        ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)
        : files.map((f) => <SuggestedCard key={f.id} file={f} />)}
    </div>
  </section>
);
