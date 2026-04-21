"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  HardDrive,
  Users,
  Folder,
  Star,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

interface DriveLayoutProps {
  title: string;
  children: ReactNode;
  headerAction?: ReactNode;
}

const navItems = [
  { label: "Home", href: "/dashboard/drive", icon: Home, exact: true },
  { label: "My Drive", href: "/dashboard/drive/my-drive", icon: HardDrive },
  { label: "Shared drives", href: "/dashboard/drive/shared-drives", icon: Folder },
  { label: "Shared with me", href: "/dashboard/drive/shared", icon: Users },
  { label: "Starred", href: "/dashboard/drive/starred", icon: Star },
];

const SubNav = () => {
  const pathname = usePathname();
  return (
    <nav className="w-[200px] shrink-0 hidden lg:block">
      <ul className="space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href ||
              pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-colors ${
                  isActive
                    ? "bg-dash-surface-2 text-dash-text font-medium border-l-2 border-brand-copper -ml-0.5"
                    : "text-dash-text-secondary hover:bg-dash-surface-2 hover:text-dash-text"
                }`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export const DriveLayout = ({
  title,
  children,
  headerAction,
}: DriveLayoutProps) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h2 className="text-2xl font-bold text-dash-text">{title}</h2>
        <p className="text-[13px] text-dash-text-secondary mt-1">
          Your Google Drive, in the portal
        </p>
      </div>
      <div className="flex items-center gap-2">
        {headerAction}
        <a
          href="https://drive.google.com/drive/u/2/home"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-[13px] text-dash-text-secondary border border-dash-border rounded-lg hover:border-dash-border-strong hover:text-dash-text transition-colors"
        >
          <ExternalLink size={14} />
          Open Google Drive
        </a>
      </div>
    </div>

    <div className="flex gap-6">
      <SubNav />
      <div className="flex-1 min-w-0 space-y-6">{children}</div>
    </div>
  </div>
);

export const ReconnectPrompt = ({ reason }: { reason?: string }) => (
  <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex items-start gap-4">
    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
    <div className="flex-1">
      <h3 className="text-[14px] font-semibold text-dash-text">
        Drive access not granted
      </h3>
      <p className="text-[13px] text-dash-text-secondary mt-1">
        {reason ??
          "Reconnect your Gmail account to grant read-only access to your Drive. This one-click consent lets the portal show your real Drive Home — recent files, shared with me, starred."}
      </p>
      <Link
        href="/dashboard/settings"
        className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-brand-copper text-white rounded-md text-[13px] hover:opacity-90 transition-opacity"
      >
        Go to Settings to reconnect
      </Link>
    </div>
  </div>
);
