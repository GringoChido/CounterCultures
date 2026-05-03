/**
 * Customer marketing segments (R4 Note 8).
 *
 * Roger: "drop the contact into a marketing bucket SEGMENTED by
 * builder / designer / end home user — each gets different marketing."
 *
 * The Leads sheet already has a finer-grained contact_type field
 * (Homeowner, Architect, Interior Designer, Builder/Contractor,
 * Developer, Hotel/Hospitality, Trade Program, Other). For marketing
 * we collapse those into three buckets — derived by default, but
 * overridable via a marketing_segment field on the lead/customer if
 * Roger wants to flip someone manually.
 */

export type CustomerSegment = "builder" | "designer" | "end-user" | "unclassified";

export interface CustomerSegmentMeta {
  label: string;
  description: string;
}

export const CUSTOMER_SEGMENT_META: Record<CustomerSegment, CustomerSegmentMeta> = {
  builder: {
    label: "Builder",
    description:
      "Builders, contractors, developers, hospitality groups — repeat buyers across multi-unit projects.",
  },
  designer: {
    label: "Designer",
    description:
      "Architects + interior designers — spec-driven, brand-curious, value early access to new lines.",
  },
  "end-user": {
    label: "End user",
    description:
      "Homeowners outfitting their own space — once-or-twice cycle, high-touch service window.",
  },
  unclassified: {
    label: "Unclassified",
    description: "No segment set yet. Pick one to enroll the contact in segment-specific marketing.",
  },
};

export const CUSTOMER_SEGMENTS: CustomerSegment[] = [
  "builder",
  "designer",
  "end-user",
  "unclassified",
];

/**
 * Derive the marketing segment from the finer-grained contact_type. If
 * Roger has overridden the segment explicitly on the row, prefer that
 * (use {@link effectiveSegment}); this helper only handles the auto path.
 */
export const bucketFromContactType = (
  contactType: string | undefined | null
): CustomerSegment => {
  const t = (contactType ?? "").trim().toLowerCase();
  if (!t) return "unclassified";
  if (
    t.includes("builder") ||
    t.includes("contractor") ||
    t.includes("developer") ||
    t.includes("hotel") ||
    t.includes("hospitality") ||
    t.includes("trade")
  ) {
    return "builder";
  }
  if (t.includes("architect") || t.includes("designer")) {
    return "designer";
  }
  if (t.includes("homeowner") || t === "end-user" || t === "end user") {
    return "end-user";
  }
  return "unclassified";
};

/**
 * Resolve the segment Roger should treat as authoritative for marketing.
 * Explicit override wins; otherwise we derive from contact_type.
 */
export const effectiveSegment = (input: {
  marketingSegment?: string | null;
  contactType?: string | null;
}): CustomerSegment => {
  const explicit = (input.marketingSegment ?? "").trim().toLowerCase();
  if ((CUSTOMER_SEGMENTS as string[]).includes(explicit)) {
    return explicit as CustomerSegment;
  }
  return bucketFromContactType(input.contactType);
};

/**
 * Normalize a raw segment string from the sheet to a valid value, or
 * "unclassified" if blank/unknown. Use for reading.
 */
export const normalizeSegment = (raw: string | undefined | null): CustomerSegment => {
  const v = (raw ?? "").trim().toLowerCase();
  if ((CUSTOMER_SEGMENTS as string[]).includes(v)) return v as CustomerSegment;
  return "unclassified";
};
