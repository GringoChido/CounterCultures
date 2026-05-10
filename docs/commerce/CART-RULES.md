# Counter Cultures — Commerce Rules of Record

Source: Cart, Lifecycle, and Customer Communication OS prompt, 2026.
This file is canonical. Every Claude session touching cart, checkout, sale-order, lifecycle, or customer communication must read it before editing.

## Cart semantics

1. The cart is the conception of a sale. Every cart submission creates a Deal in Pipeline at stage `cart_submitted`.
2. Cart store: zustand + localStorage at key `cc_cart_v1`. Migrate `cc_project_list_v1` once on first read.
3. Each line item: SKU, name, brand, finish (selected), qty, list price, optional trade price, optional notes, availability, buyable flag, image, link to PDP.
4. Mixed-mode carts default to QUOTE path on checkout.
5. Currency mismatches blocked at cart level. Single currency per cart.
6. No inventory reservation in v1. Stock is informational.
7. `cartSessionId` (UUID) is the device-session anchor; persists across cart submissions until cart cleared.

## Pricing

8. Default displayed price is `listPrice`. `tradePrice` displays only when a valid `Trade_Code` is applied.
9. Trade codes live in `Trade_Codes` sheet. Server validates.
10. IVA 16% applies when ship-to country is Mexico. Computed server-side. Shown as distinct line.
11. Shipping is "We'll quote shipping after order review" in v1.

## Checkout paths

12. Four-step stepper: Contact → Ship-to → Project details → Review.
13. Buy path: all items `buyable=true` AND `availability !== "quote_only"` AND total < threshold → Stripe Checkout (multi-line).
14. Quote path: everything else → Pipeline deal + tracker URL. SLA: "formal quote within 24 hours."
15. Cart mirrored server-side in `Cart_Sessions` sheet.

## State machine

16. Every stage transition flows through `rule-engine.evaluateAndTransition`. No direct writes to `Pipeline.stage`.
17. `StageRuleTrigger` is a closed union; new triggers must extend the type.
18. Idempotent on `(dealId, target_stage)`. Re-firing is a no-op.
19. Rollback window: 24 hours via existing `rule-engine.rollback`.
20. Terminal stages: `archived`, `cancelled`, `refunded`, `lost`, `abandoned`. `on_hold` is pause, not terminal.

## Sale-order creation

21. Successful Stripe `checkout.session.completed` with `metadata.kind === "cart_purchase"` triggers `createQuote` → Odoo SO → `confirmAndInvoiceOrder` → safeguarded `registerPayment`.
22. Idempotent on `cart_session_id`. Never double-create.

## Communication

23. Every customer-facing message flows through `dispatchAlertsForTransition` (or `dispatchCustomerMessage` which reuses the same primitives). NEVER call `sendEmail` or `sendWhatsAppTemplate` directly from a cart/checkout/order route.
24. Every send logs to `Conversation_Log`. Inbound and outbound. Email, WhatsApp, dashboard.
25. Channel selection gated by `Customer_Preferences` (email_opt_in, whatsapp_opt_in, channel_preference, locale).
26. Marketing templates respect `unsubscribed_at`. Transactional templates do NOT.
27. Quiet hours: 22:00→08:00 America/Mexico_City for `audience=customer`. Queued via `Notifications.deliver_after`.
28. Rate limits: WhatsApp 1/h, email 5/d, dashboard 100/h per (recipient, template, channel).
29. Idempotency: 6h dedup window via `Deal_Events.alert_fired` lookup.

## Inbound

30. Customer email replies route via Gmail watcher → `Email_Activity` (existing) + `Conversation_Log` mirror.
31. Customer WhatsApp messages route via `/api/whatsapp/webhook` → match by phone → `Conversation_Log` + Notes (entity=deal) + R-18 alert.
32. Customer "Ask a question" from tracker URL → `/api/track/[token]/message` → Conversation_Log + R-18.
33. All inbound surfaces in the dashboard Conversation Panel on the deal detail page.

## Tracker URL = customer command center

34. The HMAC-signed tracker URL (`app/lib/quote-token.ts`) is the customer's single access point.
35. Four tabs: Status, Messages, Preferences, Details.
36. No customer accounts in v1. Token is the identity.

## Templates

37. All customer-facing templates are bilingual (EN + ES) and live in `ALERT_TEMPLATES`.
38. WhatsApp template sends require Meta-approved template names. Templates without `metaTemplateName` skip WhatsApp at dispatch time.
39. Templates carry `category: "transactional" | "marketing"` — unsubscribe blocks marketing only.

## Operational

40. Every mutating cart/checkout/lifecycle route logs to `Activity_Log` with actor (email or `guest:<cart_session_id>` or `system`).
41. Every mutating action feature-gated where appropriate via `useFeatures()`.
42. SSR-safe reads: cart store via `useSyncExternalStore` or `mounted` guard.

## Out of v1 scope

43. Customer accounts. Saved addresses/payment methods.
44. Live shipping rates. Inventory hold.
45. Per-finish SKU pricing.
46. Promo codes (non-trade). Gift cards. Subscriptions.
47. SMS channel. AI auto-reply.
