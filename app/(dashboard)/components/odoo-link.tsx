"use client";

import { ExternalLink, Plus } from "lucide-react";
import { odooFormUrl, odooCreateUrl } from "@/app/lib/odoo-links";

type OdooModel =
  | "purchase.order"
  | "sale.order"
  | "account.move"
  | "product.template"
  | "product.product"
  | "res.partner";

interface OdooEditLinkProps {
  model: OdooModel;
  id: number | string;
  label?: string;
  size?: "sm" | "xs";
}

const OdooEditLink = ({
  model,
  id,
  label = "Open in Odoo",
  size = "sm",
}: OdooEditLinkProps) => (
  <a
    href={odooFormUrl(model, id)}
    target="_blank"
    rel="noopener noreferrer"
    className={`inline-flex items-center gap-1.5 border border-dash-border bg-dash-surface rounded hover:border-brand-copper hover:text-brand-copper transition-colors text-dash-text-secondary ${
      size === "sm" ? "px-3 py-1.5 text-xs" : "px-2 py-1 text-[11px]"
    }`}
  >
    <ExternalLink className={size === "sm" ? "w-3.5 h-3.5" : "w-3 h-3"} />
    {label}
  </a>
);

interface OdooCreateLinkProps {
  model: OdooModel;
  label?: string;
}

const OdooCreateLink = ({
  model,
  label = "Create in Odoo",
}: OdooCreateLinkProps) => (
  <a
    href={odooCreateUrl(model)}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-brand-copper text-brand-copper bg-dash-surface rounded hover:bg-brand-copper hover:text-white transition-colors"
  >
    <Plus className="w-3.5 h-3.5" />
    {label}
  </a>
);

export { OdooEditLink, OdooCreateLink };
