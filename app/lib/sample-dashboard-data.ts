// Sample data for development when Google Sheets is not configured

export type ContactRole = "Architect" | "Interior Designer" | "Developer" | "Builder" | "Private Client" | "Supplier" | "Partner" | "Hospitality Designer";
export type ProjectType = "Luxury Residential" | "Boutique Hotel" | "Multi-Unit Development" | "Custom Estate" | "Commercial" | "Restaurant";
export type LostReason = "price" | "timeline" | "competitor" | "no-budget" | "ghost" | "other";

export type PipelineStage =
  // Existing stages
  | "discovery" | "proposal" | "negotiation" | "closed-won" | "closed-lost"
  // New expanded stages
  | "target-identified" | "contacted" | "conversation-started" | "qualified-project"
  | "design-scope" | "proposal-sent" | "follow-up-negotiation" | "verbal-yes"
  | "won" | "lost"
  // Post-sale fulfillment stages
  | "quote-approved" | "deposit-pending" | "deposit-received"
  | "ordering" | "in-production" | "shipping" | "received"
  | "delivery-scheduled" | "delivered" | "balance-pending"
  | "complete" | "post-delivery-issue";

// ---------------------------------------------------------------------------
// Fulfillment & Operations Types
// ---------------------------------------------------------------------------

export type FulfillmentStage =
  | "quote-approved"
  | "deposit-invoiced"
  | "deposit-received"
  | "pos-placed"
  | "in-production"
  | "shipping"
  | "received-at-cc"
  | "quality-checked"
  | "delivery-scheduled"
  | "delivered"
  | "balance-invoiced"
  | "fully-paid"
  | "complete"
  | "issue";

export type PaymentStructure = "full-upfront" | "fifty-fifty" | "net-30" | "custom";

export interface DealLineItem {
  id: string;
  productName: string;
  sku: string;
  brand: string;
  finish?: string;
  quantity: number;
  dealerCost: number;
  quotedPrice: number;
  msrp: number;
  mapPrice?: number;
  shippingCost: number;
  leadTime?: string;
  status: "current" | "special-order" | "custom" | "discontinued";
  marginAmount: number;
  marginPercent: number;
}

export interface DealPayment {
  id: string;
  type: "deposit" | "balance" | "full" | "installment";
  invoiceId: string;
  stripeInvoiceId?: string;
  stripePaymentId?: string;
  amount: number;
  currency: string;
  stripeFees?: number;
  netReceived?: number;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled" | "refunded";
  dueDate?: string;
  paidDate?: string;
  installmentNumber?: number;
}

export interface PurchaseOrder {
  id: string;
  dealId: string;
  brand: string;
  manufacturerName: string;
  manufacturerContact?: string;
  items: {
    sku: string;
    productName: string;
    finish?: string;
    quantity: number;
    dealerCost: number;
  }[];
  totalAmount: number;
  currency: string;
  status: "draft" | "sent" | "confirmed" | "paid-to-manufacturer" | "in-production" | "shipped" | "received" | "issue";
  sentDate?: string;
  confirmedDate?: string;
  paymentToMfr?: {
    date: string;
    amount: number;
    method: string;
    reference: string;
  };
  shipTo: "cc-showroom" | "customer-direct";
  requestedDeliveryDate?: string;
  estimatedShipDate?: string;
  trackingCarrier?: string;
  trackingNumber?: string;
  receivedDate?: string;
  receivedCondition?: "good" | "damaged" | "wrong-item" | "partial";
  receivedNotes?: string;
  driveFileId?: string;
}

export interface DealShipment {
  id: string;
  dealId: string;
  poId: string;
  brand: string;
  carrier?: string;
  trackingNumber?: string;
  status: "label-created" | "in-transit" | "customs" | "out-for-delivery" | "delivered-to-cc" | "delivered-to-customer";
  shipDate?: string;
  estimatedArrival?: string;
  actualArrival?: string;
  destination: "cc-showroom" | "customer-direct";
  items: { sku: string; productName: string; quantity: number }[];
  inspectionStatus?: "pending" | "passed" | "damaged" | "wrong-item";
  inspectionNotes?: string;
  inspectionPhotos?: string[];
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";
  assignedRep: string;
  score: number;
  createdAt: string;
  updatedAt: string;
  notes: string;
  projectType: string;
  budget: string;
  // New optional fields
  whatsapp?: string;
  companyName?: string;
  contactType?: ContactRole;
  city?: string;
  lastContactDate?: string;
  nextFollowUp?: string;
  linkedOpportunities?: string[];
  tags?: string[];
}

export interface PipelineDeal {
  id: string;
  name: string;
  contactName: string;
  value: number;
  currency: string;
  stage: PipelineStage;
  probability: number;
  expectedClose: string;
  assignedRep: string;
  products: string;
  createdAt: string;
  notes: string;
  // New optional fields
  contactCompany?: string;
  contactRole?: ContactRole;
  projectType?: ProjectType;
  estimatedProjectValue?: number;
  timeline?: string;
  decisionMakerName?: string;
  decisionRole?: string;
  leadSource?: string;
  followUpDate?: string;
  competitor?: string;
  lostReason?: LostReason;

  // Structured product data (Operations)
  lineItems?: DealLineItem[];

  // Financial
  paymentStructure?: PaymentStructure;
  payments?: DealPayment[];
  customerType?: "retail" | "trade";
  dealCurrency?: "MXN" | "USD";
  taxRate?: number;

  // Fulfillment
  fulfillmentStage?: FulfillmentStage;
  purchaseOrders?: PurchaseOrder[];
  shipments?: DealShipment[];
  deliveryStrategy?: "as-available" | "consolidate";
  deliveryDate?: string;
  deliveryAddress?: string;
  deliveryNotes?: string;

