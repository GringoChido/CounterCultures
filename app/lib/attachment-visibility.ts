export type AttachmentVisibility =
  | "auto-show"
  | "auto-hide"
  | "user-show"
  | "user-hide";

export interface ClassifyInput {
  name: string;
  mimetype: string;
  fileSize: number;
  dims?: { width: number; height: number };
}

const LOGO_REGEX = /logo|firma|brand|header|footer|seal|stamp|qrcode|sello/i;

export const classifyAttachment = (att: ClassifyInput): AttachmentVisibility => {
  const isImage = att.mimetype.startsWith("image/");
  if (LOGO_REGEX.test(att.name)) return "auto-hide";
  if (isImage && att.fileSize > 0 && att.fileSize < 50_000) return "auto-hide";
  if (isImage && att.dims && att.dims.width * att.dims.height < 250_000) return "auto-hide";
  return "auto-show";
};

export const applyOverrides = (
  auto: AttachmentVisibility,
  override: AttachmentVisibility | undefined
): AttachmentVisibility => {
  if (!override) return auto;
  return override;
};

export const isHidden = (v: AttachmentVisibility): boolean =>
  v === "auto-hide" || v === "user-hide";
