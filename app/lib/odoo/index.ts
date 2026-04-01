export {
  authenticate,
  execute,
  searchRead,
  searchCount,
  read,
  testConnection,
  isConfigured,
} from "./client";

export type {
  OdooContact,
  OdooSaleOrder,
  OdooInvoice,
  OdooPurchaseOrder,
  OdooProduct,
  OdooDashboardSummary,
  OdooCRMLead,
} from "./types";
