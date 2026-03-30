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
      <Sidebar />
      <div className="flex-1 ml-60 transition-all duration-300">
        <DashboardHeader />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
