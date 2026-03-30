"use client";

import { usePathname } from "next/navigation";
import { Bell, Search, Menu } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/dashboard/overview": "Overview",
  "/dashboard/leads": "Leads",
  "/dashboard/pipeline": "Pipeline",
  "/dashboard/whatsapp": "WhatsApp",
  "/dashboard/content-calendar": "Content Calendar",
  "/dashboard/social": "Social Media",
  "/dashboard/email-campaigns": "Email Campaigns",
  "/dashboard/blog-manager": "Blog Manager",
  "/dashboard/website-analytics": "Website Analytics",
  "/dashboard/sales-analytics": "Sales Analytics",
  "/dashboard/marketing-analytics": "Marketing Analytics",
  "/dashboard/reports": "Reports",
  "/dashboard/products": "Products",
  "/dashboard/trade-program": "Trade Program",
  "/dashboard/drive": "Drive",
  "/dashboard/settings": "Settings",
};

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

const DashboardHeader = ({ onMenuClick }: DashboardHeaderProps) => {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? "Dashboard";

  return (
    <header className="h-16 bg-dash-surface border-b border-dash-border flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuClick}
          className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-dash-bg transition-colors cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-dash-text-secondary" />
        </button>
        <h1 className="text-lg font-semibold text-dash-text">{title}</h1>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-text-secondary" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-4 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
          />
        </div>

        {/* Notifications */}
        <button className="relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-dash-bg transition-colors cursor-pointer">
          <Bell className="w-5 h-5 text-dash-text-secondary" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-brand-terracotta rounded-full" />
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-copper flex items-center justify-center text-white text-sm font-semibold shrink-0">
            R
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-dash-text leading-tight">
              Roger Williams
            </p>
            <p className="text-xs text-dash-text-secondary leading-tight">
              Owner
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export { DashboardHeader };
