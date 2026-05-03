/**
 * Segment-specific marketing sequence templates (R4 Note 8 — sub-gap 8e).
 *
 * Roger: each marketing bucket (builder / designer / end home user)
 * gets different marketing. Generic copy was the previous default —
 * this module replaces it with three flavors per outreach type, so
 * a builder doesn't get the same email a homeowner does.
 *
 * Selection: pickSequence(type, segment) resolves the right variant.
 * If the segment doesn't have a tailored variant yet, it falls back to
 * the default (legacy) sequence so nothing breaks.
 *
 * Voice notes per segment:
 *   builder   — repeat-buyer framing, multi-unit, lead-time + import
 *               reliability are the value props
 *   designer  — spec-driven, brand-curious, early access to new lines
 *   end-user  — once-or-twice cycle, high-touch service, care + life
 */

import type { CustomerSegment } from "./customer-segments";

export type CampaignType = "cold-outreach" | "warm-nurture" | "one-off";

export interface SequenceStep {
  step: number;
  subject: string;
  delay: string;
  description: string;
}

const COLD_DEFAULT: SequenceStep[] = [
  { step: 1, subject: "Introduction — {Company} + Counter Cultures", delay: "Day 0", description: "Introduce Counter Cultures and our artisanal collections. Mention a specific project or interest relevant to their work." },
  { step: 2, subject: "A project that might inspire — {RecentProject}", delay: "Day 3", description: "Share a relevant case study or recent project. Include 1-2 product images that match their specialty." },
  { step: 3, subject: "Quick question about {TheirProject}", delay: "Day 7", description: "Ask a specific question about their current projects. Offer a showroom visit or catalog." },
  { step: 4, subject: "Trade pricing now available for {Company}", delay: "Day 14", description: "Introduce the trade program and exclusive pricing. Include application link." },
  { step: 5, subject: "Last note — open invite to our showroom", delay: "Day 21", description: "Final touchpoint. Open invite to visit the showroom in San Miguel. Include upcoming events if any." },
];

const COLD_BUILDER: SequenceStep[] = [
  { step: 1, subject: "Specs that survive — {Company} build pipeline", delay: "Day 0", description: "Lead with reliability and import lead times. Builders care about whether the order lands on the framing schedule, not whether the finish is trendy." },
  { step: 2, subject: "How we ship for {RecentProject}-scale jobs", delay: "Day 3", description: "Case study: a multi-unit project Counter Cultures supplied. Highlight on-time landed costs, USMCA handling, and consolidated delivery." },
  { step: 3, subject: "Trade pricing for repeat orders — {Company}", delay: "Day 7", description: "Trade program framed for repeat use: volume tiers, single-PO across brands, NET terms once approved." },
  { step: 4, subject: "Inventory we hold for SMA jobs", delay: "Day 14", description: "Quick tour of stock items in the SMA bodega — what's available same-week vs. import lead times. Builders need predictability." },
  { step: 5, subject: "Standing line — direct to Roger", delay: "Day 21", description: "Final touch: direct WhatsApp + email to Roger for any future build. Builders don't browse, they ping." },
];

const COLD_DESIGNER: SequenceStep[] = [
  { step: 1, subject: "Specs your clients haven't seen yet — {Company}", delay: "Day 0", description: "Lead with brand exclusivity. Designers want what their clients can't already pin from Pinterest. Mention a brand they probably don't carry yet." },
  { step: 2, subject: "Behind the spec — {Brand} at {RecentProject}", delay: "Day 3", description: "Editorial-style breakdown of how a brand was specced into a recent project. Include finish detail shots, not just hero photos." },
  { step: 3, subject: "Material samples for your library", delay: "Day 7", description: "Offer a complimentary sample box. Most designers maintain a material library — Counter Cultures gets a slot." },
  { step: 4, subject: "Trade program — pricing + first-look access", delay: "Day 14", description: "Trade program framed for designers: NET terms + first access to new collections + named contact." },
  { step: 5, subject: "Showroom visit — coffee + new arrivals", delay: "Day 21", description: "Open invite to visit the SMA showroom. Frame as a curated walkthrough, not a sales meeting." },
];

const COLD_ENDUSER: SequenceStep[] = [
  { step: 1, subject: "Hi from Counter Cultures — your project, simply", delay: "Day 0", description: "Warm intro. End users are usually one-or-twice buyers — frame the relationship as long-term service, not a transaction." },
  { step: 2, subject: "What we recommend for your space", delay: "Day 3", description: "Personal note suggesting 2-3 product paths based on the inquiry. No catalog dumps — curated like a friend would." },
  { step: 3, subject: "How install + delivery works", delay: "Day 7", description: "Demystify the process: lead times, install support, who they'll talk to. End users worry about the unknowns more than the products." },
  { step: 4, subject: "A short note from another homeowner", delay: "Day 14", description: "One short testimonial from a recent end-user project. Specific and modest — no hype." },
  { step: 5, subject: "Open invitation — drop by the showroom", delay: "Day 21", description: "Final touch. Visit framed as low-pressure: see, touch, leave. Mention coffee." },
];

