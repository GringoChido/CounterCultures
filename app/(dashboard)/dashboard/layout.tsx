"use client";

import type { ReactNode } from "react";
import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { Sidebar } from "../components/sidebar";
import { DashboardHeader } from "../components/dashboard-header";
import { CommandPalette } from "../components/command-palette";
import { AIChatWidgetLazy } from "../components/ai-chat-widget-lazy";
import { ActionFab } from "../components/action-fab";
import { ProductInsertProvider, useProductInsert } from "../components/product-insert-context";
import { ProductPreview } from "../components/product-preview";
import { SkipToMain } from "@/app/components/ui/skip-to-main";
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
      <SkipToMain />
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <div className="flex-1 lg:ml-[220px] transition-all duration-300 min-w-0">
        <DashboardHeader onMenuClick={() => setMobileSidebarOpen(true)} />
        <main id="main" tabIndex={-1} className="p-4 pb-28 md:p-6 md:pb-28">{children}</main>
      </div>
      <CommandPalette
        onProductSelect={handleProductSelect}
        onProductInsert={handleProductInsert}
        registerOpen={setCommandPaletteOpener}
      />
      <ProductPreview />
      <AIChatWidgetLazy hideOwnFab />
      <ActionFab />
    </div>
  );
};

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  return (
    <SessionProvider>
      <ProductInsertProvider>
        <DashboardInner>{children}</DashboardInner>
      </ProductInsertProvider>
    </SessionProvider>
  );
};

export default DashboardLayout;
