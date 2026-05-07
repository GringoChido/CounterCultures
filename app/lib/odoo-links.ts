const ODOO_BASE =
  process.env.NEXT_PUBLIC_ODOO_URL ?? "https://countercultures.odoo.com";

type OdooModel =
  | "purchase.order"
  | "sale.order"
  | "account.move"
  | "product.template"
  | "product.product"
  | "res.partner";

const MODEL_ACTION: Record<OdooModel, string> = {
  "purchase.order": "purchase.purchase_form_action",
  "sale.order": "sale.action_quotations_with_onboarding",
  "account.move": "account.action_move_out_invoice_type",
  "product.template": "product.product_template_action_all",
  "product.product": "product.product_normal_action_sell",
  "res.partner": "contacts.action_contacts",
};

export const odooFormUrl = (model: OdooModel, id: number | string): string =>
  `${ODOO_BASE}/odoo/${encodeURIComponent(model)}/${id}`;

export const odooCreateUrl = (model: OdooModel): string => {
  const action = MODEL_ACTION[model];
  return `${ODOO_BASE}/odoo/action-${action}?view_type=form`;
};

export const odooListUrl = (model: OdooModel): string => {
  const action = MODEL_ACTION[model];
  return `${ODOO_BASE}/odoo/action-${action}`;
};

export const odooReportUrl = (
  reportName: string,
  ids: (number | string)[]
): string =>
  `${ODOO_BASE}/report/pdf/${reportName}/${ids.join(",")}`;
