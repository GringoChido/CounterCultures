export interface Product {
  id: string;
  sku: string;
  brand: string;
  name: string;
  nameEn: string;
  category: "bathroom" | "kitchen" | "hardware";
  subcategory: string;
  price: number;
  tradePrice?: number;
  currency: "MXN" | "USD";
  finishes: string[];
  images: string[];
  artisanal: boolean;
  description: string;
  descriptionEn: string;
  specifications?: Record<string, string>;
  availability: "in-stock" | "made-to-order" | "special-order";
  featured?: boolean;
  slug: string;
}

export interface Lead {
  leadId: string;
  name: string;
  email: string;
  phone: string;
  source: "website" | "whatsapp" | "walk-in" | "trade" | "referral" | "phone";
  status: "new" | "contacted" | "quoted" | "follow-up" | "closed-won" | "closed-lost";
  assignedRep: string;
  dealValue: number;
  createdDate: string;
  lastContact: string;
  nextFollowup: string;
  notes: string;
}

export interface PipelineDeal {
  dealId: string;
  leadId: string;
  stage: "new" | "quoted" | "negotiating" | "closed-won" | "closed-lost";
  products: string[];
  quotedValue: number;
  quoteDate: string;
  expectedClose: string;
  winLossReason?: string;
}

export interface BilingualText {
  en: string;
  es: string;
}

export interface ProductFilter {
  category?: string;
  subcategory?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  finish?: string;
  artisanal?: boolean;
}
