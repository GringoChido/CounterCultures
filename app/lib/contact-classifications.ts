const CONTACT_CLASSIFICATIONS = [
  "Vendor",
  "Customer",
  "Employee",
  "Service provider",
  "Supplies vendor",
] as const;

type ContactClassification = (typeof CONTACT_CLASSIFICATIONS)[number];

interface CrmContact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  type: string;
  tags: string;
  createdAt: string;
  notes: string;
  classifications: ContactClassification[];
}

const CLASSIFICATION_COLORS: Record<ContactClassification, { bg: string; text: string }> = {
  Vendor: { bg: "bg-brand-copper/15", text: "text-brand-copper" },
  Customer: { bg: "bg-brand-sage/15", text: "text-brand-sage" },
  Employee: { bg: "bg-company-llc/15", text: "text-company-llc" },
  "Service provider": { bg: "bg-brand-terracotta/15", text: "text-brand-terracotta" },
  "Supplies vendor": { bg: "bg-brand-stone/20", text: "text-brand-stone" },
};

const parseClassifications = (raw: string | undefined): ContactClassification[] => {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is ContactClassification =>
      CONTACT_CLASSIFICATIONS.includes(s as ContactClassification)
    );
};

const serializeClassifications = (classifications: ContactClassification[]): string =>
  classifications.join(",");

type DocumentContext = "invoice" | "bill" | "po" | "quote" | "receipt";

const roleFilterFor = (ctx: DocumentContext): ContactClassification[] => {
  switch (ctx) {
    case "bill":
    case "po":
      return ["Vendor", "Supplies vendor"];
    case "invoice":
    case "quote":
    case "receipt":
      return ["Customer"];
  }
};

export {
  CONTACT_CLASSIFICATIONS,
  CLASSIFICATION_COLORS,
  parseClassifications,
  serializeClassifications,
  roleFilterFor,
};
export type { ContactClassification, CrmContact, DocumentContext };
