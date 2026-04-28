/**
 * Odoo `ir.attachment` helpers — read + write file attachments tied to
 * any Odoo record. The dashboard's CFDI flow writes here so Roger's
 * accountant (who pulls from Odoo) sees the same file the dashboard sees.
 *
 * Field reference (Odoo 16/17/18):
 *   - res_model     str   target model (e.g. "account.move")
 *   - res_id        int   target record ID
 *   - name          str   filename
 *   - mimetype      str   MIME type
 *   - datas         str   base64-encoded file content (write only)
 *   - file_size     int   server-computed
 *   - create_date   datetime
 *   - create_uid    [id, name]
 */

import { execute, authenticate, isConfigured } from "./client";

let cachedUid: number | null = null;
const getUid = async (): Promise<number> => {
  if (cachedUid) return cachedUid;
  cachedUid = await authenticate();
  return cachedUid;
};

const requireConfigured = (): void => {
  if (!isConfigured()) {
    throw new Error(
      "Odoo not configured — attachment ops require ODOO_URL/DB/USERNAME/API_KEY."
    );
  }
};

export interface OdooAttachment {
  id: number;
  name: string;
  mimetype: string;
  fileSize: number;
  createDate: string;
  createdBy: string;
}

/**
 * List attachments tied to a specific Odoo record. Used to surface CFDIs
 * (and any other files Roger has historically attached) on the invoice
 * detail page without re-uploading.
 */
export const listAttachmentsFor = async (
  resModel: string,
  resId: number
): Promise<OdooAttachment[]> => {
  requireConfigured();
  const uid = await getUid();
  const records = (await execute(
    uid,
    "ir.attachment",
    "search_read",
    [
      [
        ["res_model", "=", resModel],
        ["res_id", "=", resId],
      ],
    ],
    {
      fields: ["id", "name", "mimetype", "file_size", "create_date", "create_uid"],
      order: "create_date desc",
      limit: 50,
    }
  )) as Record<string, unknown>[];

  return records.map((r) => ({
    id: r.id as number,
    name: (r.name as string) || "",
    mimetype: (r.mimetype as string) || "application/octet-stream",
    fileSize: (r.file_size as number) ?? 0,
    createDate: (r.create_date as string) || "",
    createdBy:
      Array.isArray(r.create_uid) && r.create_uid.length === 2
        ? String(r.create_uid[1])
        : "",
  }));
};

/**
 * Creates a new attachment record on an Odoo model. `data` is the raw
 * file content; we base64-encode it before sending to match Odoo's `datas`
 * field expectation. Returns the new attachment ID.
 */
export const createAttachmentFor = async (input: {
  resModel: string;
  resId: number;
  name: string;
  mimetype: string;
  data: Buffer;
}): Promise<number> => {
  requireConfigured();
  const uid = await getUid();
  const id = (await execute(
    uid,
    "ir.attachment",
    "create",
    [
      {
        name: input.name,
        res_model: input.resModel,
        res_id: input.resId,
        mimetype: input.mimetype,
        datas: input.data.toString("base64"),
        type: "binary",
      },
    ]
  )) as number;
  return id;
};

/**
 * Reads a single attachment's binary contents from Odoo. Used for download
 * proxying — the dashboard fetches via this rather than exposing Odoo
 * directly to the browser. Returns the decoded Buffer + metadata.
 */
export const fetchAttachment = async (
  attachmentId: number
): Promise<{ name: string; mimetype: string; data: Buffer } | null> => {
  requireConfigured();
  const uid = await getUid();
  const [record] = (await execute(
    uid,
    "ir.attachment",
    "read",
    [[attachmentId]],
    { fields: ["name", "mimetype", "datas"] }
  )) as { name: string; mimetype: string; datas: string }[];

  if (!record || !record.datas) return null;
  return {
    name: record.name,
    mimetype: record.mimetype || "application/octet-stream",
    data: Buffer.from(record.datas, "base64"),
  };
};
