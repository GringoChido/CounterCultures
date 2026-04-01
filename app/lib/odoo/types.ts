interface OdooContact {
  id: number;
  name: string;
  email: string;
  phone: string;
  mobile: string;
  street: string;
  city: string;
  country_id: [number, string] | false;
  customer_rank: number;
  supplier_rank: number;
  is_company: boolean;
  company_name: string | false;
  create_date: string;
  write_date: string;
}

interface OdooSaleOrder {
  id: number;
  name: string;
  partner_id: [number, string];
  date_order: string;
  amount_total: number;
  amount_untaxed: number;
  amount_tax: number;
  currency_id: [number, string];
  state: "draft" | "sent" | "sale" | "done" | "cancel";
  invoice_status: "upselling" | "invoiced" | "to invoice" | "no";
  user_id: [number, string] | false;
  create_date: string;
}

interface OdooInvoice {
  id: number;
  name: string;
  partner_id: [number, string];
  invoice_date: string;
  invoice_date_due: string;
  amount_total: number;
  amount_residual: number;
  amount_untaxed: number;
  amount_tax: number;
  currency_id: [number, string];
  state: "draft" | "posted" | "cancel";
  payment_state: "not_paid" | "in_payment" | "paid" | "partial" | "reversed";
  move_type: "out_invoice" | "out_refund" | "in_invoice" | "in_refund" | "entry";
  create_date: string;
}

interface OdooPurchaseOrder {
  id: number;
  name: string;
  partner_id: [number, string];
  date_order: string;
  date_planned: string;
  amount_total: number;
  amount_untaxed: number;
  amount_tax: number;
  currency_id: [number, string];
  state: "draft" | "sent" | "purchase" | "done" | "cancel";
  receipt_status: "pending" | "full" | "partial" | "no";
  user_id: [number, string] | false;
  create_date: string;
}

interface OdooProduct {
  id: number;
  name: string;
  default_code: string | false;
  list_price: number;
  standard_price: number;
  qty_available: number;
  virtual_available: number;
  categ_id: [number, string];
  type: "consu" | "service" | "product";
  active: boolean;
}

interface OdooDashboardSummary {
  contacts: { total: number; customers: number; suppliers: number };
  sales: {
    total: number;
    draft: number;
    confirmed: number;
    done: number;
    totalRevenue: number;
    currency: string;
  };
  invoices: {
    total: number;
    paid: number;
    unpaid: number;
    overdue: number;
    totalReceivable: number;
    currency: string;
  };
  purchases: {
    total: number;
    draft: number;
    confirmed: number;
    totalSpend: number;
    currency: string;
  };
}

interface OdooCRMLead {
  id: number;
  name: string;
  contact_name: string;
  partner_id: [number, string] | false;
  email_from: string;
  phone: string;
  expected_revenue: number;
  probability: number;
  stage_id: [number, string];
  user_id: [number, string] | false;
  date_deadline: string;
  create_date: string;
  write_date: string;
  type: "lead" | "opportunity";
  priority: "0" | "1" | "2" | "3";
  lost_reason: [number, string] | false;
  tag_ids: [number, string][];
  description: string;
}

export type {
  OdooContact,
  OdooSaleOrder,
  OdooInvoice,
  OdooPurchaseOrder,
  OdooProduct,
  OdooDashboardSummary,
  OdooCRMLead,
};
