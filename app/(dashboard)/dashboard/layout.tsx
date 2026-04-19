"use client";

import type { ReactNode } from "react";
import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "../components/sidebar";
import { DashboardHeader } from "../components/dashboard-header";
import { CommandPalette } from "../components/command-palette";
import { AIChatWidget } from "../components/ai-chat-widget";
import { ActionFab } from "../components/action-fab";
import { ProductInsertProvider, useProductInsert } from "../components/product-insert-context";
import { ProductPreview } from "../components/product-preview";
import type { Product } from "@/app/lib/types";

const DashboardInner = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const isLoginPage = pathname === "/dashboard/login";
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const { openPreview, requestInsert, setCommandPaletteOpener } = useProductInsert();

  const handleProductSelect = useCallback(
    (product: Product) => {
      openPreview(product);
    },
    [openPreview]
  );

  const handleProductInsert = useCallback(
    (product: Product) => {
      requestInsert(product);
    },
    [requestInsert]
  );

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <div className="flex-1 lg:ml-[220px] transition-all duration-300 min-w-0">
        <DashboardHeader onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="p-4 md:p-6">{children}</main>
      </div>
      <CommandPalette
        onProductSelect={handleProductSelect}
        onProductInsert={handleProductInsert}
        registerOpen={setCommandPaletteOpener}
      />
      <ProductPreview />
      <AIChatWidget hideOwnFab />
      <ActionFab />
    </div>
  );
};

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  return (
    <ProductInsertProvider>
      <DashboardInner>{children}</DashboardInner>
    </ProductInsertProvider>
  );
};

export default DashboardLayout;
