"use client";

import { useState, useMemo, useEffect, useId, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAndCleanup } from "@/app/lib/sign-out";
import { useFeatures } from "@/app/lib/use-features";
import type { Feature } from "@/app/lib/features";
import { useFocusTrap } from "@/app/components/ui/use-focus-trap";
import {
  LayoutDashboard,
  Users,
  Kanban,
  MessageCircle,
  Inbox,
  CalendarCheck,
  Share2,
  Mail,
  FileText,
  BarChart3,
  TrendingUp,
  Package,
  Handshake,
  FolderOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  X,
  Database,
  CreditCard,
  Wallet,
  Truck,
  Award,
  Building2,
  ExternalLink,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  section?: string;
  badge?: number;
  comingSoon?: boolean;
  /** Required feature to see this item. Owner role bypasses (sees all). */
  feature?: Feature;
}

// Daily-driver nav: the surfaces Roger touches to run the business day-to-day.
// Sales (lead → order → invoice → payment), Operations (inventory → PO → shipment),
// and the Inbox so email lives in the same context. Each item is feature-gated;
// users without the feature don't see the item.
const navItems: NavItem[] = [
  { label: "Today", href: "/dashboard/overview", icon: LayoutDashboard, section: "Home", feature: "view_today" },

  { label: "Customers", href: "/dashboard/customers", icon: Users, section: "Sales", feature: "view_customers" },
  { label: "Orders", href: "/dashboard/orders", icon: Kanban, feature: "view_orders" },
  { label: "Invoices", href: "/dashboard/invoices", icon: FileText, feature: "view_invoices" },
  { label: "Payments", href: "/dashboard/payments", icon: CreditCard, feature: "view_payments" },
  { label: "Accounts Receivable", href: "/dashboard/accounts-receivable", icon: Wallet, feature: "view_ar" },
  { label: "P&L Reports", href: "/dashboard/reports/pnl", icon: TrendingUp, feature: "view_ar" },
  { label: "Inbox", href: "/dashboard/inbox", icon: Inbox, feature: "view_inbox" },

  { label: "Inventory", href: "/dashboard/inventory", icon: Package, section: "Operations", feature: "view_inventory" },
  { label: "Products", href: "/dashboard/products", icon: Package, feature: "view_products" },
  { label: "Purchase Orders", href: "/dashboard/purchases", icon: Truck, feature: "view_purchases" },
  { label: "Vendors", href: "/dashboard/vendors", icon: Building2, feature: "view_vendors" },
  { label: "Shipments & Customs", href: "/dashboard/shipments", icon: Truck, feature: "view_shipments" },

  // Settings is available to every signed-in user (Gmail connect, profile,
  // notifications). Admin-only sub-sections are gated inside the page.
  { label: "Settings", href: "/dashboard/settings", icon: Settings, section: "System" },
];

