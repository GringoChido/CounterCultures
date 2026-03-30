"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "../components/sidebar";
import { DashboardHeader } from "../components/dashboard-header";

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/dashboard/login";
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const auth = sessionStorage.getItem("cc-portal-auth");
    if (!isLoginPage && auth !== "true") {
      router.replace("/dashboard/login");
    } else {
      setAuthenticated(true);
    }
    setChecking(false);
  }, [isLoginPage, router]);

  if (checking) {
    return null;
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <div className="flex-1 lg:ml-60 transition-all duration-300 min-w-0">
        <DashboardHeader onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
