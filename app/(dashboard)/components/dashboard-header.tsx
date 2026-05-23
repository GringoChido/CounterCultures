"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, Menu, LogOut, ShieldCheck, Wallet, Briefcase, Plus, FileText, UserPlus, Megaphone } from "lucide-react";
import { NotificationBell } from "./notification-bell";
import { useCurrentUser } from "@/app/lib/use-current-user";
import { hasFeature } from "@/app/lib/features";
import { signOutAndCleanup } from "@/app/lib/sign-out";
import type { UserRole } from "@/app/lib/users-sheet";

interface DashboardHeaderProps {
  onMenuClick?: () => void;
  onSearchClick?: () => void;
}

const initialsOf = (name: string | null | undefined): string => {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
};

const ROLE_LABEL: Record<UserRole, string> = {
  owner: "Owner",
  finance: "Finance",
  sales: "Sales",
};

const ROLE_ICON: Record<UserRole, typeof ShieldCheck> = {
  owner: ShieldCheck,
  finance: Wallet,
  sales: Briefcase,
};

const GlobalNewMenu = ({ user }: { user: ReturnType<typeof useCurrentUser>["user"] }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  const canQuote = hasFeature({ role: user.role, featureOverrides: user.featureOverrides }, "create_quote");
  if (!canQuote) return null;

  const items: { href: string; label: string; icon: typeof FileText }[] = [
    { href: "/dashboard/orders/new", label: "New Quote", icon: FileText },
    { href: "/dashboard/orders/new?newCustomer=true", label: "New Customer", icon: UserPlus },
    { href: "/dashboard/leads?action=new", label: "New Lead", icon: Megaphone },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 flex items-center justify-center rounded-md bg-brand-copper text-white hover:bg-brand-copper/90 transition-colors cursor-pointer"
        aria-label="Create new"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Plus className="w-5 h-5" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-48 bg-dash-surface border border-dash-border rounded-xl shadow-2xl overflow-hidden z-50"
        >
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-dash-text hover:bg-dash-bg transition-colors"
              >
                <Icon className="w-4 h-4 text-dash-text-secondary" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

const DashboardHeader = ({ onMenuClick, onSearchClick }: DashboardHeaderProps) => {
  const { user } = useCurrentUser();
  const displayName = user?.name?.trim() || user?.email || "";
  const initials = initialsOf(user?.name || user?.email);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const triggerSearch = () => {
    if (onSearchClick) {
      onSearchClick();
    } else {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true }));
    }
  };

  const RoleIcon = user?.role ? ROLE_ICON[user.role] : null;

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

        <GlobalNewMenu user={user} />

        <NotificationBell />

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 pl-1 pr-1 py-1 rounded-md hover:bg-dash-bg transition-colors cursor-pointer"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label={displayName ? `Account menu for ${displayName}` : "Account menu"}
          >
            <div className="w-8 h-8 rounded-full bg-brand-copper flex items-center justify-center text-white text-sm font-semibold shrink-0">
              {initials}
            </div>
            <span className="hidden md:inline text-sm font-medium text-dash-text">
              {displayName}
            </span>
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-64 bg-dash-surface border border-dash-border rounded-xl shadow-2xl overflow-hidden z-50"
            >
              <div className="px-4 py-3 border-b border-dash-border">
                <p className="text-sm font-semibold text-dash-text truncate">
                  {displayName || "—"}
                </p>
                <p className="text-xs text-dash-text-secondary truncate mt-0.5">
                  {user?.email || "—"}
                </p>
                {user?.role && RoleIcon && (
                  <span className="inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-md bg-dash-bg text-[11px] text-dash-text">
                    <RoleIcon className="w-3 h-3" />
                    {ROLE_LABEL[user.role]}
                  </span>
                )}
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  signOutAndCleanup();
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-dash-text hover:bg-dash-bg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-dash-text-secondary" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export { DashboardHeader };
