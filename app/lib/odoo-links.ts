const ODOO_BASE =
  process.env.NEXT_PUBLIC_ODOO_URL ?? "https://counter-cultures.odoo.com";

type OdooModel =
  | "purchase.order"
  | "sale.order"
  | "account.move"
  | "product.template"
  | "product.product"
  | "res.partner";

// Odoo 17 web-client deep links use the app "path" slug:
//   record → /odoo/<slug>/<id>   ·   new → /odoo/<slug>/new   ·   list → /odoo/<slug>
// (Matches the existing /odoo/settings/users link in the dashboard. Slugs for
// sales / purchase / contacts are the Odoo defaults; confirm against the live
// instance once logged in — a wrong slug is a one-word fix here.)
const MODEL_SLUG: Record<OdooModel, string> = {
  "sale.order": "sales",
  "purchase.order": "purchase",
  "account.move": "accounting",
  "res.partner": "contacts",
  "product.template": "inventory",
  "product.product": "inventory",
};

export const odooFormUrl = (model: OdooModel, id: number | string): string =>
  `${ODOO_BASE}/odoo/${MODEL_SLUG[model]}/${id}`;

export const odooCreateUrl = (model: OdooModel): string =>
  `${ODOO_BASE}/odoo/${MODEL_SLUG[model]}/new`;

export const odooListUrl = (model: OdooModel): string =>
  `${ODOO_BASE}/odoo/${MODEL_SLUG[model]}`;

export const odooReportUrl = (
  reportName: string,
  ids: (number | string)[]
): string =>
  `${ODOO_BASE}/report/pdf/${reportName}/${ids.join(",")}`;
