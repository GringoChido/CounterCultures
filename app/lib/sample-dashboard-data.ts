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
  | "won" | "lost";

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
