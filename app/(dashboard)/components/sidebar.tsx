"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Kanban,
  MessageCircle,
  CalendarDays,
  CalendarCheck,
  Share2,
  Mail,
  FileText,
  BarChart3,
  TrendingUp,
  PieChart,
  ClipboardList,
  Package,
  Handshake,
  FolderOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  Database,
  CreditCard,
  Wallet,
  Truck,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  section?: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { label: "Overview", href: "/dashboard/overview", icon: LayoutDashboard },
  { label: "Weekly Review", href: "/dashboard/weekly-review", icon: CalendarCheck, section: "Sales" },
  { label: "Leads", href: "/dashboard/leads", icon: Users, badge: 2 },
  { label: "Pipeline", href: "/dashboard/pipeline", icon: Kanban },
  { label: "WhatsApp", href: "/dashboard/whatsapp", icon: MessageCircle },
  { label: "Content Calendar", href: "/dashboard/content-calendar", icon: CalendarDays, section: "Marketing" },
  { label: "Social Media", href: "/dashboard/social", icon: Share2 },
  { label: "Email Campaigns", href: "/dashboard/email-campaigns", icon: Mail },
  { label: "Blog Manager", href: "/dashboard/blog-manager", icon: FileText },
  { label: "Website Analytics", href: "/dashboard/website-analytics", icon: BarChart3, section: "Analytics" },
  { label: "Sales Analytics", href: "/dashboard/sales-analytics", icon: TrendingUp },
  { label: "Marketing Analytics", href: "/dashboard/marketing-analytics", icon: PieChart },
  { label: "Reports", href: "/dashboard/reports", icon: ClipboardList },
  { label: "Odoo", href: "/dashboard/odoo", icon: Database, section: "Operations" },
  { label: "Finance", href: "/dashboard/finance", icon: Wallet },
  { label: "Stripe", href: "/dashboard/stripe", icon: CreditCard },
  { label: "Shipments", href: "/dashboard/shipments", icon: Truck },
  { label: "Products", href: "/dashboard/products", icon: Package },
  { label: "Trade Program", href: "/dashboard/trade-program", icon: Handshake, badge: 2 },
  { label: "Drive", href: "/dashboard/drive", icon: FolderOpen },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, section: "System" },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const Sidebar = ({ mobileOpen = false, onMobileClose }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const navContent = (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-white/10 shrink-0">
        {!collapsed && (
          <Link href="/dashboard/overview" className="flex flex-col" onClick={onMobileClose}>
            <span className="font-display text-lg font-light tracking-wider">
              Counter Cultures
            </span>
            <span className="font-mono text-[9px] tracking-[0.15em] text-brand-copper uppercase -mt-0.5">
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
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <div key={item.href}>
              {item.section && !collapsed && (
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mt-4 mb-2 px-3">
                  {item.section}
                </p>
              )}
              {item.section && collapsed && <div className="mt-4" />}
              <Link
                href={item.href}
                onClick={onMobileClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors mb-0.5 min-h-[44px] ${
                  isActive
                    ? "bg-brand-copper/20 text-brand-copper font-medium"
                    : "text-white/70 hover:bg-dash-sidebar-hover hover:text-white"
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
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-3 shrink-0">
        <button
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-dash-sidebar-hover hover:text-white transition-colors cursor-pointer min-h-[44px] ${
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
        className={`hidden lg:flex fixed top-0 left-0 h-screen bg-dash-sidebar text-white flex-col transition-all duration-300 z-40 ${
          collapsed ? "w-16" : "w-60"
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
          />
          <aside className="relative w-72 max-w-[85vw] h-full bg-dash-sidebar text-white flex flex-col z-10">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
};

export { Sidebar };
