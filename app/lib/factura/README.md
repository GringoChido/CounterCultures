# Factura (CFDI 4.0) Provider

## Chosen provider: Facturapi.io

### Comparison

| Provider | DX | Price/stamp | Sandbox | Notes |
|----------|-----|------------|---------|-------|
| **Facturapi.io** | Modern REST, excellent docs | ~$0.50 MXN | Yes | Used by most YC-style MX startups. Best DX. **Selected.** |
| Facturama | REST + SDK | ~$0.40 MXN | Yes | More enterprise, slightly older API style |
| SW Sapien | Direct PAC | Cheapest at scale | Limited | Harder DX, better for high-volume stamping |

### Decision

Facturapi.io selected for:
- Modern REST API with excellent TypeScript support
- Free sandbox for development and testing
- Simple onboarding (no PAC certification required — they handle it)
- Reasonable pricing for Counter Cultures' volume

### Integration status

- `provider.ts` exports `issueFactura()` — currently a stub that returns `{ ok: false, reason: "factura_provider_not_configured" }` when `FACTURAPI_KEY` env var is absent.
- Real integration ships in a follow-up PR after env is provisioned.
- Called from Stripe webhook success handler, never at cart submit time.
- Idempotent on `cart_session_id + sat_uuid`.

### Required env var

```
FACTURAPI_KEY=sk_test_...
```
