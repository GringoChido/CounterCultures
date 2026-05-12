import { createHash } from "crypto";
import {
  readSheet,
  upsertRowByField,
} from "./dashboard-sheets";
import { ensureTab } from "./sheet-migrations";

const TAB = "Attachment_Visibility" as const;
const HEADERS = [
  "composite_key",
  "res_model",
  "res_id",
  "filename_hash",
  "visibility",
  "actor",
  "updated_at",
];

export interface OverrideRow {
  res_model: string;
  res_id: string;
  filename_hash: string;
  visibility: "user-show" | "user-hide";
  actor: string;
  updated_at: string;
}

export const hashFilename = (name: string): string =>
  createHash("sha1").update(name.trim().toLowerCase()).digest("hex").slice(0, 12);

const compositeKey = (resModel: string, resId: string, fnHash: string) =>
  `${resModel}::${resId}::${fnHash}`;

let tabEnsured = false;

const ensureOnce = async () => {
  if (tabEnsured) return;
  await ensureTab(TAB, HEADERS);
  tabEnsured = true;
};

interface SheetRow extends Record<string, string> {
  composite_key: string;
  res_model: string;
  res_id: string;
  filename_hash: string;
  visibility: string;
  actor: string;
  updated_at: string;
}

export const getOverridesFor = async (
  resModel: string,
  resId: string
): Promise<Map<string, "user-show" | "user-hide">> => {
  await ensureOnce();
  const rows = await readSheet<SheetRow>(TAB);
  const map = new Map<string, "user-show" | "user-hide">();
  for (const r of rows) {
    if (r.res_model === resModel && r.res_id === resId) {
      const v = r.visibility;
      if (v === "user-show" || v === "user-hide") {
        map.set(r.filename_hash, v);
      }
    }
  }
  return map;
};

export const setOverride = async (
  resModel: string,
  resId: string,
  filename: string,
  visibility: "user-show" | "user-hide",
  actor: string
): Promise<void> => {
  await ensureOnce();
  const fnHash = hashFilename(filename);
  const key = compositeKey(resModel, resId, fnHash);
  await upsertRowByField(
    TAB,
    { field: "composite_key", value: key },
    {
      composite_key: key,
      res_model: resModel,
      res_id: resId,
      filename_hash: fnHash,
      visibility,
      actor,
      updated_at: new Date().toISOString(),
    }
  );
};
