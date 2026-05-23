/**
 * Shared fixtures for rule-engine unit tests. Keeps _test-rule-engine.ts
 * compact and lets future rule additions reuse the same `mkDeal` / `mkContext`.
 */

import type {
  PipelineDeal,
  PipelineStage,
} from "../app/lib/sample-dashboard-data";
import type { StageRuleTrigger, StageRuleContext } from "../app/lib/stage-rules";

export const mkDeal = (overrides: Partial<PipelineDeal> = {}): PipelineDeal => ({
  id: overrides.id ?? "DEAL-TEST",
  name: overrides.name ?? "Test Deal",
  contactName: overrides.contactName ?? "Test Contact",
  value: overrides.value ?? 250_000,
  currency: overrides.currency ?? "MXN",
  stage: overrides.stage ?? "deposit-pending",
  probability: overrides.probability ?? 80,
  expectedClose: overrides.expectedClose ?? "2026-06-30",
  assignedRep: overrides.assignedRep ?? "Roger",
  products: overrides.products ?? "",
  createdAt: overrides.createdAt ?? "2026-04-01T00:00:00Z",
  notes: overrides.notes ?? "",
  stageEnteredAt: overrides.stageEnteredAt ?? "2026-04-15T00:00:00Z",
  requiresCustoms: overrides.requiresCustoms, // undefined = default import flow
  ...overrides,
});

export const mkContext = (
  deal: PipelineDeal,
  trigger: StageRuleTrigger,
  payload: Record<string, unknown>,
  overrides: Partial<StageRuleContext> = {}
): StageRuleContext => ({
  deal,
  event: {
    trigger,
    payload,
    actor: "test@countercultures.com.mx",
  },
  payments: overrides.payments ?? [],
  purchaseOrders: overrides.purchaseOrders ?? [],
  trafico: overrides.trafico,
});

// Silence TS 'unused export' warnings when imported via dynamic import.
export const __testingOnly = true;
