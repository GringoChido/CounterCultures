/**
 * Follow-up drip cron.
 *
 * Runs daily at 10am Mexico time (16:00 UTC). For each active deal in a
 * customer-facing stage (quote_sent, payment_pending), checks whether
 * enough time has elapsed since last outbound communication. If so,
 * sends a follow-up email and logs it to the Conversation_Log.
 *
 * Drip cadence: 48h after quote_sent, then 96h. Payment reminders: 24h, 48h.
 * Max 3 follow-ups per deal per stage to avoid spam.
 */

import { NextResponse, type NextRequest } from "next/server";
import { readSheet, appendRow } from "@/app/lib/dashboard-sheets";
import { listMessagesForDeal } from "@/app/lib/conversation-log";
import { appendMessage } from "@/app/lib/conversation-log";
import { getPreferences, applyPreferencesToSendDecision } from "@/app/lib/customer-preferences";

interface PipelineRow extends Record<string, string> {
  id: string;
  email: string;
  name: string;
  stage: string;
  stage_entered_at: string;
  locale: string;
}

interface DripConfig {
  intervals: number[];
  maxDrips: number;
  subjectEn: string;
  subjectEs: string;
  snippetEn: string;
  snippetEs: string;
}

const DRIP_STAGES: Record<string, DripConfig> = {
  quote_sent: {
    intervals: [48, 96],
    maxDrips: 2,
    subjectEn: "Following up on your quote",
    subjectEs: "Seguimiento de su cotizacion",
    snippetEn: "We wanted to check in on the quote we sent. Let us know if you have any questions.",
    snippetEs: "Queríamos dar seguimiento a la cotización que enviamos. Avísenos si tiene alguna pregunta.",
  },
  payment_pending: {
    intervals: [24, 48, 96],
    maxDrips: 3,
    subjectEn: "Payment reminder for your order",
    subjectEs: "Recordatorio de pago para su pedido",
    snippetEn: "Your order is ready to proceed once payment is received. Let us know if you need assistance.",
    snippetEs: "Su pedido está listo para proceder una vez que se reciba el pago. Avísenos si necesita ayuda.",
  },
};

const CRON_SECRET = process.env.CRON_SECRET ?? "";

export async function GET(req: NextRequest): Promise<Response> {
  const isNetlify = req.headers.get("x-netlify-scheduled") === "true";
  const authHeader = req.headers.get("authorization");
  const hasSecret = CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`;

  if (!isNetlify && !hasSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await readSheet<PipelineRow>("Pipeline");
  const now = Date.now();
  const results: Array<{ dealId: string; action: string }> = [];

  for (const row of rows) {
    const config = DRIP_STAGES[row.stage];
    if (!config || !row.email) continue;

    const stageEnteredAt = new Date(row.stage_entered_at).getTime();
    if (!Number.isFinite(stageEnteredAt)) continue;

    const hoursSinceEntry = (now - stageEnteredAt) / (1000 * 60 * 60);

    let messages: Awaited<ReturnType<typeof listMessagesForDeal>>;
    try {
      messages = await listMessagesForDeal(row.id);
    } catch {
      continue;
    }

    const outboundSinceStage = messages.filter((m) => {
      if (m.direction !== "outbound") return false;
      const msgTime = new Date(m.created_at).getTime();
      return msgTime >= stageEnteredAt;
    });

    const dripCount = outboundSinceStage.filter((m) =>
      m.template_id?.includes("drip") || m.template_id?.includes("follow_up")
    ).length;

    if (dripCount >= config.maxDrips) continue;

    const nextInterval = config.intervals[dripCount];
    if (!nextInterval || hoursSinceEntry < nextInterval) continue;

    // Avoid double-sends within 20h
    const lastOutboundTime = outboundSinceStage.length > 0
      ? Math.max(...outboundSinceStage.map((m) => new Date(m.created_at).getTime()))
      : 0;
    if (lastOutboundTime && (now - lastOutboundTime) / (1000 * 60 * 60) < 20) continue;

    // Check customer preferences
    const prefs = await getPreferences(row.email);
    if (!applyPreferencesToSendDecision(prefs, "email", "transactional")) continue;

    const locale = (row.locale as "en" | "es") || "es";
    const isEs = locale === "es";
    const subject = isEs ? config.subjectEs : config.subjectEn;
    const snippet = isEs ? config.snippetEs : config.snippetEn;

    // Log to Conversation_Log (actual email send deferred to alert dispatcher integration)
    try {
      await appendMessage({
        deal_id: row.id,
        customer_email: row.email,
        direction: "outbound",
        channel: "email",
        template_id: `drip_${row.stage}_${dripCount + 1}`,
        locale,
        subject,
        body_snippet: snippet,
        status: "queued",
      });

      await appendRow("Activity_Log", [
        `LOG-${Date.now()}`,
        "cron:follow-up-drip",
        "Follow-up Drip",
        "drip_queued",
        `Deal ${row.id}: ${row.stage} drip #${dripCount + 1} to ${row.email}`,
        new Date().toISOString(),
      ]);

      results.push({ dealId: row.id, action: `drip_${dripCount + 1}_queued` });
    } catch (err) {
      console.error(`[follow-up-drip] Failed for ${row.id}:`, err instanceof Error ? err.message : err);
      results.push({ dealId: row.id, action: "error" });
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}
