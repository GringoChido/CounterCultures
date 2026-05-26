"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { odooCreateUrl } from "@/app/lib/odoo-links";

const ODOO_URL = odooCreateUrl("purchase.order");

const NewPurchaseOrderPage = () => {
  useEffect(() => {
    window.open(ODOO_URL, "_blank", "noopener,noreferrer");
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto text-center">
      <Link
        href="/dashboard/purchases"
        className="inline-flex items-center gap-2 text-sm text-dash-text-secondary hover:text-dash-accent mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Purchase Orders
      </Link>

      <div className="bg-dash-surface border border-dash-border rounded-lg p-8">
        <h1 className="font-display text-2xl text-dash-text mb-3">
          Create purchase orders in Odoo
        </h1>
        <p className="text-sm text-dash-text-secondary mb-6 max-w-md mx-auto">
          Purchase orders are now created directly in Odoo, where you have full
          access to vendor lookup, product catalog, and pricing.
        </p>
        <a
          href={ODOO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-copper text-white text-sm font-medium rounded-lg hover:bg-brand-copper/90 transition-colors"
        >
          Open Odoo — New PO
          <ExternalLink className="w-4 h-4 opacity-70" />
        </a>
      </div>
    </div>
  );
};

export default NewPurchaseOrderPage;
