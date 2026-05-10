# Counter Cultures — Communication Matrix

Every stage transition can fire up to 3 messages: one to the customer, one to Roger, one to finance.
All sends route through `dispatchAlertsForTransition`. All sends log to `Conversation_Log`.

## New customer templates (add to `ALERT_TEMPLATES` in `app/lib/email-templates.ts`)

| ID   | Trigger                        | EN subject                       | ES subject                       | Channels        |
|------|--------------------------------|----------------------------------|----------------------------------|-----------------|
| C-12 | cart_submitted (quote)         | We've received your selections   | Hemos recibido tu seleccion      | email + whatsapp|
| C-13 | payment_initiated              | Complete your purchase           | Completa tu compra               | email           |
| C-14 | payment_received               | Payment confirmed — order in motion | Pago confirmado — pedido en marcha | email + whatsapp |
| C-15 | cart_abandoned (24h)           | You left some pieces behind      | Dejaste algunas piezas atras     | email only      |
| C-16 | review_window_open (+7d)       | How is the experience?           | Como ha sido la experiencia?     | email + whatsapp|
| C-17 | vendor_shipped                 | Your order has shipped           | Tu pedido fue enviado            | email + whatsapp|
| C-18 | in_transit → at_customs        | Crossing the border              | En cruce fronterizo              | email           |
| C-19 | at_warehouse                   | Arrived at our San Miguel warehouse | Llego a nuestro almacen       | email + whatsapp|
| C-20 | delivery_scheduled             | Delivery scheduled               | Entrega agendada                 | email + whatsapp|
| C-21 | delivered                      | Delivered — welcome home         | Entregado — bienvenido a casa    | email + whatsapp|
| C-22 | factura_issued                 | Your SAT factura is ready        | Tu factura SAT esta lista        | email + attachment |

## New Roger templates

| ID   | Trigger                        | EN subject                                  | Channels         |
|------|--------------------------------|---------------------------------------------|------------------|
| R-15 | cart_submitted                 | New cart from {customer_name} — {total}     | email + whatsapp + dashboard |
| R-16 | payment_received               | Payment received: {customer_name} {total}   | whatsapp + dashboard |
| R-17 | cart_abandoned (24h)           | Abandoned cart: {customer_name} {total}     | dashboard        |
| R-18 | customer_replied               | New reply from {customer_name}              | email + whatsapp |
| R-19 | review_received (manual flag)  | New review: {rating} — {customer_name}      | email            |

## New finance templates

| ID   | Trigger                        | EN subject                                  | Channels         |
|------|--------------------------------|---------------------------------------------|------------------|
| F-08 | payment_received (cart origin) | Cart purchase recorded — invoice {invoice_id} | email + dashboard |
| F-09 | factura_issued                 | Factura emitted: {factura_uuid}             | dashboard        |

## Routing table additions (extend `ALERT_ROUTES`)

Each new rule ID maps to its audiences:

```ts
"T-15": {
  customer: { templateId: "C-12", channels: ["email", "whatsapp"] },
  roger:    { templateId: "R-15", channels: ["email", "whatsapp", "dashboard"] },
},
"T-16": {
  customer: { templateId: "C-13", channels: ["email"] },
},
"T-17": {
  customer: { templateId: "C-14", channels: ["email", "whatsapp"] },
  roger:    { templateId: "R-16", channels: ["whatsapp", "dashboard"] },
  finance:  { templateId: "F-08", channels: ["email", "dashboard"] },
},
"T-18": {
  customer: { templateId: "C-15", channels: ["email"] },
  roger:    { templateId: "R-17", channels: ["dashboard"] },
},
"T-19": {
  customer: { templateId: "C-16", channels: ["email", "whatsapp"] },
},
```

## Channel preference rules

A customer's `Customer_Preferences` row gates channel selection per send:

- `email_opt_in = false` → email never sent to this customer.
- `whatsapp_opt_in = false` → WhatsApp never sent.
- `channel_preference = "email"` → only email sent even when both are technically eligible.
- `channel_preference = "whatsapp"` → only WhatsApp sent.
- `channel_preference = "both"` → both sent (default).
- `unsubscribed_at IS NOT NULL` → no marketing/non-transactional sends. Transactional (payment receipts, delivery updates, factura) still go through.
- `locale` → overrides the deal's locale for rendering.

Quiet-hours, rate-limit, idempotency are applied AFTER preference filtering by existing infrastructure.

## Transactional vs marketing classification

Each template carries a `category: "transactional" | "marketing"` field (NEW on `AlertTemplate`).
Unsubscribe blocks marketing but NEVER transactional.

| Template | Category |
|----------|----------|
| C-12 cart received (quote) | transactional |
| C-13 complete purchase | transactional |
| C-14 payment confirmed | transactional |
| C-15 cart abandoned | marketing |
| C-16 review request | marketing |
| C-17..C-22 order updates | transactional |
| C-08 quote follow-up (existing) | marketing |
| C-09 review request (existing) | marketing |
