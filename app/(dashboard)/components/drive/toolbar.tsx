"use client";

import { Search, LayoutGrid, List } from "lucide-react";

export type ViewMode = "list" | "grid";

interface ToolbarProps {
  query: string;
  onQueryChange: (q: string) => void;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  searchPlaceholder?: string;
}

export const Toolbar = ({
  query,
  onQueryChange,
  view,
  onViewChange,
  searchPlaceholder = "Search in Drive",
}: ToolbarProps) => (
  <div className="flex items-center gap-3">
    <div className="relative flex-1">
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-dash-text-muted pointer-events-none"
      />
      <input
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder={searchPlaceholder}
        className="w-full pl-9 pr-3 py-2 bg-dash-surface border border-dash-border rounded-lg text-[13px] text-dash-text placeholder:text-dash-text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-brand-copper transition-colors"
      />
    </div>
    <div className="flex items-center gap-0.5 bg-dash-surface border border-dash-border rounded-lg p-0.5">
      <button
        type="button"
        onClick={() => onViewChange("list")}
        aria-label="List view"
        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
          view === "list"
            ? "bg-dash-surface-2 text-dash-text"
            : "text-dash-text-muted hover:text-dash-text"
        }`}
      >
        <List size={16} />
      </button>
      <button
        type="button"
        onClick={() => onViewChange("grid")}
        aria-label="Grid view"
        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
          view === "grid"
            ? "bg-dash-surface-2 text-dash-text"
            : "text-dash-text-muted hover:text-dash-text"
        }`}
      >
        <LayoutGrid size={16} />
      </button>
    </div>
  </div>
);
