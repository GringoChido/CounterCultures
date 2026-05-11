/**
 * GET /api/track/[token]
 *
 * Public (no auth) endpoint that exposes a heavily-redacted view of a
 * deal so a customer can check their order status without logging in.
 * The token is the deal id today (e.g. DEAL-123) — a harder-to-guess
 * opaque token column can be added to the Pipeline sheet later and
 * this route will already work with that column if we resolve by it.
 *
 * Returns at most: project label, customer-facing milestone, ETA,
 * brand names. Never returns margins, stage internals, internal
 * notes, or pricing.
 */

import { NextResponse } from "next/server";
import { readSheet } from "@/app/lib/dashboard-sheets";
import { listMessagesForDeal } from "@/app/lib/conversation-log";

type PipelineRow = {
  id: string;
  name: string;
  company: string;
  stage: string;
  expected_close: string;
  brand_slugs: string;
  created_at: string;
  tracking_token?: string;
};

interface LineItemRow extends Record<string, string> {
  deal_id: string;
  product_name: string;
  brand: string;
  quantity: string;
  finish: string;
  sku: string;
}

// 14 internal stages → 5 customer-friendly milestones.
const MILESTONES = [
  "Order Confirmed",
  "In Production",
  "In Transit",
  "Customs Clearance",
  "Ready for Delivery",
  "Delivered",
] as const;

type Milestone = (typeof MILESTONES)[number];

const stageToMilestone = (stage: string): { milestone: Milestone; stepIndex: number } => {
  const s = (stage || "").toLowerCase();
  if (/complete|delivered/.test(s)) return { milestone: "Delivered", stepIndex: 5 };
  if (/delivery|ready/.test(s)) return { milestone: "Ready for Delivery", stepIndex: 4 };
  if (/customs|pedimento|nom/.test(s)) return { milestone: "Customs Clearance", stepIndex: 3 };
  if (/ship|transit|cleared|received/.test(s)) return { milestone: "In Transit", stepIndex: 2 };
  if (/production|ordering|order/.test(s)) return { milestone: "In Production", stepIndex: 1 };
  return { milestone: "Order Confirmed", stepIndex: 0 };
};

export const GET = async (
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) => {
  const { token } = await params;
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  try {
    const rows = await readSheet<PipelineRow>("Pipeline");
    const normalized = token.trim();
    const match = rows.find(
      (r) =>
        (r.tracking_token && r.tracking_token === normalized) ||
        r.id === normalized
    );

    if (!match) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Only expose redacted status — never value, probability, owner, notes.
    const { milestone, stepIndex } = stageToMilestone(match.stage);
    const brands = (match.brand_slugs || "")
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);

    // Fetch line items for this deal
    const allLineItems = await readSheet<LineItemRow>("Deal_Line_Items");
    const lineItems = allLineItems
      .filter((li) => li.deal_id === match.id)
      .map((li) => ({
        name: li.product_name,
        brand: li.brand,
        quantity: Number(li.quantity) || 1,
        finish: li.finish || null,
        sku: li.sku,
      }));

    // Fetch recent outbound messages (customer sees their communication history)
    let updates: Array<{ date: string; channel: string; subject: string }> = [];
    try {
      const messages = await listMessagesForDeal(match.id);
      updates = messages
        .filter((m) => m.direction === "outbound")
        .slice(-5)
        .map((m) => ({
          date: m.created_at,
          channel: m.channel,
          subject: m.subject || m.body_snippet.slice(0, 60),
        }));
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      orderId: match.id,
      projectName: match.name || match.company || "Your order",
      brands,
      currentMilestone: milestone,
      milestoneIndex: stepIndex,
      milestones: MILESTONES,
      expectedDelivery: match.expected_close || null,
      createdAt: match.created_at || null,
      lineItems,
      updates,
    });
  } catch (err) {
    console.error("[/api/track]", err);
    return NextResponse.json(
      { error: "Could not load order status" },
      { status: 500 }
    );
  }
};
