"use client";

import { Bell, Search, Menu } from "lucide-react";

interface DashboardHeaderProps {
  onMenuClick?: () => void;
  onSearchClick?: () => void;
  notificationCount?: number;
}

const DashboardHeader = ({ onMenuClick, onSearchClick, notificationCount = 0 }: DashboardHeaderProps) => {
  const triggerSearch = () => {
    if (onSearchClick) {
      onSearchClick();
    } else {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true }));
    }
  };

  return (
    <header className="h-14 bg-dash-surface border-b border-dash-border flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-md hover:bg-dash-bg transition-colors cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-dash-text-secondary" />
        </button>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <button
          onClick={triggerSearch}
          className="hidden md:flex items-center gap-2 px-3 h-9 text-sm text-dash-text-secondary bg-dash-bg border border-dash-border rounded-md hover:border-dash-border-strong transition-colors cursor-pointer"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
          <kbd className="font-mono text-[10px] px-1.5 py-0.5 bg-dash-surface border border-dash-border rounded">⌘K</kbd>
        </button>

        <button
          onClick={triggerSearch}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-md hover:bg-dash-bg transition-colors cursor-pointer"
          aria-label="Search"
        >
          <Search className="w-5 h-5 text-dash-text-secondary" />
        </button>

        <button
          className="relative w-9 h-9 flex items-center justify-center rounded-md hover:bg-dash-bg transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-dash-text-secondary" />
          {notificationCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-brand-terracotta text-white text-[10px] font-bold px-1">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2 pl-1">
          <div className="w-8 h-8 rounded-full bg-brand-copper flex items-center justify-center text-white text-sm font-semibold shrink-0">
            R
          </div>
          <span className="hidden md:inline text-sm font-medium text-dash-text">Roger Williams</span>
        </div>
      </div>
    </header>
  );
};

export { DashboardHeader };
