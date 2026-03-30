import type { ReactNode } from "react";
import { Toaster } from "sonner";
import "./dashboard/globals.css";

const DashboardRootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen antialiased">
      {children}
      <Toaster position="top-right" richColors />
    </div>
  );
};

export default DashboardRootLayout;