const WARM_DEFAULT: SequenceStep[] = [
  { step: 1, subject: "Welcome to Counter Cultures", delay: "Day 0", description: "Welcome email with brand story, showroom photos, and what to expect from the newsletter." },
  { step: 2, subject: "Meet our artisans — {ArtisanName}", delay: "Day 5", description: "Feature an artisan or brand partner. Show the process behind the products." },
  { step: 3, subject: "New arrivals you'll love", delay: "Day 12", description: "Curated product spotlight based on their browsing or purchase history." },
  { step: 4, subject: "Design tips: {Topic}", delay: "Day 20", description: "Educational content — design tips, material care guides, or trend reports." },
  { step: 5, subject: "Exclusive preview — {Collection}", delay: "Day 30", description: "Early access or exclusive preview of new collection. Create urgency." },
];

const WARM_BUILDER: SequenceStep[] = [
  { step: 1, subject: "Quarterly stock + lead-time update", delay: "Day 0", description: "Tactical update for builders: what's in the SMA bodega, what's on the boat, what's coming. The single most useful email Roger can send a contractor." },
  { step: 2, subject: "New trade pricing tier — {Volume}", delay: "Day 5", description: "Volume-tier pricing change announcement. Includes recalculated landed costs for popular SKUs." },
  { step: 3, subject: "Brands we just added — {Brand}", delay: "Day 12", description: "New brand partner intro framed for builders: who specs it, lead time, USMCA status." },
  { step: 4, subject: "Project recap — {RecentProject}", delay: "Day 20", description: "Multi-unit project recap with timeline, total order value, what worked, what to do differently. Builders learn from concrete numbers." },
  { step: 5, subject: "Next-quarter forecast — what's landing", delay: "Day 30", description: "Forward-looking: what's arriving next quarter, where bottlenecks are. Helps builders schedule." },
];

const WARM_DESIGNER: SequenceStep[] = [
  { step: 1, subject: "New collection access — {Collection}", delay: "Day 0", description: "First-look at a new collection before public launch. Include hi-res images and finish swatches." },
  { step: 2, subject: "Behind the design — {ArtisanName}", delay: "Day 5", description: "Editorial profile of an artisan partner. Process, material, story — content designers can pass along to clients." },
  { step: 3, subject: "Spec sheets + tear sheets refreshed", delay: "Day 12", description: "Updated PDF spec sheets for popular SKUs. Designers spec, so make spec'ing easy." },
  { step: 4, subject: "Showroom event — {Event}", delay: "Day 20", description: "Invite to a curated showroom event (artisan visit, brand launch). Designers value access." },
  { step: 5, subject: "Material library refresh — request samples", delay: "Day 30", description: "Quarterly material library refresh — order new samples free of charge." },
];

const WARM_ENDUSER: SequenceStep[] = [
  { step: 1, subject: "How is your space treating you?", delay: "Day 0", description: "Check-in tone, not sales tone. Genuinely ask how the install is performing." },
  { step: 2, subject: "Care + maintenance for your {ProductCategory}", delay: "Day 5", description: "Care guide tailored to what they bought. Practical, not promotional." },
  { step: 3, subject: "If you're considering the next phase", delay: "Day 12", description: "Soft mention of complementary products for adjacent rooms. End users often phase projects." },
  { step: 4, subject: "A homeowner story — {ProjectName}", delay: "Day 20", description: "Lifestyle-leaning project feature, designer or other homeowner." },
  { step: 5, subject: "Anniversary check-in", delay: "Day 30", description: "Mark the anniversary of their install. Friendly, no ask. Often surfaces the next project." },
];

export interface SequenceTemplateMeta {
  type: CampaignType;
  segment: CustomerSegment | "default";
  sequence: SequenceStep[];
  description: string;
}

const REGISTRY: SequenceTemplateMeta[] = [
  // cold-outreach
  { type: "cold-outreach", segment: "default",   sequence: COLD_DEFAULT,  description: "Generic 5-email cold sequence." },
  { type: "cold-outreach", segment: "builder",   sequence: COLD_BUILDER,  description: "Lead with reliability + lead-time. Builders care about predictability." },
  { type: "cold-outreach", segment: "designer",  sequence: COLD_DESIGNER, description: "Lead with brand exclusivity + first-look access." },
  { type: "cold-outreach", segment: "end-user",  sequence: COLD_ENDUSER,  description: "Warm, service-led — end users are once-or-twice buyers." },
  // warm-nurture
  { type: "warm-nurture",  segment: "default",   sequence: WARM_DEFAULT,  description: "Generic 5-email nurture sequence." },
  { type: "warm-nurture",  segment: "builder",   sequence: WARM_BUILDER,  description: "Tactical updates, stock + lead times, project recaps." },
  { type: "warm-nurture",  segment: "designer",  sequence: WARM_DESIGNER, description: "Editorial + spec sheets + showroom events + samples." },
  { type: "warm-nurture",  segment: "end-user",  sequence: WARM_ENDUSER,  description: "Care guides + soft anniversary touch + lifestyle stories." },
];

/**
 * Resolve the sequence for (type, segment). Falls back to the default
 * variant when no tailored copy exists for that combo.
 */
export const pickSequence = (
  type: CampaignType,
  segment: CustomerSegment | "default" | undefined
): SequenceStep[] => {
  if (type === "one-off") return [];
  const seg = segment ?? "default";
  const match = REGISTRY.find((r) => r.type === type && r.segment === seg);
  if (match) return match.sequence;
  const fallback = REGISTRY.find((r) => r.type === type && r.segment === "default");
  return fallback?.sequence ?? [];
};

export const sequenceMeta = (
  type: CampaignType,
  segment: CustomerSegment | "default" | undefined
): SequenceTemplateMeta | null => {
  const seg = segment ?? "default";
  return REGISTRY.find((r) => r.type === type && r.segment === seg) ?? null;
};
