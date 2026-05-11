# Counter Cultures — Deal Lifecycle State Machine

Every Deal moves through one of three paths. Every stage transition is logged to `Deal_Events`.

## Stages (extend `PipelineStage` enum to include all of these)

| #  | Stage                | Path        | SLA      | Stalled alert |
|----|----------------------|-------------|----------|---------------|
| 1  | cart_submitted       | both        | 24h      | R-15          |
| 2  | quote_drafting       | quote       | 24h      | R-15-stalled  |
| 3  | quote_sent           | quote       | 3d → 7d  | C-08 / R-04   |
| 4  | quote_accepted       | quote       | —        | —             |
| 5  | payment_pending      | buy + quote | 1h       | R-16-stalled  |
| 6  | payment_received     | both        | —        | —             |
| 7  | order_confirmed      | both        | —        | —             |
| 8  | vendor_po_placed     | both        | brand-aware (Brand_Lead_Times) | R-08-stalled |
| 9  | vendor_shipped       | both        | brand-aware | R-09-stalled |
| 10 | in_transit           | both        | brand-aware | R-10-stalled |
| 11 | at_customs           | both intl.  | 5d       | R-11-stalled  |
| 12 | at_warehouse         | both        | 14d      | R-12-stalled  |
| 13 | delivery_scheduled   | both        | —        | —             |
| 14 | delivered            | both        | —        | —             |
| 15 | factura_issued       | both        | 7d after delivery | F-08-stalled |
| 16 | review_requested     | both        | 7d after delivered | — |
| 17 | archived             | both (term) | —        | —             |
| —  | cancelled            | both (term) | —        | —             |
| —  | refunded             | both (term) | —        | —             |
| —  | on_hold              | both (pause)| —        | —             |
| —  | lost                 | quote (term)| —        | —             |
| —  | abandoned            | cart (term) | —        | —             |

## Allowed transitions

Forward path is encoded in `STAGE_RULES` (T-15..T-19 NEW + T-01..T-14 existing).
Backward / sideways transitions allowed: any → `cancelled`, `refunded`, `on_hold`. From `on_hold` → previous stage.
Hard rule: `archived` is terminal. No transitions out.

## Triggers (`StageRuleTrigger` union — extend)

| Trigger value          | Source                                      |
|------------------------|---------------------------------------------|
| deal_field_update      | existing                                    |
| trafico_status_change  | existing                                    |
| stripe_payment         | existing                                    |
| doc_attached           | existing                                    |
| manual                 | existing                                    |
| nightly_sweep          | existing                                    |
| **cart_submitted**     | NEW — `/api/checkout/quote` and `/api/checkout/buy` POST |
| **payment_initiated**  | NEW — Stripe `checkout.session.created`     |
| **delivery_confirmed** | NEW — manual dashboard action               |
| **review_window_open** | NEW — daily cron, +7d after `delivered`     |

## Idempotency

Every transition is idempotent on `(dealId, target_stage)`. Re-firing `cart_submitted` on a Deal already at `cart_submitted` is a no-op (existing `evaluateAndTransition` handles this via `current_stage` check).
