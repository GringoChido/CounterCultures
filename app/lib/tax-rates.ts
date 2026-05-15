import {
  readSheet,
  appendRowByHeader,
  updateRowByHeader,
  findRowIndex,
} from "@/app/lib/dashboard-sheets";

export type TaxKind = "IVA" | "IEPS" | "Retencion" | "Other";
export type TaxAppliesTo = "AR" | "AP" | "Both";

export interface TaxRateRow {
  [key: string]: string;
  id: string;
  name: string;
  kind: TaxKind;
  rate: string;
  applies_to: TaxAppliesTo;
  active: string;
  created_by: string;
  created_at: string;
}

export interface TaxRate {
  id: string;
  name: string;
  kind: TaxKind;
  rate: number;
  appliesTo: TaxAppliesTo;
  active: boolean;
  createdBy: string;
  createdAt: string;
}

const VALID_KINDS: TaxKind[] = ["IVA", "IEPS", "Retencion", "Other"];
const VALID_APPLIES: TaxAppliesTo[] = ["AR", "AP", "Both"];

const toTaxRate = (r: TaxRateRow): TaxRate => ({
  id: r.id,
  name: r.name,
  kind: VALID_KINDS.includes(r.kind as TaxKind) ? (r.kind as TaxKind) : "Other",
  rate: parseFloat(r.rate) || 0,
  appliesTo: VALID_APPLIES.includes(r.applies_to as TaxAppliesTo)
    ? (r.applies_to as TaxAppliesTo)
    : "Both",
  active: r.active !== "false",
  createdBy: r.created_by ?? "",
  createdAt: r.created_at ?? "",
});

export const listTaxRates = async (): Promise<TaxRate[]> => {
  try {
    const rows = await readSheet<TaxRateRow>("Tax_Rates");
    return rows.map(toTaxRate);
  } catch {
    return [];
  }
};

export const listActiveTaxRates = async (): Promise<TaxRate[]> => {
  const all = await listTaxRates();
  return all.filter((r) => r.active);
};

export const getTaxRate = async (id: string): Promise<TaxRate | null> => {
  const all = await listTaxRates();
  return all.find((r) => r.id === id) ?? null;
};

export const createTaxRate = async (
  data: { name: string; kind: TaxKind; rate: number; appliesTo: TaxAppliesTo },
  actor: string
): Promise<TaxRate> => {
  const id = `tax_${Date.now()}`;
  const row: Record<string, string> = {
    id,
    name: data.name,
    kind: data.kind,
    rate: String(data.rate),
    applies_to: data.appliesTo,
    active: "true",
    created_by: actor,
    created_at: new Date().toISOString(),
  };
  await appendRowByHeader("Tax_Rates", row);
  return {
    id,
    name: data.name,
    kind: data.kind,
    rate: data.rate,
    appliesTo: data.appliesTo,
    active: true,
    createdBy: actor,
    createdAt: row.created_at,
  };
};

export const updateTaxRate = async (
  id: string,
  data: Partial<{ name: string; kind: TaxKind; rate: number; appliesTo: TaxAppliesTo; active: boolean }>
): Promise<boolean> => {
  const rowIndex = await findRowIndex("Tax_Rates", "id", id);
  if (rowIndex === null) return false;
  const updates: Record<string, string> = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.kind !== undefined) updates.kind = data.kind;
  if (data.rate !== undefined) updates.rate = String(data.rate);
  if (data.appliesTo !== undefined) updates.applies_to = data.appliesTo;
  if (data.active !== undefined) updates.active = String(data.active);
  await updateRowByHeader("Tax_Rates", rowIndex, updates);
  return true;
};

export { VALID_KINDS, VALID_APPLIES };