  // Financial summary (calculated)
  totalQuoted?: number;
  totalDealerCost?: number;
  totalShipping?: number;
  totalStripeFees?: number;
  totalCollected?: number;
  totalPaidToManufacturers?: number;
  netMargin?: number;
  marginPercent?: number;

  // Versioning
  quoteVersions?: { version: number; docId: string; status: "active" | "superseded" }[];
}

export interface ActivityItem {
  id: string;
  type: "call" | "email" | "meeting" | "note" | "deal" | "lead" | "whatsapp";
  description: string;
  contactName: string;
  rep: string;
  timestamp: string;
  // New optional fields
  contactId?: string;
  dealId?: string;
  followUpDate?: string;
}

export interface Campaign {
  id: string;
  name: string;
  status: "draft" | "sent" | "scheduled" | "active";
  openRate: number;
  clickRate: number;
  recipients: number;
  sentDate: string;
  // New optional fields
  type?: "cold-outreach" | "warm-nurture" | "one-off";
  audienceType?: string;
  totalEmails?: number;
  currentEmail?: number;
  replyRate?: number;
  leadsGenerated?: number;
}

export const SAMPLE_LEADS: Lead[] = [
  {
    id: "LEAD-001",
    name: "Maria Garcia",
    email: "maria@designstudio.mx",
    phone: "+52 415 123 4567",
    source: "Showroom Walk-in",
    status: "qualified",
    assignedRep: "Carlos",
    score: 85,
    createdAt: "2026-03-15T10:00:00Z",
    updatedAt: "2026-03-28T14:30:00Z",
    notes: "Interested in full bathroom renovation. Has architectural plans ready.",
    projectType: "Residential Renovation",
    budget: "$150,000 MXN",
    contactType: "Interior Designer",
    companyName: "Design Studio MX",
    city: "San Miguel de Allende",
    lastContactDate: "2026-03-28",
    nextFollowUp: "2026-04-02",
    tags: ["high-value", "renovation"],
  },
  {
    id: "LEAD-002",
    name: "James Mitchell",
    email: "j.mitchell@hotel-rosewood.com",
    phone: "+52 415 987 6543",
    source: "Website Contact Form",
    status: "proposal",
    assignedRep: "Roger",
    score: 92,
    createdAt: "2026-03-10T08:00:00Z",
    updatedAt: "2026-03-29T11:00:00Z",
    notes: "Boutique hotel renovation \u2014 12 bathrooms. Looking at TOTO and Kohler.",
    projectType: "Hospitality",
    budget: "$2,400,000 MXN",
    contactType: "Hospitality Designer",
    companyName: "Hotel Rosewood SMA",
    city: "San Miguel de Allende",
    lastContactDate: "2026-03-29",
    nextFollowUp: "2026-04-02",
    linkedOpportunities: ["DEAL-001"],
    tags: ["hospitality", "high-value"],
  },
  {
    id: "LEAD-003",
    name: "Ana Rodriguez",
    email: "ana.r@gmail.com",
    phone: "+52 415 555 1234",
    source: "Instagram",
    status: "new",
    assignedRep: "",
    score: 45,
    createdAt: "2026-03-28T16:00:00Z",
    updatedAt: "2026-03-28T16:00:00Z",
    notes: "Liked our copper basin post. Asked about pricing.",
    projectType: "New Build",
    budget: "TBD",
    contactType: "Private Client",
    city: "San Miguel de Allende",
    lastContactDate: "2026-03-28",
    nextFollowUp: "2026-04-01",
    tags: ["social-lead"],
  },
  {
    id: "LEAD-004",
    name: "Patricia Hoffman",
    email: "phoffman@architectmx.com",
    phone: "+52 415 222 3456",
    source: "Trade Program",
    status: "contacted",
    assignedRep: "Carlos",
    score: 70,
    createdAt: "2026-03-20T09:00:00Z",
    updatedAt: "2026-03-27T15:00:00Z",
    notes: "Architect \u2014 submitted trade application. Working on Casa Luna project.",
    projectType: "Residential New Build",
    budget: "$500,000 MXN",
    contactType: "Architect",
    companyName: "Architect MX",
    city: "San Miguel de Allende",
    lastContactDate: "2026-03-27",
    nextFollowUp: "2026-04-03",
    linkedOpportunities: ["DEAL-005"],
    tags: ["trade", "architect"],
  },
  {
    id: "LEAD-005",
    name: "Roberto Sanchez",
    email: "roberto@cocinas-gourmet.mx",
    phone: "+52 442 111 2222",
    source: "Referral",
    status: "qualified",
    assignedRep: "Roger",
    score: 78,
    createdAt: "2026-03-12T11:00:00Z",
    updatedAt: "2026-03-26T10:00:00Z",
    notes: "Restaurant kitchen remodel. Needs BLANCO sinks and commercial faucets.",
    projectType: "Commercial",
    budget: "$800,000 MXN",
    contactType: "Private Client",
    companyName: "Cocinas Gourmet",
    city: "Queretaro",
    lastContactDate: "2026-03-26",
    nextFollowUp: "2026-04-01",
    linkedOpportunities: ["DEAL-003"],
    tags: ["commercial", "kitchen"],
  },
  {
    id: "LEAD-006",
    name: "Linda Chen",
    email: "linda.chen@expatlife.mx",
    phone: "+52 415 333 4444",
    source: "WhatsApp",
    status: "won",
    assignedRep: "Carlos",
    score: 95,
    createdAt: "2026-02-28T14:00:00Z",
    updatedAt: "2026-03-25T16:00:00Z",
    notes: "Purchased full master bath suite \u2014 Kohler + California Faucets. Delivery scheduled.",
    projectType: "Residential Renovation",
    budget: "$320,000 MXN",
    contactType: "Private Client",
    city: "San Miguel de Allende",
    lastContactDate: "2026-03-25",
    nextFollowUp: "2026-04-05",
    linkedOpportunities: ["DEAL-002"],
    tags: ["closed", "expat"],
  },
  {
    id: "LEAD-007",
    name: "David Martinez",
    email: "david@construmex.com",
    phone: "+52 415 444 5555",
    source: "Website Contact Form",
    status: "contacted",
    assignedRep: "Roger",
    score: 60,
    createdAt: "2026-03-22T10:00:00Z",
    updatedAt: "2026-03-29T09:00:00Z",
    notes: "Builder \u2014 6-unit condo project. Wants bulk pricing on Emtek hardware.",
    projectType: "Multi-Unit Development",
    budget: "$1,200,000 MXN",
    contactType: "Developer",
    companyName: "Construmex",
    city: "San Miguel de Allende",
    lastContactDate: "2026-03-29",
    nextFollowUp: "2026-04-03",
    linkedOpportunities: ["DEAL-004"],
    tags: ["developer", "bulk"],
  },
  {
    id: "LEAD-008",
    name: "Sarah Johnson",
    email: "sarah.j@interiors-sma.com",
    phone: "+52 415 666 7777",
    source: "Showroom Walk-in",
    status: "new",
    assignedRep: "",
    score: 55,
    createdAt: "2026-03-29T15:00:00Z",
    updatedAt: "2026-03-29T15:00:00Z",
    notes: "Interior designer \u2014 browsed artisanal collection. Wants catalog.",
    projectType: "Design Firm",
    budget: "TBD",
    contactType: "Interior Designer",
    companyName: "Interiors SMA",
    city: "San Miguel de Allende",
    lastContactDate: "2026-03-29",
    nextFollowUp: "2026-04-05",
    tags: ["designer", "artisanal"],
  },
];

