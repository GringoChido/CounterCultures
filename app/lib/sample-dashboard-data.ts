// Sample data for development when Google Sheets is not configured

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
}

export interface PipelineDeal {
  id: string;
  name: string;
  contactName: string;
  value: number;
  currency: string;
  stage: "discovery" | "proposal" | "negotiation" | "closed-won" | "closed-lost";
  probability: number;
  expectedClose: string;
  assignedRep: string;
  products: string;
  createdAt: string;
  notes: string;
}

export interface ActivityItem {
  id: string;
  type: "call" | "email" | "meeting" | "note" | "deal" | "lead";
  description: string;
  contactName: string;
  rep: string;
  timestamp: string;
}

export const SAMPLE_LEADS: Lead[] = [
  {
    id: "LEAD-001",
    name: "María García",
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
    notes: "Boutique hotel renovation — 12 bathrooms. Looking at TOTO and Kohler.",
    projectType: "Hospitality",
    budget: "$2,400,000 MXN",
  },
  {
    id: "LEAD-003",
    name: "Ana Rodríguez",
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
    notes: "Architect — submitted trade application. Working on Casa Luna project.",
    projectType: "Residential New Build",
    budget: "$500,000 MXN",
  },
  {
    id: "LEAD-005",
    name: "Roberto Sánchez",
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
    notes: "Purchased full master bath suite — Kohler + California Faucets. Delivery scheduled.",
    projectType: "Residential Renovation",
    budget: "$320,000 MXN",
  },
  {
    id: "LEAD-007",
    name: "David Martínez",
    email: "david@construmex.com",
    phone: "+52 415 444 5555",
    source: "Website Contact Form",
    status: "contacted",
    assignedRep: "Roger",
    score: 60,
    createdAt: "2026-03-22T10:00:00Z",
    updatedAt: "2026-03-29T09:00:00Z",
    notes: "Builder — 6-unit condo project. Wants bulk pricing on Emtek hardware.",
    projectType: "Multi-Unit Development",
    budget: "$1,200,000 MXN",
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
    notes: "Interior designer — browsed artisanal collection. Wants catalog.",
    projectType: "Design Firm",
    budget: "TBD",
  },
];

export const SAMPLE_PIPELINE: PipelineDeal[] = [
  {
    id: "DEAL-001",
    name: "Hotel Rosewood — Bath Renovation",
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
  },
  {
    id: "DEAL-002",
    name: "Chen Residence — Master Bath",
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
  },
  {
    id: "DEAL-003",
    name: "Cocinas Gourmet — Kitchen Remodel",
    contactName: "Roberto Sánchez",
    value: 800000,
    currency: "MXN",
    stage: "discovery",
    probability: 40,
    expectedClose: "2026-05-15",
    assignedRep: "Roger",
    products: "BLANCO Silgranit, Brizo Artesso",
    createdAt: "2026-03-12T11:00:00Z",
    notes: "Needs site visit to confirm specs.",
  },
  {
    id: "DEAL-004",
    name: "Construmex Condos — Hardware Package",
    contactName: "David Martínez",
    value: 1200000,
    currency: "MXN",
    stage: "negotiation",
    probability: 60,
    expectedClose: "2026-06-01",
    assignedRep: "Roger",
    products: "Emtek Modern Rectangular, Sun Valley Bronze",
    createdAt: "2026-03-22T10:00:00Z",
    notes: "Negotiating bulk pricing. Wants 15% off retail.",
  },
  {
    id: "DEAL-005",
    name: "Casa Luna — Full Spec",
    contactName: "Patricia Hoffman",
    value: 500000,
    currency: "MXN",
    stage: "discovery",
    probability: 30,
    expectedClose: "2026-07-01",
    assignedRep: "Carlos",
    products: "TBD — awaiting architectural plans",
    createdAt: "2026-03-20T09:00:00Z",
    notes: "Architect wants to visit showroom with client.",
  },
];

export const SAMPLE_ACTIVITIES: ActivityItem[] = [
  {
    id: "ACT-001",
    type: "deal",
    description: "Proposal sent to Hotel Rosewood — $2.4M MXN bath renovation",
    contactName: "James Mitchell",
    rep: "Roger",
    timestamp: "2026-03-29T11:00:00Z",
  },
  {
    id: "ACT-002",
    type: "lead",
    description: "New lead from Instagram — interested in copper basins",
    contactName: "Ana Rodríguez",
    rep: "",
    timestamp: "2026-03-28T16:00:00Z",
  },
  {
    id: "ACT-003",
    type: "call",
    description: "Follow-up call — discussed kitchen remodel timeline",
    contactName: "Roberto Sánchez",
    rep: "Roger",
    timestamp: "2026-03-28T14:00:00Z",
  },
  {
    id: "ACT-004",
    type: "meeting",
    description: "Showroom visit — selected Kohler + California Faucets suite",
    contactName: "Linda Chen",
    rep: "Carlos",
    timestamp: "2026-03-25T10:00:00Z",
  },
  {
    id: "ACT-005",
    type: "email",
    description: "Sent trade program catalog and application form",
    contactName: "Patricia Hoffman",
    rep: "Carlos",
    timestamp: "2026-03-27T15:00:00Z",
  },
  {
    id: "ACT-006",
    type: "note",
    description: "Client wants 15% bulk discount on Emtek hardware for 6-unit project",
    contactName: "David Martínez",
    rep: "Roger",
    timestamp: "2026-03-29T09:00:00Z",
  },
  {
    id: "ACT-007",
    type: "lead",
    description: "Showroom walk-in — interior designer browsing artisanal collection",
    contactName: "Sarah Johnson",
    rep: "",
    timestamp: "2026-03-29T15:00:00Z",
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