// Hidden behind a "More" disclosure. Routes still work; just not in the
// daily view. Modules are kept in the codebase but de-emphasized until they
// earn their tab back.
const moreNavItems: NavItem[] = [
  { label: "Weekly Review", href: "/dashboard/weekly-review", icon: CalendarCheck, section: "Reviews", feature: "view_today" },

  { label: "Leads", href: "/dashboard/leads", icon: Users, section: "Pipeline", feature: "view_leads" },
  { label: "Pipeline", href: "/dashboard/pipeline", icon: Kanban, feature: "view_pipeline" },
  { label: "WhatsApp", href: "/dashboard/whatsapp", icon: MessageCircle, comingSoon: true, feature: "view_inbox" },

  { label: "Brands", href: "/dashboard/brands", icon: Award, section: "Catalog Admin", feature: "view_brands" },

  { label: "Email Campaigns", href: "/dashboard/email-campaigns", icon: Mail, section: "Marketing", comingSoon: true, feature: "view_marketing" },
  { label: "Social Hub", href: "/dashboard/social", icon: Share2, comingSoon: true, feature: "view_social" },
  { label: "Blog Manager", href: "/dashboard/blog-manager", icon: FileText, feature: "view_blog" },

  { label: "Pipeline & Sales", href: "/dashboard/sales-analytics", icon: TrendingUp, section: "Insights", feature: "view_marketing" },
  { label: "Marketing & Traffic", href: "/dashboard/marketing-analytics", icon: BarChart3, feature: "view_marketing" },

  { label: "Trade Program", href: "/dashboard/trade-program", icon: Handshake, section: "Other", feature: "view_trade" },
  { label: "Drive", href: "/dashboard/drive", icon: FolderOpen, feature: "view_drive" },
  { label: "Finance", href: "/dashboard/finance", icon: Wallet, feature: "view_finance" },
  { label: "Stripe", href: "/dashboard/stripe", icon: CreditCard, feature: "view_stripe" },
  { label: "Odoo", href: "/dashboard/odoo", icon: Database, feature: "view_odoo" },

  { label: "Users & permissions", href: "/dashboard/settings/users", icon: Users, section: "Admin", feature: "manage_users" },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface RenderOptions {
  pathname: string;
  collapsed: boolean;
  onMobileClose?: () => void;
}

const renderNavItems = (
  items: NavItem[],
  { pathname, collapsed, onMobileClose }: RenderOptions
) =>
  items.map((item) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;

    return (
      <div key={item.href}>
        {item.section && !collapsed && (
          <p className="text-[10px] font-semibold uppercase tracking-wider text-dash-text-muted mt-4 mb-2 px-3">
            {item.section}
          </p>
        )}
        {item.section && collapsed && <div className="mt-4" />}
        <Link
          href={item.href}
          onClick={onMobileClose}
          className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors mb-0.5 min-h-[44px] ${
            isActive
              ? "bg-dash-sidebar-active text-dash-text font-medium before:content-[''] before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:bg-brand-copper before:rounded-r"
              : "text-dash-text-secondary hover:bg-dash-sidebar-hover hover:text-dash-text"
          }`}
          title={collapsed ? item.label : undefined}
        >
          <span className="relative shrink-0">
            <Icon className="w-4.5 h-4.5" />
            {item.badge && item.badge > 0 && collapsed && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand-terracotta rounded-full" />
            )}
          </span>
          {!collapsed && (
            <>
              <span className="flex-1">{item.label}</span>
              {item.comingSoon && (
                <span className="text-[9px] uppercase tracking-wider text-brand-copper/80 bg-brand-copper/10 px-1.5 py-0.5 rounded">
                  Soon
                </span>
              )}
              {item.badge && item.badge > 0 && (
                <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-brand-terracotta text-white text-[10px] font-bold px-1">
                  {item.badge}
                </span>
              )}
            </>
          )}
        </Link>
      </div>
    );
  });

const Sidebar = ({ mobileOpen = false, onMobileClose }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const features = useFeatures();
  const mobileTitleId = useId();
  const mobileDrawerRef = useRef<HTMLElement>(null);
  useFocusTrap(mobileDrawerRef as React.RefObject<HTMLElement | null>, mobileOpen);

  useEffect(() => {
    if (!mobileOpen || !onMobileClose) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onMobileClose();
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [mobileOpen, onMobileClose]);

  // Filter nav items by the user's enabled features. Items without a
  // `feature` always show. While the session is loading, render nothing
  // gated — avoids flashing items the user can't actually access.
  const filterByFeature = (items: NavItem[]): NavItem[] => {
    if (!features.ready) return items.filter((it) => !it.feature);
    return items.filter((it) => !it.feature || features.has(it.feature));
  };

  const visibleNav = useMemo(
    () => filterByFeature(navItems),
    [features.ready, features.role, features.email]
  );
  const visibleMore = useMemo(
    () => filterByFeature(moreNavItems),
    [features.ready, features.role, features.email]
  );

  // Auto-open the More disclosure when the user is currently inside one of
  // the hidden routes — otherwise the active item would be invisible.
  const [moreOpen, setMoreOpen] = useState(() =>
    moreNavItems.some((it) => pathname === it.href)
  );

  const handleSignOut = () => signOutAndCleanup();

  const navContent = (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-dash-border shrink-0">
        {!collapsed && (
          <Link href="/dashboard/overview" className="flex flex-col" onClick={onMobileClose}>
            <span className="font-display text-lg font-light tracking-wider">
              Counter Cultures
            </span>
            <span className="font-body font-semibold text-[9px] tracking-[0.15em] text-brand-copper uppercase -mt-0.5">
              Counter Portal
            </span>
          </Link>
        )}
        {/* Desktop collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex p-1.5 rounded-md hover:bg-dash-sidebar-hover transition-colors cursor-pointer"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
        {/* Mobile close button */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-md hover:bg-dash-sidebar-hover transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {renderNavItems(visibleNav, { pathname, collapsed, onMobileClose })}

        {/* More disclosure — surfaces that don't earn a daily tab */}
        {visibleMore.length > 0 && (
          <div className="mt-6 px-1">
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-wider text-dash-text-muted hover:text-dash-text transition-colors cursor-pointer"
              aria-expanded={moreOpen}
            >
              {!collapsed && <span>More</span>}
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${moreOpen ? "rotate-180" : ""} ${
                  collapsed ? "mx-auto" : ""
                }`}
              />
            </button>
            {moreOpen && (
              <div className="mt-1">
                {renderNavItems(visibleMore, {
                  pathname,
                  collapsed,
                  onMobileClose,
                })}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-dash-border p-3 shrink-0 space-y-1">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-dash-text-secondary hover:bg-dash-sidebar-hover hover:text-dash-text transition-colors min-h-[44px] ${
            collapsed ? "justify-center" : ""
          }`}
          title={collapsed ? "View Website" : undefined}
        >
          <ExternalLink className="w-4 h-4 shrink-0" />
          {!collapsed && <span>View Website</span>}
        </a>
        <button
          onClick={handleSignOut}
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-dash-text-secondary hover:bg-dash-sidebar-hover hover:text-dash-text transition-colors cursor-pointer min-h-[44px] ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar — always visible on lg+ */}
      <aside
        className={`hidden lg:flex fixed top-0 left-0 h-screen bg-dash-sidebar text-dash-text border-r border-dash-border flex-col transition-all duration-300 z-40 ${
          collapsed ? "w-16" : "w-[220px]"
        }`}
      >
        {navContent}
      </aside>

      {/* Mobile overlay + drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          <aside
            ref={mobileDrawerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={mobileTitleId}
            className="relative w-72 max-w-[85vw] h-full bg-dash-sidebar text-dash-text border-r border-dash-border flex flex-col z-10"
          >
            <span id={mobileTitleId} className="sr-only">
              Navigation
            </span>
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
};

export { Sidebar };
