/**
 * Trafico → Deal bridge. When a Trafico's status crosses a customs-phase
 * boundary, write the corresponding date field on every linked Deal, then
 * fire the rule engine with a `trafico_status_change` trigger.
 *
 * Boundaries (per design §4.4):
 *   sent-to-broker       → writes date_at_border        → T-07 fires
 *   crossing-approved    → writes date_customs_cleared  → T-08 fires
 *
 * Called from:
 *   - PUT /api/dashboard/traficos           (full-replacement update)
 *   - PATCH /api/dashboard/traficos/[id]    (partial update from bulk UI)
 */

import { readSheet } from "./dashboard-sheets";
import { evaluateAndTransition, writePipelineFields } from "./rule-engine";

const todayIsoDate = (): string => new Date().toISOString().split("T")[0];

/**
 * Returns the list of linked Deal IDs for a Trafico, by joining through
 * Trafico_Items.Deal_ID.
 */
const findLinkedDealIds = async (trfId: string): Promise<string[]> => {
  const items = await readSheet<{ TRF_ID: string; Deal_ID: string }>(
    "Trafico_Items"
  );
  return [
    ...new Set(
      items
        .filter((i) => i.TRF_ID === trfId)
        .map((i) => i.Deal_ID)
        .filter((id): id is string => !!id && id.length > 0)
    ),
  ];
};

export const onTraficoStatusChange = async (
  trfId: string,
  fromStatus: string,
  toStatus: string,
  actor: string
): Promise<void> => {
  if (!toStatus || toStatus === fromStatus) return;

  const dealIds = await findLinkedDealIds(trfId);
  if (dealIds.length === 0) return;

  const bridgeField: Record<string, string> | null =
    toStatus === "sent-to-broker"
      ? { date_at_border: todayIsoDate() }
      : toStatus === "crossing-approved"
        ? { date_customs_cleared: todayIsoDate() }
        : null;

  for (const dealId of dealIds) {
    if (bridgeField) {
      try {
        await writePipelineFields(dealId, bridgeField);
      } catch (err) {
        console.error(
          `[trafico-bridge] writePipelineFields failed for ${dealId}:`,
          err
        );
        // Continue — the rule-engine tick below will still fire with payload.
      }
    }

    await evaluateAndTransition(
      "trafico_status_change",
      dealId,
      {
        trafico_id: trfId,
        from_status: fromStatus,
        to_status: toStatus,
        ...(bridgeField ?? {}),
      },
      actor
    ).catch((err) => {
      console.error(
        `[trafico-bridge] rule engine failed for ${dealId}:`,
        err
      );
    });
  }
};
