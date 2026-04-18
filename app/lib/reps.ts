/**
 * Reps helpers — reads the `Reps` tab of the CRM Sheet, used by
 * <ShareButton /> to populate the recipient dropdown.
 *
 * Expected columns (case-insensitive):
 *   id · name · email · whatsapp_phone · (any others CC already uses)
 *
 * `whatsapp_phone` lands in E.164 format (e.g. +524151234567) and is
 * stripped to digits at render time for `wa.me/[digits]` deeplinks.
 */

import { readSheet } from "./dashboard-sheets";

export interface Rep {
  id: string;
  name: string;
  email: string;
  whatsappPhone: string; // E.164 as stored; `wa.me` requires digits only
}

type RepRow = Record<string, string>;

const pick = (r: RepRow, ...keys: string[]): string => {
  for (const k of keys) {
    if (r[k] && r[k].trim()) return r[k].trim();
  }
  return "";
};

export const listReps = async (): Promise<Rep[]> => {
  const rows = await readSheet<RepRow>("Reps");
  return rows
    .map((r) => ({
      id: pick(r, "id", "rep_id"),
      name: pick(r, "name", "full_name", "rep_name"),
      email: pick(r, "email", "rep_email"),
      whatsappPhone: pick(r, "whatsapp_phone", "whatsappPhone", "phone_whatsapp"),
    }))
    .filter((r) => r.name || r.email);
};
