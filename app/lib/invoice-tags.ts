/**
 * Invoice tags — lightweight metadata annotations stored in a local sheet.
 * Not in Odoo; used for CC-specific classification like shipping scenario.
 */

import {
  readSheet,
  appendRowByHeader,
  updateRowByHeader,
  findRowIndex,
} from "./dashboard-sheets";
import { ensureTab } from "./sheet-migrations";

export type ShippingScenario =
  | "direct_ship"
  | "warehouse"
  | "consolidated"
  | "drop_ship"
  | "";

export const SHIPPING_SCENARIOS: { value: ShippingScenario; label: string; labelEs: string }[] = [
  { value: "direct_ship", label: "Direct ship", labelEs: "Envío directo" },
  { value: "warehouse", label: "Warehouse (SMA)", labelEs: "Almacén (SMA)" },
  { value: "consolidated", label: "Consolidated", labelEs: "Consolidado" },
  { value: "drop_ship", label: "Drop ship (broker)", labelEs: "Drop ship (agente)" },
];

interface TagRow extends Record<string, string> {
  invoice_id: string;
  tag_type: string;
  tag_value: string;
  updated_by: string;
  updated_at: string;
}

const TAB = "Invoice_Tags" as const;
const HEADERS = ["invoice_id", "tag_type", "tag_value", "updated_by", "updated_at"];

let migrated = false;
const ensureTagTab = async () => {
  if (migrated) return;
  await ensureTab(TAB, HEADERS);
  migrated = true;
};

export const getInvoiceTag = async (
  invoiceId: string,
  tagType: string
): Promise<string> => {
  await ensureTagTab();
  const rows = await readSheet<TagRow>(TAB);
  const match = rows.find(
    (r) => r.invoice_id === invoiceId && r.tag_type === tagType
  );
  return match?.tag_value ?? "";
};

export const getInvoiceTags = async (
  invoiceId: string
): Promise<Record<string, string>> => {
  await ensureTagTab();
  const rows = await readSheet<TagRow>(TAB);
  const tags: Record<string, string> = {};
  for (const r of rows) {
    if (r.invoice_id === invoiceId) {
      tags[r.tag_type] = r.tag_value;
    }
  }
  return tags;
};

export const setInvoiceTag = async (
  invoiceId: string,
  tagType: string,
  tagValue: string,
  updatedBy: string
): Promise<void> => {
  await ensureTagTab();
  const rows = await readSheet<TagRow>(TAB);
  const existingIdx = rows.findIndex(
    (r) => r.invoice_id === invoiceId && r.tag_type === tagType
  );

  if (existingIdx >= 0) {
    await updateRowByHeader(TAB, existingIdx, {
      tag_value: tagValue,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    });
  } else {
    await appendRowByHeader(TAB, {
      invoice_id: invoiceId,
      tag_type: tagType,
      tag_value: tagValue,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    });
  }
};

export const getShippingScenario = async (
  invoiceId: string
): Promise<ShippingScenario> => {
  const val = await getInvoiceTag(invoiceId, "shipping_scenario");
  const valid: ShippingScenario[] = ["direct_ship", "warehouse", "consolidated", "drop_ship"];
  return valid.includes(val as ShippingScenario) ? (val as ShippingScenario) : "";
};

export const setShippingScenario = async (
  invoiceId: string,
  scenario: ShippingScenario,
  updatedBy: string
): Promise<void> => {
  await setInvoiceTag(invoiceId, "shipping_scenario", scenario, updatedBy);
};
