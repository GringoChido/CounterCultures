/**
 * Stage-automation rule registry — 14 declarative rules per
 * docs/superpowers/specs/2026-04-20-week7-pipeline-automation-design.md §4
 *
 * Each rule is a pure object. Predicates read ctx.deal, ctx.event.payload,
 * ctx.trafico, ctx.payments, ctx.purchaseOrders. No I/O inside a predicate.
 *
 * Multi-trigger rules get multiple entries that share an id prefix but
 * differ in the trigger suffix (e.g. T-07a-deal-field vs T-07b-trafico).
 * The matcher runs the first rule whose trigger, fromStages, and predicate
 * all agree for the current event.
 */

import type {
  PipelineDeal,
  PipelineStage,
  PaymentStructure,
  DealPayment,
  PurchaseOrder,
} from "./sample-dashboard-data";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const PREMOVE_THRESHOLD_MXN = 500_000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StageRuleTrigger =
  | "deal_field_update"      // a Deal field was written (e.g. date_at_border)
  | "trafico_status_change"  // a Trafico transitioned to a new status
  | "stripe_payment"         // Stripe webhook confirmed a payment
  | "doc_attached"           // doc uploaded + attached to deal
  | "manual"                 // explicit user action ("Mark Approved")
  | "nightly_sweep";         // cron-driven

export interface StageRuleContext {
  deal: PipelineDeal;
  event: {
    trigger: StageRuleTrigger;
    payload: Record<string, unknown>;
    actor: string;
  };
  payments: DealPayment[];
  purchaseOrders: PurchaseOrder[];
  trafico?: unknown; // hydrated Trafico if trigger is trafico_status_change
}

export interface StageRule {
  id: string;
  fromStages: PipelineStage[];
  toStage: PipelineStage;
  trigger: StageRuleTrigger;
  predicate: (ctx: StageRuleContext) => boolean;
  slaDays: { green: number | "brand"; yellow: number | "brand"; red: number | "brand" };
}

// ---------------------------------------------------------------------------
// Rule definitions — ordered; matcher uses first match
// ---------------------------------------------------------------------------

const importRequiredStages: PipelineStage[] = ["shipping"];
const customsRequiredStages: PipelineStage[] = ["in-customs"];

