/**
 * Deal Drive folder resolution.
 *
 * Every deal gets a canonical Drive folder under the Shared Drive root:
 *   Deals/[deal_id]/
 *     ├── Email Attachments/
 *     ├── Quotes/
 *     ├── Invoices/
 *     ├── Pedimentos/
 *     └── Misc/
 *
 * This replaces the V1 behavior where Gmail attach-to-deal dumped files
 * into a generic "Email attachments/YYYY-MM-DD" bucket in the Shared Drive
 * root, making it impossible to find the files on a deal's detail page.
 */

import { findOrCreateFolder, type DriveFile } from "./google-drive";

const SHARED_DRIVE_ID =
  process.env.GOOGLE_SHARED_DRIVE_ID || "0ALSvVEdW2-pkUk9PVA";

const DEALS_ROOT_NAME = "Deals";

export type DealSubfolder =
  | "Email Attachments"
  | "Quotes"
  | "Invoices"
  | "Pedimentos"
  | "Pedimentos & Importacion"
  | "Shipping"
  | "Delivery Receipts"
  | "CFDI & Facturas"
  | "Misc";

/**
 * Find or create the root `Deals/[dealId]/` folder. Idempotent — subsequent
 * calls return the same folder id.
 */
export const getDealFolder = async (dealId: string): Promise<DriveFile> => {
  if (!dealId) throw new Error("dealId is required");
  const root = await findOrCreateFolder(DEALS_ROOT_NAME, SHARED_DRIVE_ID);
  return findOrCreateFolder(dealId, root.id);
};

/**
 * Find or create a subfolder under `Deals/[dealId]/`. Used by attachment
 * routers to drop files in a predictable place.
 */
export const getDealSubfolder = async (
  dealId: string,
  subfolder: DealSubfolder
): Promise<DriveFile> => {
  const deal = await getDealFolder(dealId);
  return findOrCreateFolder(subfolder, deal.id);
};
