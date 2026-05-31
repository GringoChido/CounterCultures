import { describe, it, expect } from "vitest";

// ── Product card badge composition logic ───────────────────────────────
// Tests the decision logic for which badges appear on a product card,
// extracted as pure functions from the card components.

interface BadgeInput {
  inShowroom?: boolean;
  projectCount?: number;
}

/** Whether the badge row should render at all */
const shouldShowBadgeRow = (input: BadgeInput): boolean => {
  const showSpec = (input.projectCount ?? 0) >= 2;
  const showShowroom = input.inShowroom === true;
  return showSpec || showShowroom;
};

/** Ordered list of badge types to render */
const badgesToRender = (
  input: BadgeInput
): Array<"showroom" | "specified"> => {
  const badges: Array<"showroom" | "specified"> = [];
  if (input.inShowroom === true) badges.push("showroom");
  if ((input.projectCount ?? 0) >= 2) badges.push("specified");
  return badges;
};

// ── Badge composition tests ────────────────────────────────────────────

describe("Product card badge composition", () => {
  it("shows ShowroomBadge when inShowroom=true", () => {
    const badges = badgesToRender({ inShowroom: true });
    expect(badges).toContain("showroom");
  });

  it("shows SpecifiedBadge when projectCount=5", () => {
    const badges = badgesToRender({ projectCount: 5 });
    expect(badges).toContain("specified");
  });

  it("shows both badges when both signals present, showroom first", () => {
    const badges = badgesToRender({ inShowroom: true, projectCount: 3 });
    expect(badges).toEqual(["showroom", "specified"]);
  });

  it("shows no badge row when neither signal present", () => {
    expect(shouldShowBadgeRow({})).toBe(false);
    expect(shouldShowBadgeRow({ inShowroom: false })).toBe(false);
    expect(shouldShowBadgeRow({ projectCount: 0 })).toBe(false);
    expect(shouldShowBadgeRow({ projectCount: 1 })).toBe(false);
  });

  it("shows badge row when only inShowroom is true", () => {
    expect(shouldShowBadgeRow({ inShowroom: true })).toBe(true);
  });

  it("shows badge row when projectCount >= 2", () => {
    expect(shouldShowBadgeRow({ projectCount: 2 })).toBe(true);
    expect(shouldShowBadgeRow({ projectCount: 10 })).toBe(true);
  });

  it("does not show specified badge for projectCount=1", () => {
    const badges = badgesToRender({ projectCount: 1 });
    expect(badges).not.toContain("specified");
  });

  it("handles undefined signals gracefully", () => {
    expect(shouldShowBadgeRow({ inShowroom: undefined, projectCount: undefined })).toBe(false);
    expect(badgesToRender({ inShowroom: undefined, projectCount: undefined })).toEqual([]);
  });
});