export const SAMPLE_PIPELINE: PipelineDeal[] = [
  {
    id: "DEAL-001",
    name: "Hotel Rosewood \u2014 Bath Renovation",
    contactName: "James Mitchell",
    value: 2400000,
    currency: "MXN",
    stage: "proposal",
    probability: 75,
    expectedClose: "2026-04-30",
    assignedRep: "Roger",
    products: "TOTO Washlet, Kohler Purist, California Faucets Descanso",
    createdAt: "2026-03-10T08:00:00Z",
    notes: "Proposal sent 3/25. Follow-up scheduled 4/2.",
    contactCompany: "Hotel Rosewood SMA",
    contactRole: "Hospitality Designer",
    projectType: "Boutique Hotel",
    leadSource: "Website Contact Form",
    followUpDate: "2026-04-02",
  },
  {
    id: "DEAL-002",
    name: "Chen Residence \u2014 Master Bath",
    contactName: "Linda Chen",
    value: 320000,
    currency: "MXN",
    stage: "closed-won",
    probability: 100,
    expectedClose: "2026-03-25",
    assignedRep: "Carlos",
    products: "Kohler Memoirs, California Faucets Tiburon",
    createdAt: "2026-02-28T14:00:00Z",
    notes: "Paid in full. Delivery 4/5.",
    contactRole: "Private Client",
    projectType: "Luxury Residential",
    leadSource: "WhatsApp",
  },
  {
    id: "DEAL-003",
    name: "Cocinas Gourmet \u2014 Kitchen Remodel",
    contactName: "Roberto Sanchez",
    value: 800000,
    currency: "MXN",
    stage: "discovery",
    probability: 40,
    expectedClose: "2026-05-15",
    assignedRep: "Roger",
    products: "BLANCO Silgranit, Brizo Artesso",
    createdAt: "2026-03-12T11:00:00Z",
    notes: "Needs site visit to confirm specs.",
    contactCompany: "Cocinas Gourmet",
    contactRole: "Private Client",
    projectType: "Restaurant",
    leadSource: "Referral",
    followUpDate: "2026-04-03",
  },
  {
    id: "DEAL-004",
    name: "Construmex Condos \u2014 Hardware Package",
    contactName: "David Martinez",
    value: 1200000,
    currency: "MXN",
    stage: "negotiation",
    probability: 60,
    expectedClose: "2026-06-01",
    assignedRep: "Roger",
    products: "Emtek Modern Rectangular, Sun Valley Bronze",
    createdAt: "2026-03-22T10:00:00Z",
    notes: "Negotiating bulk pricing. Wants 15% off retail.",
    contactCompany: "Construmex",
    contactRole: "Developer",
    projectType: "Multi-Unit Development",
    leadSource: "Website Contact Form",
    followUpDate: "2026-04-01",
    competitor: "Baldwin",
  },
  {
    id: "DEAL-005",
    name: "Casa Luna \u2014 Full Spec",
    contactName: "Patricia Hoffman",
    value: 500000,
    currency: "MXN",
    stage: "discovery",
    probability: 30,
    expectedClose: "2026-07-01",
    assignedRep: "Carlos",
    products: "TBD \u2014 awaiting architectural plans",
    createdAt: "2026-03-20T09:00:00Z",
    notes: "Architect wants to visit showroom with client.",
    contactCompany: "Architect MX",
    contactRole: "Architect",
    projectType: "Custom Estate",
    leadSource: "Trade Program",
    followUpDate: "2026-04-05",
  },
  // New sample deals for expanded pipeline
  {
    id: "DEAL-006",
    name: "Boutique Hotel Anima \u2014 Spa Suite",
    contactName: "Valentina Torres",
    contactCompany: "Grupo Anima",
    contactRole: "Hospitality Designer",
    value: 1850000,
    currency: "MXN",
    stage: "design-scope",
    probability: 50,
    expectedClose: "2026-06-15",
    assignedRep: "Roger",
    products: "AquaSpa Velas, TOTO Neorest, California Faucets Steampunk Bay",
    createdAt: "2026-03-05T09:00:00Z",
    notes: "Reviewing spa specs and AquaSpa installation requirements.",
    projectType: "Boutique Hotel",
    estimatedProjectValue: 32000000,
    timeline: "2026-08-01",
    decisionMakerName: "Valentina Torres",
    decisionRole: "Owner / Developer",
    leadSource: "Showroom Walk-in",
    followUpDate: "2026-04-04",
    competitor: "",
  },
  {
    id: "DEAL-007",
    name: "Residencial Los Arcos \u2014 Phase 1 Hardware",
    contactName: "Miguel Angel Reyes",
    contactCompany: "Desarrollos Los Arcos",
    contactRole: "Developer",
    value: 3200000,
    currency: "MXN",
    stage: "verbal-yes",
    probability: 90,
    expectedClose: "2026-04-10",
    assignedRep: "Roger",
    products: "Sun Valley Bronze entry sets (24 units), Emtek interior hardware",
    createdAt: "2026-02-15T10:00:00Z",
    notes: "PO expected this week. 24-home luxury development. Phase 1 of 3.",
    projectType: "Multi-Unit Development",
    estimatedProjectValue: 120000000,
    timeline: "2026-05-01",
    decisionMakerName: "Miguel Angel Reyes",
    decisionRole: "CEO",
    leadSource: "Referral",
    followUpDate: "2026-04-01",
    competitor: "Baldwin",
  },
  {
    id: "DEAL-008",
    name: "Galeria del Sol \u2014 Bathroom Refresh",
    contactName: "Carmen Ortiz",
    contactCompany: "Ortiz Interiors",
    contactRole: "Interior Designer",
    value: 180000,
    currency: "MXN",
    stage: "target-identified",
    probability: 10,
    expectedClose: "2026-08-01",
    assignedRep: "",
    products: "TBD",
    createdAt: "2026-03-29T12:00:00Z",
    notes: "Found via Instagram \u2014 follows CC. Has high-end residential projects in SMA.",
    projectType: "Luxury Residential",
    estimatedProjectValue: 4500000,
    timeline: "TBD",
    decisionMakerName: "Carmen Ortiz",
    decisionRole: "Principal Designer",
    leadSource: "Instagram",
    followUpDate: "2026-04-05",
    competitor: "",
  },

  // -------------------------------------------------------------------------
  // Post-sale sample deals — full operations data
  // -------------------------------------------------------------------------

  {
    id: "DEAL-009",
    name: "Arq. Carolina Mendoza \u2014 Kitchen Remodel",
    contactName: "Carolina Mendoza",
    contactCompany: "Mendoza Arquitectos",
    contactRole: "Architect",
    value: 145000,
    currency: "MXN",
    stage: "in-production",
    probability: 100,
    expectedClose: "2026-04-01",
    assignedRep: "Roger",
    products: "Brizo Litze Faucet, Brizo Litze Pot Filler, TOTO Washlet C5, TOTO Drake Toilet, Cal Faucets Descanso Shower System",
    createdAt: "2026-03-01T10:00:00Z",
    notes: "Kitchen remodel for colonial home in Centro. Custom finish on Cal Faucets shower \u2014 Satin Brass. Waiting on custom piece.",
    projectType: "Luxury Residential",
    leadSource: "Referral",
    followUpDate: "2026-04-10",
    customerType: "retail",
    dealCurrency: "MXN",
    taxRate: 16,
    paymentStructure: "fifty-fifty",
    deliveryStrategy: "consolidate",
    deliveryAddress: "Calle Aldama 42, Centro, San Miguel de Allende",
    deliveryNotes: "Ring bell at main gate. Ask for housekeeper Maria.",
    fulfillmentStage: "in-production",
    lineItems: [
      { id: "LI-001", productName: "Litze Pull-Down Faucet", sku: "63054LF-GL", brand: "Brizo", finish: "Luxe Gold", quantity: 1, dealerCost: 22000, quotedPrice: 35000, msrp: 42000, shippingCost: 1500, leadTime: "3-4 weeks", status: "current", marginAmount: 13000, marginPercent: 37.1 },
      { id: "LI-002", productName: "Litze Pot Filler", sku: "62174LF-GL", brand: "Brizo", finish: "Luxe Gold", quantity: 1, dealerCost: 16000, quotedPrice: 25000, msrp: 30000, shippingCost: 1200, leadTime: "3-4 weeks", status: "current", marginAmount: 9000, marginPercent: 36.0 },
      { id: "LI-003", productName: "Washlet C5", sku: "SW3084#01", brand: "TOTO", quantity: 1, dealerCost: 12000, quotedPrice: 20000, msrp: 24000, shippingCost: 2000, leadTime: "2-3 weeks", status: "current", marginAmount: 8000, marginPercent: 40.0 },
      { id: "LI-004", productName: "Drake Elongated Toilet", sku: "CST776CEG#01", brand: "TOTO", quantity: 1, dealerCost: 10000, quotedPrice: 17000, msrp: 20000, shippingCost: 2500, leadTime: "2-3 weeks", status: "current", marginAmount: 7000, marginPercent: 41.2 },
      { id: "LI-005", productName: "Descanso Shower System", sku: "DSC-SHS-SB", brand: "California Faucets", finish: "Satin Brass (Custom)", quantity: 1, dealerCost: 15000, quotedPrice: 48000, msrp: 55000, shippingCost: 1800, leadTime: "6-8 weeks", status: "custom", marginAmount: 33000, marginPercent: 68.8 },
    ],
    payments: [
      { id: "PAY-001", type: "deposit", invoiceId: "CC-INV-2026-001A", amount: 72500, currency: "MXN", stripeFees: 2613, netReceived: 69887, status: "paid", dueDate: "2026-03-28", paidDate: "2026-04-03" },
      { id: "PAY-002", type: "balance", invoiceId: "CC-INV-2026-001B", amount: 72500, currency: "MXN", status: "draft", dueDate: "2026-05-15" },
    ],
    purchaseOrders: [
      {
        id: "CC-PO-2026-001", dealId: "DEAL-009", brand: "Brizo", manufacturerName: "Brizo / Delta Faucet", manufacturerContact: "rep@brizo.com",
        items: [
          { sku: "63054LF-GL", productName: "Litze Pull-Down Faucet", finish: "Luxe Gold", quantity: 1, dealerCost: 22000 },
          { sku: "62174LF-GL", productName: "Litze Pot Filler", finish: "Luxe Gold", quantity: 1, dealerCost: 16000 },
        ],
        totalAmount: 38000, currency: "MXN", status: "shipped", sentDate: "2026-04-04", confirmedDate: "2026-04-05",
        paymentToMfr: { date: "2026-04-08", amount: 38000, method: "wire", reference: "TRF-2026-0412" },
        shipTo: "cc-showroom", estimatedShipDate: "2026-04-15", trackingCarrier: "FedEx", trackingNumber: "789123456700",
      },
      {
        id: "CC-PO-2026-002", dealId: "DEAL-009", brand: "TOTO", manufacturerName: "TOTO USA",
        items: [
          { sku: "SW3084#01", productName: "Washlet C5", quantity: 1, dealerCost: 12000 },
          { sku: "CST776CEG#01", productName: "Drake Elongated Toilet", quantity: 1, dealerCost: 10000 },
        ],
        totalAmount: 22000, currency: "MXN", status: "received", sentDate: "2026-04-04", confirmedDate: "2026-04-04",
        paymentToMfr: { date: "2026-04-05", amount: 22000, method: "credit-card", reference: "CC-4521" },
        shipTo: "cc-showroom", trackingCarrier: "UPS", trackingNumber: "1Z999AA10123456784",
        receivedDate: "2026-04-18", receivedCondition: "good",
      },
      {
        id: "CC-PO-2026-003", dealId: "DEAL-009", brand: "California Faucets", manufacturerName: "California Faucets",
        items: [
          { sku: "DSC-SHS-SB", productName: "Descanso Shower System", finish: "Satin Brass (Custom)", quantity: 1, dealerCost: 15000 },
        ],
        totalAmount: 15000, currency: "MXN", status: "in-production", sentDate: "2026-04-06",
        shipTo: "cc-showroom", estimatedShipDate: "2026-05-10",
      },
    ],
    shipments: [
      {
        id: "SHIP-001", dealId: "DEAL-009", poId: "CC-PO-2026-001", brand: "Brizo", carrier: "FedEx", trackingNumber: "789123456700",
        status: "in-transit", shipDate: "2026-04-15", estimatedArrival: "2026-04-22", destination: "cc-showroom",
        items: [
          { sku: "63054LF-GL", productName: "Litze Pull-Down Faucet", quantity: 1 },
          { sku: "62174LF-GL", productName: "Litze Pot Filler", quantity: 1 },
        ],
      },
      {
        id: "SHIP-002", dealId: "DEAL-009", poId: "CC-PO-2026-002", brand: "TOTO", carrier: "UPS", trackingNumber: "1Z999AA10123456784",
        status: "delivered-to-cc", shipDate: "2026-04-10", estimatedArrival: "2026-04-18", actualArrival: "2026-04-18", destination: "cc-showroom",
        items: [
          { sku: "SW3084#01", productName: "Washlet C5", quantity: 1 },
          { sku: "CST776CEG#01", productName: "Drake Elongated Toilet", quantity: 1 },
        ],
        inspectionStatus: "passed",
      },
    ],
    totalQuoted: 145000, totalDealerCost: 75000, totalShipping: 9000, totalStripeFees: 5226,
    totalCollected: 72500, totalPaidToManufacturers: 60000, netMargin: 55774, marginPercent: 38.5,
  },

  {
    id: "DEAL-010",
    name: "Hotel Boutique San Miguel \u2014 12 Bathrooms",
    contactName: "Alejandro Vega",
    contactCompany: "Grupo Hotelero Vega",
    contactRole: "Hospitality Designer",
    value: 870000,
    currency: "MXN",
    stage: "ordering",
    probability: 100,
    expectedClose: "2026-04-05",
    assignedRep: "Roger",
    products: "TOTO Neorest, Brizo Odin, California Faucets Rincon Bay, Kohler Purist",
    createdAt: "2026-02-10T08:00:00Z",
    notes: "Boutique hotel \u2014 12 bathrooms. Custom installment plan (3 payments). Staggered ordering across 4 brands.",
    projectType: "Boutique Hotel",
    leadSource: "Showroom Walk-in",
    followUpDate: "2026-04-08",
    customerType: "trade",
    dealCurrency: "MXN",
    taxRate: 16,
    paymentStructure: "custom",
    deliveryStrategy: "as-available",
    deliveryAddress: "Calle Ancha de San Antonio 15, San Miguel de Allende",
    fulfillmentStage: "pos-placed",
    lineItems: [
      { id: "LI-010", productName: "Neorest NX2 Intelligent Toilet", sku: "MS903CUMFG#01", brand: "TOTO", quantity: 12, dealerCost: 18000, quotedPrice: 28000, msrp: 35000, shippingCost: 3000, leadTime: "4-6 weeks", status: "current", marginAmount: 10000, marginPercent: 35.7 },
      { id: "LI-011", productName: "Odin Pull-Down Faucet", sku: "63075LF-PC", brand: "Brizo", finish: "Polished Chrome", quantity: 12, dealerCost: 8500, quotedPrice: 14000, msrp: 16500, shippingCost: 800, leadTime: "3-4 weeks", status: "current", marginAmount: 5500, marginPercent: 39.3 },
      { id: "LI-012", productName: "Rincon Bay Wall Mount", sku: "RB-WM-SN", brand: "California Faucets", finish: "Satin Nickel", quantity: 12, dealerCost: 5500, quotedPrice: 9500, msrp: 11000, shippingCost: 600, leadTime: "4-5 weeks", status: "current", marginAmount: 4000, marginPercent: 42.1 },
      { id: "LI-013", productName: "Purist Widespread Faucet", sku: "K-14406-4-CP", brand: "Kohler", finish: "Polished Chrome", quantity: 12, dealerCost: 6000, quotedPrice: 10500, msrp: 12500, shippingCost: 500, leadTime: "2-3 weeks", status: "current", marginAmount: 4500, marginPercent: 42.9 },
    ],
    payments: [
      { id: "PAY-010", type: "installment", invoiceId: "CC-INV-2026-003A", amount: 290000, currency: "MXN", stripeFees: 10443, netReceived: 279557, status: "paid", dueDate: "2026-03-20", paidDate: "2026-03-22", installmentNumber: 1 },
      { id: "PAY-011", type: "installment", invoiceId: "CC-INV-2026-003B", amount: 290000, currency: "MXN", status: "sent", dueDate: "2026-04-20", installmentNumber: 2 },
      { id: "PAY-012", type: "installment", invoiceId: "CC-INV-2026-003C", amount: 290000, currency: "MXN", status: "draft", dueDate: "2026-05-20", installmentNumber: 3 },
    ],
    purchaseOrders: [
      {
        id: "CC-PO-2026-010", dealId: "DEAL-010", brand: "TOTO", manufacturerName: "TOTO USA",
        items: [{ sku: "MS903CUMFG#01", productName: "Neorest NX2 Intelligent Toilet", quantity: 12, dealerCost: 18000 }],
        totalAmount: 216000, currency: "MXN", status: "confirmed", sentDate: "2026-03-25", confirmedDate: "2026-03-26",
        shipTo: "cc-showroom", estimatedShipDate: "2026-04-25",
      },
      {
        id: "CC-PO-2026-011", dealId: "DEAL-010", brand: "Brizo", manufacturerName: "Brizo / Delta Faucet",
        items: [{ sku: "63075LF-PC", productName: "Odin Pull-Down Faucet", finish: "Polished Chrome", quantity: 12, dealerCost: 8500 }],
        totalAmount: 102000, currency: "MXN", status: "sent", sentDate: "2026-04-01",
        shipTo: "cc-showroom",
      },
      {
        id: "CC-PO-2026-012", dealId: "DEAL-010", brand: "California Faucets", manufacturerName: "California Faucets",
        items: [{ sku: "RB-WM-SN", productName: "Rincon Bay Wall Mount", finish: "Satin Nickel", quantity: 12, dealerCost: 5500 }],
        totalAmount: 66000, currency: "MXN", status: "draft",
        shipTo: "cc-showroom",
      },
      {
        id: "CC-PO-2026-013", dealId: "DEAL-010", brand: "Kohler", manufacturerName: "Kohler Co.",
        items: [{ sku: "K-14406-4-CP", productName: "Purist Widespread Faucet", finish: "Polished Chrome", quantity: 12, dealerCost: 6000 }],
        totalAmount: 72000, currency: "MXN", status: "draft",
        shipTo: "cc-showroom",
      },
    ],
    shipments: [],
    totalQuoted: 870000, totalDealerCost: 456000, totalShipping: 58800, totalStripeFees: 31323,
    totalCollected: 290000, totalPaidToManufacturers: 0, netMargin: 323877, marginPercent: 37.2,
  },

  {
    id: "DEAL-011",
    name: "Luis Torres \u2014 Master Bath",
    contactName: "Luis Torres",
    contactRole: "Private Client",
    value: 95000,
    currency: "MXN",
    stage: "complete",
    probability: 100,
    expectedClose: "2026-03-15",
    assignedRep: "Carlos",
    products: "Kohler Memoirs Stately Toilet, Kohler Memoirs Pedestal Sink, Kohler Purist Faucet",
    createdAt: "2026-02-20T09:00:00Z",
    notes: "Simple master bath upgrade. One brand (Kohler). Full upfront payment. Delivered and complete.",
    projectType: "Luxury Residential",
    leadSource: "WhatsApp",
    customerType: "retail",
    dealCurrency: "MXN",
    taxRate: 16,
    paymentStructure: "full-upfront",
    deliveryStrategy: "consolidate",
    deliveryDate: "2026-03-28",
    deliveryAddress: "Privada de la Aurora 8, San Miguel de Allende",
    fulfillmentStage: "complete",
    lineItems: [
      { id: "LI-020", productName: "Memoirs Stately Toilet", sku: "K-6669-0", brand: "Kohler", quantity: 1, dealerCost: 14000, quotedPrice: 25000, msrp: 30000, shippingCost: 2500, leadTime: "2-3 weeks", status: "current", marginAmount: 11000, marginPercent: 44.0 },
      { id: "LI-021", productName: "Memoirs Pedestal Sink", sku: "K-2258-8-0", brand: "Kohler", quantity: 1, dealerCost: 12000, quotedPrice: 22000, msrp: 26000, shippingCost: 2000, leadTime: "2-3 weeks", status: "current", marginAmount: 10000, marginPercent: 45.5 },
      { id: "LI-022", productName: "Purist Widespread Faucet", sku: "K-14406-4-CP", brand: "Kohler", finish: "Polished Chrome", quantity: 1, dealerCost: 6000, quotedPrice: 10000, msrp: 12500, shippingCost: 500, leadTime: "2-3 weeks", status: "current", marginAmount: 4000, marginPercent: 40.0 },
    ],
    payments: [
      { id: "PAY-020", type: "full", invoiceId: "CC-INV-2026-005", amount: 95000, currency: "MXN", stripeFees: 3423, netReceived: 91577, status: "paid", dueDate: "2026-03-10", paidDate: "2026-03-10" },
    ],
    purchaseOrders: [
      {
        id: "CC-PO-2026-020", dealId: "DEAL-011", brand: "Kohler", manufacturerName: "Kohler Co.",
        items: [
          { sku: "K-6669-0", productName: "Memoirs Stately Toilet", quantity: 1, dealerCost: 14000 },
          { sku: "K-2258-8-0", productName: "Memoirs Pedestal Sink", quantity: 1, dealerCost: 12000 },
          { sku: "K-14406-4-CP", productName: "Purist Widespread Faucet", finish: "Polished Chrome", quantity: 1, dealerCost: 6000 },
        ],
        totalAmount: 32000, currency: "MXN", status: "received", sentDate: "2026-03-11", confirmedDate: "2026-03-11",
        paymentToMfr: { date: "2026-03-12", amount: 32000, method: "credit-card", reference: "CC-7823" },
        shipTo: "cc-showroom", trackingCarrier: "FedEx", trackingNumber: "456789012345",
        receivedDate: "2026-03-25", receivedCondition: "good",
      },
    ],
    shipments: [
      {
        id: "SHIP-020", dealId: "DEAL-011", poId: "CC-PO-2026-020", brand: "Kohler", carrier: "FedEx", trackingNumber: "456789012345",
        status: "delivered-to-customer", shipDate: "2026-03-18", estimatedArrival: "2026-03-25", actualArrival: "2026-03-25", destination: "cc-showroom",
        items: [
          { sku: "K-6669-0", productName: "Memoirs Stately Toilet", quantity: 1 },
          { sku: "K-2258-8-0", productName: "Memoirs Pedestal Sink", quantity: 1 },
          { sku: "K-14406-4-CP", productName: "Purist Widespread Faucet", quantity: 1 },
        ],
        inspectionStatus: "passed",
      },
    ],
    totalQuoted: 95000, totalDealerCost: 32000, totalShipping: 5000, totalStripeFees: 3423,
    totalCollected: 95000, totalPaidToManufacturers: 32000, netMargin: 54577, marginPercent: 57.4,
  },

  {
    id: "DEAL-012",
    name: "Diana Reyes \u2014 Guest Bathroom",
    contactName: "Diana Reyes",
    contactRole: "Private Client",
    value: 68000,
    currency: "MXN",
    stage: "post-delivery-issue",
    probability: 100,
    expectedClose: "2026-03-20",
    assignedRep: "Roger",
    products: "Brizo Litze Faucet, TOTO Drake Toilet, California Faucets Tiburon Shower",
    createdAt: "2026-02-25T11:00:00Z",
    notes: "Guest bath remodel. TOTO shipment arrived damaged. Cal Faucets Tiburon in Matte Black discontinued after quote \u2014 replacement quoted. Balance overdue 12 days.",
    projectType: "Luxury Residential",
    leadSource: "Referral",
    followUpDate: "2026-04-02",
    customerType: "retail",
    dealCurrency: "MXN",
    taxRate: 16,
    paymentStructure: "fifty-fifty",
    deliveryStrategy: "consolidate",
    deliveryAddress: "Calle Correo 18, San Miguel de Allende",
    fulfillmentStage: "issue",
    lineItems: [
      { id: "LI-030", productName: "Litze Single Handle Faucet", sku: "65035LF-NK", brand: "Brizo", finish: "Brilliance Luxe Nickel", quantity: 1, dealerCost: 12000, quotedPrice: 20000, msrp: 24000, shippingCost: 1200, leadTime: "3-4 weeks", status: "current", marginAmount: 8000, marginPercent: 40.0 },
      { id: "LI-031", productName: "Drake Elongated Toilet", sku: "CST776CEG#01", brand: "TOTO", quantity: 1, dealerCost: 10000, quotedPrice: 17000, msrp: 20000, shippingCost: 2500, leadTime: "2-3 weeks", status: "current", marginAmount: 7000, marginPercent: 41.2 },
      { id: "LI-032", productName: "Tiburon Shower Trim (DISCONTINUED)", sku: "TIB-SHT-MB", brand: "California Faucets", finish: "Matte Black", quantity: 1, dealerCost: 8000, quotedPrice: 31000, msrp: 35000, shippingCost: 1500, leadTime: "N/A", status: "discontinued", marginAmount: 23000, marginPercent: 74.2 },
    ],
    payments: [
      { id: "PAY-030", type: "deposit", invoiceId: "CC-INV-2026-008A", amount: 34000, currency: "MXN", stripeFees: 1227, netReceived: 32773, status: "paid", dueDate: "2026-03-05", paidDate: "2026-03-06" },
      { id: "PAY-031", type: "balance", invoiceId: "CC-INV-2026-008B", amount: 34000, currency: "MXN", status: "overdue", dueDate: "2026-03-25" },
    ],
    purchaseOrders: [
      {
        id: "CC-PO-2026-030", dealId: "DEAL-012", brand: "Brizo", manufacturerName: "Brizo / Delta Faucet",
        items: [{ sku: "65035LF-NK", productName: "Litze Single Handle Faucet", finish: "Brilliance Luxe Nickel", quantity: 1, dealerCost: 12000 }],
        totalAmount: 12000, currency: "MXN", status: "received", sentDate: "2026-03-07", confirmedDate: "2026-03-08",
        paymentToMfr: { date: "2026-03-08", amount: 12000, method: "wire", reference: "TRF-2026-0308" },
        shipTo: "cc-showroom", receivedDate: "2026-03-22", receivedCondition: "good",
      },
      {
        id: "CC-PO-2026-031", dealId: "DEAL-012", brand: "TOTO", manufacturerName: "TOTO USA",
        items: [{ sku: "CST776CEG#01", productName: "Drake Elongated Toilet", quantity: 1, dealerCost: 10000 }],
        totalAmount: 10000, currency: "MXN", status: "issue", sentDate: "2026-03-07", confirmedDate: "2026-03-07",
        paymentToMfr: { date: "2026-03-08", amount: 10000, method: "credit-card", reference: "CC-9102" },
        shipTo: "cc-showroom", receivedDate: "2026-03-20", receivedCondition: "damaged", receivedNotes: "Bowl cracked during transit. Carrier claim filed.",
      },
    ],
    shipments: [
      {
        id: "SHIP-030", dealId: "DEAL-012", poId: "CC-PO-2026-030", brand: "Brizo", carrier: "FedEx", trackingNumber: "111222333444",
        status: "delivered-to-cc", shipDate: "2026-03-14", actualArrival: "2026-03-22", destination: "cc-showroom",
        items: [{ sku: "65035LF-NK", productName: "Litze Single Handle Faucet", quantity: 1 }],
        inspectionStatus: "passed",
      },
      {
        id: "SHIP-031", dealId: "DEAL-012", poId: "CC-PO-2026-031", brand: "TOTO", carrier: "UPS", trackingNumber: "555666777888",
        status: "delivered-to-cc", shipDate: "2026-03-12", actualArrival: "2026-03-20", destination: "cc-showroom",
        items: [{ sku: "CST776CEG#01", productName: "Drake Elongated Toilet", quantity: 1 }],
        inspectionStatus: "damaged", inspectionNotes: "Bowl cracked during transit. Carrier claim filed. Replacement ordered.",
      },
    ],
    totalQuoted: 68000, totalDealerCost: 30000, totalShipping: 5200, totalStripeFees: 2454,
    totalCollected: 34000, totalPaidToManufacturers: 22000, netMargin: 30346, marginPercent: 44.6,
  },
];

