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
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  section?: string;
}

const navItems: NavItem[] = [
  { label: "Overview", href: "/dashboard/overview", icon: LayoutDashboard },
  { label: "Leads", href: "/dashboard/leads", icon: Users, section: "Sales" },
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
  { label: "Products", href: "/dashboard/products", icon: Package, section: "Operations" },
  { label: "Trade Program", href: "/dashboard/trade-program", icon: Handshake },
  { label: "Drive", href: "/dashboard/drive", icon: FolderOpen },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, section: "System" },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-dash-sidebar text-white flex flex-col transition-all duration-300 z-40 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-white/10">
        {!collapsed && (
          <Link href="/dashboard/overview" className="flex flex-col">
            <span className="font-display text-lg font-light tracking-wider">
              Counter Cultures
            </span>
            <span className="font-mono text-[9px] tracking-[0.15em] text-brand-copper uppercase -mt-0.5">
              Counter Portal
            </span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-dash-sidebar-hover transition-colors cursor-pointer"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
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
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5 ${
                  isActive
                    ? "bg-brand-copper/20 text-brand-copper font-medium"
                    : "text-white/70 hover:bg-dash-sidebar-hover hover:text-white"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-4.5 h-4.5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-3">
        <button
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-dash-sidebar-hover hover:text-white transition-colors cursor-pointer ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export { Sidebar };
