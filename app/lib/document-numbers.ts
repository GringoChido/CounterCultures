/**
 * Auto-numbering system for Counter Cultures documents.
 *
 * Format: CC-{PREFIX}-{YYYY}-{NNN}
 *   Quote:    CC-Q-2026-001
 *   Invoice:  CC-INV-2026-001
 *   PO:       CC-PO-2026-001
 *   Receipt:  CC-DR-2026-001
 */

export type DocumentType = "quote" | "invoice" | "po" | "receipt";

export interface DocumentRecord {
  [key: string]: string;
  Doc_ID: string;
  Deal_ID: string;
  Type: string;
  File_Name: string;
  Drive_File_ID: string;
  Customer_Name: string;
  Status: string;
  Created_Date: string;
  Sent_Date: string;
  Amount: string;
}

const PREFIX_MAP: Record<DocumentType, string> = {
  quote: "Q",
  invoice: "INV",
  po: "PO",
  receipt: "DR",
};

const TYPE_LABELS: Record<DocumentType, { en: string; es: string }> = {
  quote: { en: "Quote", es: "Cotización" },
  invoice: { en: "Invoice", es: "Factura" },
  po: { en: "Purchase Order", es: "Orden de Compra" },
  receipt: { en: "Delivery Receipt", es: "Recibo de Entrega" },
};

export const getDocumentTypeLabel = (
  type: DocumentType,
  locale: "en" | "es" = "en"
): string => TYPE_LABELS[type]?.[locale] ?? type;

/**
 * Parse a document ID to extract type, year, and sequence number.
 * e.g. "CC-Q-2026-001" → { type: "quote", year: 2026, seq: 1 }
 */
export const parseDocumentId = (
  docId: string
): { type: DocumentType; year: number; seq: number } | null => {
  const match = docId.match(/^CC-(\w+)-(\d{4})-(\d{3,})$/);
  if (!match) return null;

  const prefix = match[1];
  const year = parseInt(match[2], 10);
  const seq = parseInt(match[3], 10);

  const type = (Object.entries(PREFIX_MAP) as [DocumentType, string][]).find(
    ([, p]) => p === prefix
  )?.[0];

  if (!type) return null;
  return { type, year, seq };
};

/**
 * Parse a file name to detect document type.
 * e.g. "CC-Q-2026-001.pdf" → "quote"
 */
export const detectDocumentType = (fileName: string): DocumentType | null => {
  const parsed = parseDocumentId(fileName.replace(/\.\w+$/, ""));
  return parsed?.type ?? null;
};

/**
 * Generate the next sequential document number for a given type.
 * Scans existing records to find the highest number for the current year.
 */
export const getNextDocumentNumber = (
  type: DocumentType,
  existingDocs: DocumentRecord[]
): string => {
  const prefix = PREFIX_MAP[type];
  const year = new Date().getFullYear();
  const pattern = `CC-${prefix}-${year}-`;

  let maxSeq = 0;
  for (const doc of existingDocs) {
    if (doc.Doc_ID.startsWith(pattern)) {
      const seq = parseInt(doc.Doc_ID.slice(pattern.length), 10);
      if (seq > maxSeq) maxSeq = seq;
    }
  }

  const nextSeq = String(maxSeq + 1).padStart(3, "0");
  return `CC-${prefix}-${year}-${nextSeq}`;
};

/**
 * Generate a file name from a document ID.
 */
export const getDocumentFileName = (docId: string): string => `${docId}.pdf`;