export const SAMPLE_ACTIVITIES: ActivityItem[] = [
  {
    id: "ACT-001",
    type: "deal",
    description: "Proposal sent to Hotel Rosewood \u2014 $2.4M MXN bath renovation",
    contactName: "James Mitchell",
    rep: "Roger",
    timestamp: "2026-03-29T11:00:00Z",
    dealId: "DEAL-001",
  },
  {
    id: "ACT-002",
    type: "lead",
    description: "New lead from Instagram \u2014 interested in copper basins",
    contactName: "Ana Rodriguez",
    rep: "",
    timestamp: "2026-03-28T16:00:00Z",
    contactId: "LEAD-003",
  },
  {
    id: "ACT-003",
    type: "call",
    description: "Follow-up call \u2014 discussed kitchen remodel timeline",
    contactName: "Roberto Sanchez",
    rep: "Roger",
    timestamp: "2026-03-28T14:00:00Z",
    dealId: "DEAL-003",
  },
  {
    id: "ACT-004",
    type: "meeting",
    description: "Showroom visit \u2014 selected Kohler + California Faucets suite",
    contactName: "Linda Chen",
    rep: "Carlos",
    timestamp: "2026-03-25T10:00:00Z",
    dealId: "DEAL-002",
  },
  {
    id: "ACT-005",
    type: "email",
    description: "Sent trade program catalog and application form",
    contactName: "Patricia Hoffman",
    rep: "Carlos",
    timestamp: "2026-03-27T15:00:00Z",
    contactId: "LEAD-004",
  },
  {
    id: "ACT-006",
    type: "note",
    description: "Client wants 15% bulk discount on Emtek hardware for 6-unit project",
    contactName: "David Martinez",
    rep: "Roger",
    timestamp: "2026-03-29T09:00:00Z",
    dealId: "DEAL-004",
  },
  {
    id: "ACT-007",
    type: "lead",
    description: "Showroom walk-in \u2014 interior designer browsing artisanal collection",
    contactName: "Sarah Johnson",
    rep: "",
    timestamp: "2026-03-29T15:00:00Z",
    contactId: "LEAD-008",
  },
];