export const STAGE_RULES: StageRule[] = [
  // ---------------------------------------------------------------- T-01
  {
    id: "T-01a-manual-approved",
    fromStages: ["verbal-yes", "closed-won", "won"],
    toStage: "quote-approved",
    trigger: "manual",
    predicate: (ctx) => ctx.event.payload.quote_approved === true,
    slaDays: { green: 14, yellow: 17, red: 21 },
  },
  {
    id: "T-01b-signed-quote-doc",
    fromStages: ["verbal-yes", "closed-won", "won"],
    toStage: "quote-approved",
    trigger: "doc_attached",
    predicate: (ctx) => ctx.event.payload.doc_type === "signed_quote",
    slaDays: { green: 14, yellow: 17, red: 21 },
  },

  // ---------------------------------------------------------------- T-02
  {
    id: "T-02-deposit-cfdi",
    fromStages: ["quote-approved"],
    toStage: "deposit-pending",
    trigger: "doc_attached",
    predicate: (ctx) => ctx.event.payload.doc_type === "deposit_cfdi",
    slaDays: { green: 2, yellow: 3, red: 5 },
  },

  // ---------------------------------------------------------------- T-03
  {
    id: "T-03-deposit-received",
    fromStages: ["deposit-pending"],
    toStage: "deposit-received",
    trigger: "stripe_payment",
    predicate: (ctx) => ctx.event.payload.allocated_to === "deposit",
    slaDays: { green: 7, yellow: 10, red: 14 },
  },

  // ---------------------------------------------------------------- T-04
  {
    id: "T-04-po-attached",
    fromStages: ["deposit-received"],
    toStage: "ordering",
    trigger: "doc_attached",
    predicate: (ctx) => ctx.event.payload.doc_type === "purchase_order",
    slaDays: { green: 3, yellow: 5, red: 7 },
  },

  // ---------------------------------------------------------------- T-05
  {
    id: "T-05-production-confirmed",
    fromStages: ["ordering"],
    toStage: "in-production",
    trigger: "deal_field_update",
    predicate: (ctx) => typeof ctx.event.payload.production_eta_date === "string" &&
      (ctx.event.payload.production_eta_date as string).length > 0,
    slaDays: { green: 3, yellow: 5, red: 7 },
  },

  // ---------------------------------------------------------------- T-06
  {
    id: "T-06-shipped",
    fromStages: ["in-production"],
    toStage: "shipping",
    trigger: "deal_field_update",
    predicate: (ctx) =>
      typeof ctx.event.payload.tracking_number === "string" &&
      (ctx.event.payload.tracking_number as string).length > 0 &&
      typeof ctx.event.payload.date_shipped_origin === "string" &&
      (ctx.event.payload.date_shipped_origin as string).length > 0,
    slaDays: { green: "brand", yellow: "brand", red: "brand" },
  },

  // ---------------------------------------------------------------- T-07
  {
    id: "T-07a-at-border-field",
    fromStages: importRequiredStages,
    toStage: "in-customs",
    trigger: "deal_field_update",
    predicate: (ctx) =>
      ctx.deal.requiresCustoms !== false &&
      typeof ctx.event.payload.date_at_border === "string" &&
      (ctx.event.payload.date_at_border as string).length > 0,
    slaDays: { green: "brand", yellow: "brand", red: "brand" },
  },
  {
    id: "T-07b-trafico-at-broker",
    fromStages: importRequiredStages,
    toStage: "in-customs",
    trigger: "trafico_status_change",
    predicate: (ctx) =>
      ctx.deal.requiresCustoms !== false &&
      ctx.event.payload.to_status === "sent-to-broker",
    slaDays: { green: "brand", yellow: "brand", red: "brand" },
  },

  // ---------------------------------------------------------------- T-08
  {
    id: "T-08a-cleared-field",
    fromStages: customsRequiredStages,
    toStage: "customs-cleared",
    trigger: "deal_field_update",
    predicate: (ctx) =>
      typeof ctx.event.payload.date_customs_cleared === "string" &&
      (ctx.event.payload.date_customs_cleared as string).length > 0,
    slaDays: { green: "brand", yellow: "brand", red: "brand" },
  },
  {
    id: "T-08b-trafico-crossing-approved",
    fromStages: customsRequiredStages,
    toStage: "customs-cleared",
    trigger: "trafico_status_change",
    predicate: (ctx) => ctx.event.payload.to_status === "crossing-approved",
    slaDays: { green: "brand", yellow: "brand", red: "brand" },
  },

  // ---------------------------------------------------------------- T-09
  // customs-cleared → received (default import path)
  // AND shipping → received (domestic skip path — requiresCustoms === false)
  {
    id: "T-09a-received-at-cc",
    fromStages: ["customs-cleared"],
    toStage: "received",
    trigger: "deal_field_update",
    predicate: (ctx) =>
      typeof ctx.event.payload.date_received_at_cc === "string" &&
      (ctx.event.payload.date_received_at_cc as string).length > 0,
    slaDays: { green: 3, yellow: 5, red: 7 },
  },
  {
    id: "T-09b-domestic-skip",
    fromStages: ["shipping"],
    toStage: "received",
    trigger: "deal_field_update",
    predicate: (ctx) =>
      ctx.deal.requiresCustoms === false &&
      typeof ctx.event.payload.date_received_at_cc === "string" &&
      (ctx.event.payload.date_received_at_cc as string).length > 0,
    slaDays: { green: 3, yellow: 5, red: 7 },
  },

  // ---------------------------------------------------------------- T-10
  {
    id: "T-10-scheduled",
    fromStages: ["received"],
    toStage: "delivery-scheduled",
    trigger: "deal_field_update",
    predicate: (ctx) =>
      typeof ctx.event.payload.scheduled_delivery_datetime === "string" &&
      (ctx.event.payload.scheduled_delivery_datetime as string).length > 0,
    slaDays: { green: 5, yellow: 7, red: 10 },
  },

  // ---------------------------------------------------------------- T-11
  {
    id: "T-11-pod-attached",
    fromStages: ["delivery-scheduled"],
    toStage: "delivered",
    trigger: "doc_attached",
    predicate: (ctx) =>
      ctx.event.payload.doc_type === "pod" &&
      typeof ctx.event.payload.date_delivered === "string" &&
      (ctx.event.payload.date_delivered as string).length > 0,
    slaDays: { green: 2, yellow: 3, red: 5 },
  },

  // ---------------------------------------------------------------- T-12
  {
    id: "T-12-balance-cfdi",
    fromStages: ["delivered"],
    toStage: "balance-pending",
    trigger: "doc_attached",
    predicate: (ctx) => {
      const structure = ctx.deal.paymentStructure as PaymentStructure | undefined;
      return (
        ctx.event.payload.doc_type === "balance_cfdi" &&
        structure === "fifty-fifty"
      );
    },
    slaDays: { green: 2, yellow: 3, red: 5 },
  },

  // ---------------------------------------------------------------- T-13
  {
    id: "T-13-final-payment",
    fromStages: ["balance-pending"],
    toStage: "complete",
    trigger: "stripe_payment",
    predicate: (ctx) =>
      ctx.event.payload.allocated_to === "balance" ||
      ctx.event.payload.allocated_to === "full",
    slaDays: { green: 14, yellow: 21, red: 30 },
  },

  // ---------------------------------------------------------------- T-14
  // Sidebar issue flag: nightly_sweep only, hard thresholds only.
  // Per spec §Transition 14, most Issue moves are manual — only the
  // critical thresholds (customs hold > 7d, FX > 8%, payment > 30d past due)
  // auto-flag via the nightly sweep.
  {
    id: "T-14-critical-customs-hold",
    fromStages: ["in-customs"],
    toStage: "post-delivery-issue",
    trigger: "nightly_sweep",
    predicate: (ctx) => {
      const d = ctx.event.payload.customs_hold_days;
      return typeof d === "number" && d > 7;
    },
    slaDays: { green: 0, yellow: 0, red: 0 },
  },
];
