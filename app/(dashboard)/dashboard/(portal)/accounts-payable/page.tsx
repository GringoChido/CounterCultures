"use client";

import { Landmark } from "lucide-react";
import APQueueSection from "@/app/(dashboard)/components/ap/ap-queue-section";
import OpenBillsSection from "@/app/(dashboard)/components/ap/open-bills-section";
import VendorTermsSection from "@/app/(dashboard)/components/ap/vendor-terms-section";
import { useFeatures } from "@/app/lib/use-features";

const AccountsPayablePage = () => {
  const features = useFeatures();
  if (!features.ready) return null;
  if (!features.has("view_ap")) {
    return (
      <div className="p-6 max-w-[1500px] mx-auto">
        <h1 className="font-display text-2xl">Sin acceso / Not authorized</h1>
        <p className="text-sm text-dash-text-secondary mt-2">
          Pide a un Owner que active <code>view_ap</code> para tu cuenta. /
          Ask an Owner to enable <code>view_ap</code> on your account.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Landmark className="w-6 h-6 text-dash-accent" />
          <h1 className="font-display text-2xl">Cuentas por Pagar / Accounts Payable</h1>
        </div>
        <p className="text-sm text-dash-text-secondary">
          Cola de pagos, facturas de proveedor abiertas y términos. /
          Payment queue, open vendor bills, and vendor terms.
        </p>
      </header>

      <APQueueSection />
      <OpenBillsSection />
      <VendorTermsSection />
    </div>
  );
};

export default AccountsPayablePage;
