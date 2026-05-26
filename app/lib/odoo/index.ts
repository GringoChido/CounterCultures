export {
  authenticate,
  execute,
  searchRead,
  searchCount,
  read,
  testConnection,
  isConfigured,
  fetchSaleOrderLines,
} from "./client";

export type { OdooSaleOrderLineLive } from "./client";

export type {
  OdooContact,
  OdooSaleOrder,
  OdooInvoice,
  OdooPurchaseOrder,
  OdooProduct,
  OdooDashboardSummary,
  OdooCRMLead,
} from "./types";