export const SAMPLE_KPI = {
  totalLeads: 8,
  newLeadsThisMonth: 5,
  leadsChange: 25,
  pipelineValue: 5220000,
  pipelineChange: 18,
  dealsWon: 1,
  dealsWonValue: 320000,
  wonChange: -10,
  conversionRate: 12.5,
  conversionChange: 3.2,
  avgDealSize: 1044000,
  avgDealSizeChange: 8,
  showroomVisits: 14,
  showroomChange: 40,
  websiteVisitors: 2840,
  websiteChange: 22,
  socialFollowers: 4250,
  socialChange: 5,
};

export const SAMPLE_CAMPAIGNS: Campaign[] = [
  {
    id: "1",
    name: "Spring Collection Launch",
    status: "sent",
    openRate: 42.5,
    clickRate: 8.3,
    recipients: 2450,
    sentDate: "2026-03-15",
    type: "one-off",
  },
  {
    id: "2",
    name: "Trade Program Invitation",
    status: "sent",
    openRate: 56.2,
    clickRate: 15.1,
    recipients: 380,
    sentDate: "2026-03-10",
    type: "one-off",
  },
  {
    id: "3",
    name: "Easter Weekend Sale",
    status: "scheduled",
    openRate: 0,
    clickRate: 0,
    recipients: 3100,
    sentDate: "2026-04-02",
    type: "one-off",
  },
  {
    id: "4",
    name: "New Artisan Spotlight Series",
    status: "draft",
    openRate: 0,
    clickRate: 0,
    recipients: 0,
    sentDate: "",
    type: "warm-nurture",
    totalEmails: 5,
    currentEmail: 0,
  },
  {
    id: "5",
    name: "Q2 Architect Cold Outreach \u2014 San Miguel",
    type: "cold-outreach",
    status: "active",
    audienceType: "Architects",
    openRate: 42.5,
    clickRate: 8.3,
    replyRate: 6.1,
    recipients: 145,
    totalEmails: 5,
    currentEmail: 3,
    leadsGenerated: 6,
    sentDate: "2026-03-15",
  },
  {
    id: "6",
    name: "Developer Outreach \u2014 Queretaro",
    type: "cold-outreach",
    status: "scheduled",
    audienceType: "Developers",
    openRate: 0,
    clickRate: 0,
    replyRate: 0,
    recipients: 62,
    totalEmails: 5,
    currentEmail: 0,
    leadsGenerated: 0,
    sentDate: "2026-04-07",
  },
];
