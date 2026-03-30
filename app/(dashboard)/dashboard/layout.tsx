"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "../components/sidebar";
import { DashboardHeader } from "../components/dashboard-header";

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const isLoginPage = pathname === "/dashboard/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-60 transition-all duration-300">
        <DashboardHeader />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
