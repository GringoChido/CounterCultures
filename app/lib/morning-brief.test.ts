import { describe, it, expect } from "vitest";
import {
  generateOwnerBrief,
  type BriefDealRow,
  type BriefTraficoRow,
  type MorningBriefInput,
} from "./morning-brief";

const NOW = "2026-05-01T15:00:00.000Z";
const daysAgo = (n: number): string => {
  const d = new Date(NOW);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString();
};
const daysFromNow = (n: number): string => daysAgo(-n);

const deal = (overrides: Partial<BriefDealRow> = {}): BriefDealRow => ({
  id: "DEAL-1",
  name: "Casa Roble",
  contactName: "Acme Architects",
  stage: "discovery",
  value: 100_000,
  currency: "MXN",
  source: "referral",
  createdAt: daysAgo(2),
  stageEnteredAt: daysAgo(2),
  ...overrides,
});

const input = (
  deals: BriefDealRow[] = [],
  traficos: BriefTraficoRow[] = [],
): MorningBriefInput => ({
  generatedAt: NOW,
  user: { email: "roger@countercultures.com.mx", name: "Roger", role: "owner" },
  deals,
  traficos,
});

describe("generateOwnerBrief", () => {
  it("handles an empty pipeline cleanly", () => {
    const brief = generateOwnerBrief(input());
    expect(brief.pulse[0]).toMatchObject({ label: "Pipeline", value: "$0 MXN" });
    expect(brief.pulse[1]).toMatchObject({ label: "Won this week", value: "$0 MXN" });
    expect(brief.pulse[3]).toMatchObject({ label: "In customs", value: "0" });
    expect(brief.needsYou).toEqual([]);
    expect(brief.advanced).toEqual([]);
    expect(brief.stuck).toEqual([]);
  });

  it('"Won this week" excludes lost deals (won-vs-closed bug)', () => {
    const brief = generateOwnerBrief(
      input([
        deal({ id: "W1", stage: "won", value: 200_000, stageEnteredAt: daysAgo(1) }),
        deal({ id: "L1", stage: "lost", value: 999_999, stageEnteredAt: daysAgo(1) }),
        deal({ id: "C1", stage: "closed-lost", value: 999_999, stageEnteredAt: daysAgo(1) }),
      ]),
    );
    expect(brief.pulse[1]).toMatchObject({
      label: "Won this week",
      value: "$200,000 MXN",
      delta: "1 won",
    });
  });

  it("CFDI-question rule fires on explicit empty string only", () => {
    const brief = generateOwnerBrief(
      input([
        deal({ id: "ASK", requiresCfdi: "", createdAt: daysAgo(2) }),
        deal({ id: "ANSWERED", requiresCfdi: "yes", createdAt: daysAgo(2) }),
        deal({ id: "MISSING_COL", requiresCfdi: undefined, createdAt: daysAgo(2) }),
        deal({ id: "TOO_FRESH", requiresCfdi: "", createdAt: daysAgo(0) }),
      ]),
    );
    const labels = brief.needsYou.map((a) => a.label);
    expect(labels).toContain("Answer CFDI question on Casa Roble");
    expect(brief.needsYou.filter((a) => a.label.startsWith("Answer CFDI"))).toHaveLength(1);
  });

  it("Constancia rule requires CFDI=yes + paid deposit + no constancia", () => {
    const brief = generateOwnerBrief(
      input([
        deal({
          id: "BLOCK",
          name: "Hotel Boca",
          stage: "deposit-received",
          requiresCfdi: "yes",
          hasPaidDeposit: true,
          constanciaDriveFileId: undefined,
        }),
        deal({
          id: "OK",
          requiresCfdi: "yes",
          hasPaidDeposit: true,
          constanciaDriveFileId: "drive-abc",
        }),
        deal({
          id: "NO_DEPOSIT",
          requiresCfdi: "yes",
          hasPaidDeposit: false,
        }),
      ]),
    );
    const constancia = brief.needsYou.find((a) =>
      a.label.startsWith("Get Constancia"),
    );
    expect(constancia).toBeDefined();
    expect(constancia?.label).toBe("Get Constancia for Hotel Boca");
    expect(constancia?.severity).toBe("urgent");
    expect(brief.needsYou.filter((a) => a.label.startsWith("Get Constancia"))).toHaveLength(1);
  });

  it("Stuck SLA sorts by days-over and skips stages without an SLA", () => {
    const brief = generateOwnerBrief(
      input([
        deal({
          id: "PROP",
          name: "Slow Proposal",
          stage: "proposal-sent", // SLA 10
          stageEnteredAt: daysAgo(15), // 5d over
        }),
        deal({
          id: "PROD",
          name: "Long Production",
          stage: "in-production", // SLA 21
          stageEnteredAt: daysAgo(50), // 29d over
        }),
        deal({
          id: "TARGET",
          name: "No SLA Stage",
          stage: "target-identified", // no SLA
          stageEnteredAt: daysAgo(60),
        }),
      ]),
    );
    expect(brief.stuck.map((s) => s.label)).toEqual([
      "Long Production stuck in in-production",
      "Slow Proposal stuck in proposal-sent",
    ]);
    expect(brief.stuck[0].badge).toBe("critical"); // 29d over → critical
  });

  it("needsYou is priority-sorted before the 6-item cap", () => {
    const cfdi = (id: string) =>
      deal({ id, requiresCfdi: "", createdAt: daysAgo(3) });
    const constancia = (id: string) =>
      deal({
        id,
        name: `Block-${id}`,
        stage: "deposit-received",
        requiresCfdi: "yes",
        hasPaidDeposit: true,
      });

    // 2 CFDI questions (info), then 2 constancia blockers (urgent),
    // then 2 PO needs (warn). Cap is 6, so all fit, but order matters.
    const brief = generateOwnerBrief(
      input([
        cfdi("CFDI-A"),
        cfdi("CFDI-B"),
        constancia("BLOCK-A"),
        constancia("BLOCK-B"),
        deal({
          id: "PO-A",
          name: "PO Pending A",
          stage: "deposit-received",
          hasPaidDeposit: true,
          hasPo: false,
        }),
        deal({
          id: "PO-B",
          name: "PO Pending B",
          stage: "ordering",
          hasPaidDeposit: true,
          hasPo: false,
        }),
      ]),
    );
    expect(brief.needsYou.length).toBe(6);
    // First two should be the urgent constancia items
    expect(brief.needsYou.slice(0, 2).every((a) => a.severity === "urgent")).toBe(true);
    // Last items should be the info CFDI questions
    expect(brief.needsYou.slice(-2).every((a) => a.severity === "warn" || a.severity === "info"))
      .toBe(true);
  });

  it("Advanced surfaces deals that closed-won overnight", () => {
    const brief = generateOwnerBrief(
      input([
        deal({
          id: "JUST-WON",
          name: "Big Close",
          stage: "won",
          stageEnteredAt: daysAgo(0),
        }),
      ]),
    );
    expect(brief.advanced.map((a) => a.label)).toContain("Big Close → won");
  });

  it("Customs pulse counts open traficos and flags those over SLA", () => {
    const brief = generateOwnerBrief(
      input(
        [],
        [
          { id: "T1", traficoNumber: "TRF-1", status: "in-progress", initiatedDate: daysAgo(30) },
          { id: "T2", traficoNumber: "TRF-2", status: "in-progress", initiatedDate: daysAgo(5) },
          { id: "T3", traficoNumber: "TRF-3", status: "cleared", initiatedDate: daysAgo(40) },
        ],
      ),
    );
    expect(brief.pulse[3]).toMatchObject({
      label: "In customs",
      value: "2", // T1 + T2 open; T3 cleared
      delta: "1 over 21d", // T1 only (initiated 30d ago)
    });
  });
});
