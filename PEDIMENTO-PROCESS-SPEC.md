# PEDIMENTO PROCESS — Full Spec & Dashboard Automation Plan

**Date:** April 7, 2026
**Status:** Process Mapping + Automation Design
**Context:** Every US-origin product Counter Cultures sells must clear Mexican customs via the Pedimento process. This is currently a manual, offline workflow with zero dashboard visibility.
**Based on:** Real import crossing from Feb 20-23, 2026 (Tráfico E27-26, Pedimento 26 240 3482-6101796)

---

## THE PROBLEM

The existing dashboard treats customs as a **single status label** (`"customs"`) in the Shipment Tracker. In reality, the Pedimento is a **10+ step subprocess** involving a customs broker, multiple documents, tax payments, and compliance requirements — any of which can stall a deal for days or weeks.

**What exists today:**

```
Shipment status enum:
  "label-created" → "in-transit" → "customs" → "out-for-delivery" → "delivered-to-cc"
                                      ↑
                          This is ONE status.
                          The actual process has 10+ steps inside it.
```

**What actually happens inside "customs":** see below.

---

## THE FULL PEDIMENTO PROCESS (AS-IS)

This process kicks in after a PO is shipped from a US manufacturer and needs to cross the Mexican border.

```
TRIGGER: Vendor sends invoice with order number + tracking number
         (product is in transit to the Mexican border)

┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: RECEIVE VENDOR INVOICE + TRACKING                     │
│                                                                 │
│  Vendor confirms order and sends:                               │
│    • Invoice (with order number, tracking #, itemized costs)    │
│    • Estimated ship dates                                       │
│    • Carrier info                                               │
│                                                                 │
│  CC Action: Log invoice, tracking, and ETA in dashboard         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: SEND INVOICE TO CUSTOMS BROKER                        │
│                                                                 │
│  CC sends the vendor invoice to the broker at the border        │
│  (currently done manually — email/WhatsApp)                     │
│                                                                 │
│  Documents sent:                                                │
│    • Vendor invoice (PDF)                                       │
│    • Packing list (if separate)                                 │
│    • Any prior correspondence about the order                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: DETERMINE COUNTRY OF ORIGIN                           │
│                                                                 │
│  Broker needs to know where the product was MANUFACTURED        │
│  (not just where it shipped from)                               │
│                                                                 │
│  Origin determines duty treatment:                              │
│    • USA → USMCA/T-MEC eligible (reduced or zero duties)       │
│    • Canada → USMCA/T-MEC eligible                             │
│    • China → Full import duties apply                           │
│    • Other → Depends on trade agreements                        │
│                                                                 │
│  ⚠️ KEY INSIGHT: A product shipped from a US warehouse          │
│     may have been manufactured in China. The ORIGIN matters,    │
│     not the shipping address.                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: USMCA / NAFTA CERTIFICATE CHECK                       │
│                                                                 │
│  IF origin is US or Canada:                                     │
│    → Need a USMCA certificate (formerly NAFTA)                  │
│                                                                 │
│  Decision tree:                                                 │
│    ├── Already on file? (broker or CC has it from prior import) │
│    │   └── YES → Use existing certificate ✓                    │
│    │                                                            │
│    ├── Existing credit with broker for this product/brand?      │
│    │   └── YES → Apply credit, no new cert needed ✓            │
│    │                                                            │
│    └── NO cert on file, no credit                               │
│        └── Request certificate from vendor                      │
│            └── Vendor provides USMCA cert or letter of origin   │
│                                                                 │
│  ⚠️ BOTTLENECK: Some vendors are slow to provide USMCA certs.  │
│     This can delay the entire crossing by days/weeks.           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 5: SPANISH MANUAL / DOCUMENTATION CHECK                  │
│                                                                 │
│  Mexican customs may require product manuals in Spanish.        │
│                                                                 │
│  Decision tree:                                                 │
│    ├── Vendor provides Spanish manuals?                         │
│    │   └── YES → Send to broker ✓                              │
│    │                                                            │
│    └── NO (most US vendors don't)                               │
│        └── CC must create Spanish manuals                       │
│            • Translate product manual to Spanish                 │
│            • Add Counter Cultures branding                      │
│            • Send branded Spanish manual to broker               │
│                                                                 │
│  ⚠️ THIS IS A RECURRING COST/EFFORT: Once created for a        │
│     product/SKU, the Spanish manual should be stored and        │
│     reused for future imports of the same product.              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 6: BROKER SENDS CÁLCULO (TAX ESTIMATE)                   │
│                                                                 │
│  Once the broker has all documents, they calculate:             │
│    • Import duties (based on origin + HS code)                  │
│    • IVA (16% Mexican tax)                                      │
│    • DTA (customs processing fee)                               │
│    • Any other applicable taxes/fees                            │
│                                                                 │
│  Broker sends the Cálculo to CC for approval + payment          │
│                                                                 │
│  CC Action: Review cálculo, approve, prepare payment            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 7: PAY CUSTOMS TAXES + TRUCK CROSSING FEE                │
│                                                                 │
│  TWO separate payments:                                         │
│    1. Cálculo amount (duties + taxes) → paid to broker          │
│    2. Truck crossing fee → separate fee for physical crossing   │
│                                                                 │
│  ⚠️ FINANCIAL IMPACT: These costs affect deal margin.           │
│     Must be tracked per-deal in the P&L calculation.            │
│     Currently NOT included in the Finance Dashboard.            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 8: PRODUCT APPROVED TO CROSS                             │
│                                                                 │
│  After payment clears, customs approves the crossing.           │
│  Product is released and transported across the border.         │
│                                                                 │
│  Product goes to: Tres Guerras Shipping                         │
│  (Mexican domestic shipping company for last-mile to SMA)       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 9: DOMESTIC TRACKING (TRES GUERRAS)                      │
│                                                                 │
│  Broker provides new tracking info from Tres Guerras            │
│  for the Mexico-side leg of the shipment                        │
│                                                                 │
│  This is a DIFFERENT carrier/tracking # than the US leg         │
│  (FedEx/UPS to border → Tres Guerras to SMA)                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 10: BROKER SENDS FINAL FACTURA                           │
│                                                                 │
│  A few days after crossing, broker sends:                       │
│    • Final invoice/factura (actual costs, may differ from       │
│      cálculo estimate)                                          │
│    • This is the official tax document for CC's books           │
│                                                                 │
│  CC Action: Reconcile factura vs. cálculo estimate              │
│             Record final import cost in deal P&L                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 11: BROKER SENDS EXPEDIENTE                              │
│                                                                 │
│  The Expediente is the complete customs case file.              │
│  Requires signatures from CC.                                   │
│                                                                 │
│  Contains: all import documents, customs declarations,          │
│  proof of payment, origin certificates, etc.                    │
│                                                                 │
│  CC Action: Review, e-sign, return to broker (DIGITAL process)  │
│             Store copy in Google Drive under deal folder         │
│                                                                 │
│  ⚠️ LEGAL REQUIREMENT: Must be retained for 5+ years           │
│     per Mexican customs law (SAT compliance)                    │
│                                                                 │
│  ✅ FULLY AUTOMATABLE: Digital signatures mean the dashboard    │
│     can handle the entire expediente workflow end-to-end.       │
└─────────────────────────────────────────────────────────────────┘
```

---

## WHERE THIS SITS IN THE EXISTING PIPELINE

The Pedimento process lives **inside the fulfillment stage**, specifically between `"shipping"` and `"received-at-cc"`. Here's the corrected flow:

```
CURRENT PIPELINE (simplified):
  pos-placed → in-production → shipping → [BLACK BOX] → received-at-cc → delivered

ACTUAL PIPELINE (with Pedimento):
  pos-placed → in-production → shipped-from-vendor
       │
       ▼
  ┌─ in-transit-to-border (US carrier: FedEx/UPS)
  │
  ├─ at-broker (invoice sent to customs broker)
  │
  ├─ origin-check (determining country of origin)
  │
  ├─ awaiting-documents (USMCA cert, Spanish manuals, etc.)
  │
  ├─ calculo-received (tax estimate from broker)
  │
  ├─ customs-payment-pending (waiting for CC to pay taxes)
  │
  ├─ customs-paid (payment confirmed, awaiting release)
  │
  ├─ crossing-approved (cleared to cross border)
  │
  ├─ in-transit-domestic (Tres Guerras: border → SMA)
  │
  ├─ factura-received (final invoice from broker)
  │
  ├─ expediente-pending (case file needs signatures)
  │
  └─ pedimento-complete (all customs docs closed)
       │
       ▼
  received-at-cc → quality-checked → delivery-scheduled → delivered
```

**Key insight:** The existing `DealShipment` tracks ONE carrier/tracking number. The Pedimento process involves TWO legs with different carriers:

1. **US Leg:** FedEx/UPS from manufacturer → Mexican border
2. **Mexico Leg:** Tres Guerras from border → San Miguel de Allende

---

## REAL-WORLD CASE STUDY: Tráfico E27-26 (Feb 20-23, 2026)

This section reconstructs an actual import crossing from the documents and email thread provided by Roger. This is the ground truth that the dashboard must model.

### The Players

| Role | Name | Email | Notes |
|---|---|---|---|
| **CC Owner** | Roger Williams | roger@countercultures.com.mx | Decision maker, answers origin questions |
| **CC Bookkeeper** | Antonina Trischitta | control@countercultures.com.mx | Initiates imports, compiles invoices, sends to broker |
| **Customs Broker** | Jeanefer Contreras | jeanefer_jeco@hotmail.com | Handles all customs paperwork, sends cálculo |
| **Border Warehouse** | TGR Logistic Inc | auxiliartraficotgr@hotmail.com | 4602 Modern Lane, Laredo TX 78041, (956) 704-5008 |
| **Crossing Agent** | Lic. Carlos Enrique Garza Roque | quique73@globalpc.net | Physically handles the border crossing |
| **Broker Team** | Haydee | quique73@globalpc.net | Broker's team, cc'd on payment confirmations |

### KEY INSIGHT: Batch Crossings

**Imports are NOT one-PO-per-crossing.** Multiple vendor orders are consolidated at the TGR warehouse in Laredo, then crossed together as a single "tráfico." This crossing included 7 shipments from 4 different vendors:

### Shipments in This Crossing

| # | Vendor | Invoice | Products | USD Value | Tracking | Carrier |
|---|---|---|---|---|---|---|
| 1 | JamesLitho | — | Marketing materials | No commercial value | 01Z05F4710344289529 | — |
| 2 | Ferguson | Order #94108221 | Kohler K-2215-0 Sink ×2 (REPLACEMENT for damaged) | $582.00 | 1239 (FedEx) | FedEx from Brookshire, TX |
| 3 | JCR Distributors | INV260000100 | Pescara Faucet Matte Black + TOTO Trip Lever | $507.32 + $25.31 freight | #477646959280 | FedEx Ground |
| 4 | JCR Distributors | INV260000561 | TOTO 17×14 ADA Lavatory | $72.00 + $30.56 freight | #477646959853 | FedEx Ground |
| 5 | California Faucets | +4644937 | Shower arms, handshower, showerheads ×4, hose | $714.02 + $30.35 shipping | 1Z9128440397720910 | UPS Ground |
| 6 | Ferguson/Kohler | Order #93968242 (PO1217) | Kohler K-2215-0 ×2 + K-2214-0 ×3 sinks | $1,305.53 | 4 FedEx packages | FedEx from Brookshire |
| 7 | California Faucets | +4647694 (LATE ADD) | Showerhead Kit + Cobra Handshower ×2 | $471.83 + $41.88 shipping | 1Z9128440391322423 | UPS Ground |

**Total invoice value: ~$2,611.34 USD** (as shown on cálculo)

### Timeline

```
Jan 9      JCR invoice INV260000100 — Pescara faucet, TOTO lever (PO P01187)
Jan 30     JCR invoice INV260000561 — TOTO lavatory (PO P01222)
Jan 30     Ferguson Order #93968242 placed — Kohler sinks (PO1217)
Feb 3      California Faucets order placed (SO 2287162, PO P01224)
Feb 4      Cal Faucets ships — shower parts (UPS 1Z9128440397720910)
Feb 13     California Faucets order placed (SO 2288791, PO P01240)
Feb 17     Ferguson Order #94108221 placed — replacement sink
Feb 18     Cal Faucets ships — showerheads (UPS 1Z9128440391322423)
Feb 19     FedEx ships Ferguson sink from Brookshire, TX

Feb 20     ┌── 12:59 PM  Antonina sends ALL invoices to broker + TGR
  (Fri)    ├── 2:51 PM   Broker confirms: goods arrived at bodega (warehouse)
           ├── 2:59 PM   Roger: "replacement sink, damaged one goes to trash"
           └── 3:11 PM   Broker asks: "Shall Lic. Enrique handle the crossing?"

Feb 23     ┌── 9:25 AM   Broker asks: "Is the import closed?"
  (Mon)    ├── 10:14 AM  Roger: "Yes, close it"
           ├── 12:57 PM  Broker asks: "Where were K-2215-0 and K-2214-0 made?"
           ├── 12:59 PM  Roger: "USA"
           ├── 1:02 PM   Broker: "Send me certificate of origin"
           ├── 1:48 PM   Broker: "More items arriving — add to import? Send invoice"
           ├── 1:52 PM   Roger: "Yes! Shower heads. Getting invoice now."
           ├── 1:58 PM   Antonina sends invoice + USMCA certificate
           ├── 2:03 PM   Roger confirms
           ├── 2:08 PM   Broker: "Gracias"
           ├── 3:56 PM   Broker sends CÁLCULO ($23,065.51) + truck fee ($2,668)
           ├── 4:22 PM   Roger sends BOTH payment receipts
           └── 4:55 PM   Broker: "Gracias" ✓
```

### The Cálculo Breakdown (Actual Document)

From: TGR Logistic Inc / Lic. Carlos Enrique Garza Roque
Pedimento #: 26 240 3482-6101796

```
VALOR FACTURA (Invoice value):              $2,611.34 USD

CONVERSION TO MXN:
  TC USD CAAAREM (exchange rate):            17.3500
  Incrementables:                            $464.54
  Base P/IGIE:                               $125.25
  Flete Americano (US freight):              $104.54
  Factor Ajuste:                             3.0864494857%
  Adjusted value:                            $1,454.35
  Valor en Pesos:                            $47,120.52

VALOR EN ADUANA (Customs value):             $53,366.52 MXN

CUADRO DE CONTRIBUCIONES (Tax table):
  IGI (Ad Valorem duty):     $3.87 × 129.12  = $2,240.16
  PRV:                                         $330.00
  CNT:                                         $53.00
  DTA (customs processing):                    $426.93
  IVA (16% tax):                                $9,026.66
                                    Subtotal:  $12,076.75

CUENTA MEXICANA (Broker fees):
  Honorarios (fees):                           $2,000.00
  Complementarios:                             $1,600.00
  Prevalidación:                               $25.86
  Validación:                                  $261.00
  Sellos Fiscales:                             —
  IVA Cuenta Mexicana:                         $621.90
                                    Subtotal:  $4,508.76

CUENTA AMERICANA (Warehouse handling @ TC $18.00/USD):
  Revisión y Clasificación:    48.00 USD      $864.00
  Carga y Descarga:            50.00 USD      $900.00
  Coordinación y Manejo:       41.00 USD      $738.00
  Etiquetas y Manuales:        3.00 USD       $54.00
  Otros (VUCEM + Shipper):     60.00 USD      $1,080.00
  Re-Trabajo:                  158.00 USD     $2,844.00
                                    Subtotal:  $6,480.00

═══════════════════════════════════════════════
TOTAL CÁLCULO:                                $23,065.51 MXN
═══════════════════════════════════════════════
```

**Important notes from the cálculo:**
- "SI PRESENTA TLC (CERTIFICADO DE ORIGEN) EL IGI Y DTA NO APLICA" — If USMCA cert is presented, IGI duty + DTA don't apply (potentially saving $2,667.09)
- "EL COSTO DE ETIQUETADO PUEDE CAMBIAR" — Labeling/manual cost varies by quantity
- Exchange rate fluctuation disclaimer

### The Two Payments

| Payment | Amount | To | Bank | Concept | Time | Ref |
|---|---|---|---|---|---|---|
| **Import taxes** | $23,065.21 MXN | TGR Logistics (Gestores Aduanales) | BBVA Mexico, CLABE **6792 | "PED" | Feb 23, 16:20 | 1032445 |
| **Truck crossing** | $2,668.00 MXN | Carlos Enrique Garza Roque | Banamex, CLABE **8128 | "CRUZ" | Feb 23, 16:21 | 202015 |
| **TOTAL** | **$25,733.21 MXN** | | | | | |

Note: $0.30 difference between cálculo ($23,065.51) and actual payment ($23,065.21) — rounding or adjustment.

### The USMCA Certificate

| Field | Value |
|---|---|
| Certifier/Producer/Exporter | Ferguson Enterprises, LLC |
| Address | 751 Lakefront Commons, Newport News, VA |
| Importer | Roger Floyd Williams, Calle San Juan 11A, Col. Providencia, Mexico |
| Blanket Period | 10/15/2025 → 10/14/2026 |
| Products | K-2215-0 (USA), K-2214-0 (USA) |
| Signed By | Reese Holbrook, Senior Account Manager |
| Contact | reese.holbrook@ferguson.com, 530 961 9444 |

**Key insight:** This is a BLANKET certificate — valid for one year, covering specific SKUs. Reusable for future Ferguson imports of the same Kohler models.

### Process Learnings from This Crossing

1. **Antonina (bookkeeper) initiates, not Roger** — She compiles all invoices and sends the batch to the broker
2. **Batch crossings are the norm** — 7 shipments from 4 vendors crossed together as one tráfico
3. **Late additions happen** — Cal Faucets showerheads arrived after Roger said "close it" but were still added
4. **Origin questions are per-SKU** — Broker asked specifically about K-2215-0 and K-2214-0
5. **USMCA certs are per-vendor, blanket period** — Ferguson's cert covers a year for specific SKUs
6. **Two separate payments to two different accounts** — Taxes to brokerage company, crossing fee to Enrique personally
7. **Same-day turnaround is possible** — Cálculo at 3:56 PM → paid at 4:22 PM (26 minutes!)
8. **The cálculo includes warehouse handling fees** — Not just taxes, also classification, loading, labels, etc.
9. **Replacement items get lumped in** — The damaged sink replacement was part of the same crossing
10. **All packages ship to TGR Logistics in Laredo** — Everything consolidates there before crossing

---

## THE OFFICIAL 11-STEP DOCUMENT TRAIL

Based on a complete, numbered set of documents from Tráfico E40-26 (March 2026), here is the exact sequence of documents produced during a crossing. **This is the canonical order — the dashboard must track and store each one.**

### Crossing: Tráfico E40-26 | Pedimento 26 24 3320 6007136 | March 17-24, 2026

| # | Document | What It Is | Who Creates It | Key Data |
|---|---|---|---|---|
| **1** | **FICHA (Hoja de Tráfico)** | Traffic sheet — the master inventory of everything in the crossing | Broker/TGR | Lists every item by partida (line), brand, origin country, HS code, value, weight. This crossing: 8 partidas, $3,946.40 USD, 123 kg, 3 vendors (Cal Faucets, Build.com/Ferguson, JCR Distributors). Shows TOTO lavatory origin split: 2 pcs from Mexico ($144/ea), 8 pcs from India ($576/ea @ 35% duty) |
| **2** | **CÁLCULO DE IMPUESTOS** | Tax estimate from broker | TGR / Lic. Enrique | Invoice: $3,946.40 USD, TC: 18.0000, Customs value: $88,685.46 MXN. Taxes: $17,839.03. Broker fees: $4,508.76. Warehouse: $12,376.50 ($669 USD @ TC 18.50). **Total: $34,724.29 MXN**. Note: Re-Trabajo $470 USD = $8,695 MXN (biggest warehouse line item) |
| **3** | **CARTA 3.1.8** | Customs declaration letter under Rule 3.1.8 | Broker (signed by Roger) | Sworn declaration to customs authority listing all invoices, exporters, incrementables ($980.57: fletes $311.57 + otros $669.00). Lists all 8 partidas with Spanish descriptions. Signed by Roger as legal representative (RFC WIRO700907SD2) |
| **4** | **VENDOR INVOICES** | Original commercial invoices from each vendor | Vendors | **Cal Faucets +4649670** ($3,189.60, PO P01238, 7 items including widespread faucet $1,197.18), **JCR INV260001268** ($880.29, 10× TOTO lavatories, PO P01222-2), **Ferguson/Build.com #94208552** ($188.08, Delta garbage disposal air switch 72050-RB) |
| **5** | **COVE Documents + Acuse** | Electronic value declarations filed on VUCEM (Ventanilla Digital Mexicana de Comercio Exterior) | Broker via gob.mx | One COVE per vendor invoice: **COVE268096OZ3** (Cal Faucets +4649670), **COVE268099TB5** (Build.com #94208552), **COVE26809ASW8** (JCR INV260001268). Plus **Acuse de Digitalización** (digitization receipts) for the Carta 3.1.8 filing. Filed March 18, 2026. Customs agent: Manuel Cardenas Garza (CAGM5607304SA), Patente Aduanal: 3320 |
| **6** | **PEDIMENTO** | The official Mexican customs declaration — THE legal document | Broker/SAT | **Pedimento 26 24 3320 6007136**, Referencia E40-26. 3 pages. 8 partidas. Valor dólares: $4,926.97. Valor aduana: $88,301. Exchange rate: 17.92180. Taxes paid electronically: $20,279. Entry/payment date: 18/03/2026. Shows per-item HS codes, IVA at 16%, IGI at 0% (US origin) or 35% (India origin for TOTO). Vehicle: VV6917C |
| **7** | **FACTURA CRUCE (Carta Porte)** | Crossing invoice / transport document (CFDI 4.0 with Carta Porte 3.1) | Carlos Enrique Garza Roque | Factura CE-764. Service: "transporte de carga por carretera a nivel internacional". Base: $2,300 + IVA $368 = **$2,668 MXN**. Origin: TGR Logistic (4602 Modern Lane, Laredo TX 78041). Destination: **Tres Guerras** (Carr. a Piedras Negras Km 14.2, Int. Bodega 8, CP 88176). Driver: Julio Cesar Fuentes Mexquitic. Insurance: New Horizon Insurance Company. Distance: 9.59 km |
| **8** | **TGR WAREHOUSE INVOICE** | Warehouse handling charges (in USD) | TGR Logistic Inc | Invoice 26-034, Trafic E40-26. Value: $3,946.40. Weight: 123 kg. TC: $18.50. Prep of docs: $60, Classification: $48, Warehouse handling: $41, Storage: $470, Loading: $50. **Total: $669 USD** |
| **9** | **FACTURA GTA (Broker Invoice)** | Broker's official CFDI invoice for their fees | Gestores Aduanales del Noreste y CIA SC | Factura A-81216. Honorarios: $2,000, Complementarios: $1,600, Prevalidación: $25.86, Validación: $261. Subtotal: $3,886.86 + IVA $621.90 = **$4,508.76 MXN**. Plus pass-through: Impuestos Aduanales $20,279 + Cuenta Americana $12,376.50 = $32,655.50. **Grand total: $37,164.26** (but $37,164.26 anticipado = **Balance: $0.00**) |
| **10** | **COMPROBANTE DE PAGO** | SPEI payment receipt | Roger's Santander bank | Transfer of **$34,724.29 MXN** to Gestores Aduanales del Noreste (BBVA, CLABE *6792). Date: 18/mar/2026 11:51:25. Concept: "PED". Ref: 477324819. Note: This is one consolidated payment (taxes + broker + warehouse), unlike the Feb crossing which had two separate payments |
| **11** | **MANIFESTACIÓN DE VALOR** | Customs value determination worksheet (SAT/SHCP form) | Broker (digitally signed by Roger) | 2-page SAT form showing: Importer (Roger Floyd Williams), 3 vendors (Cal Faucets, Build.com, JCR), direct price $70,727, incrementables $17,573.58, customs value $88,300.58. Lists all 3 invoices with dates and places of emission. Digital signature with e.firma |

### Key Differences Between the Two Crossings

| Aspect | Feb Crossing (E27-26) | Mar Crossing (E40-26) |
|---|---|---|
| **Total invoice value** | $2,611.34 USD | $3,946.40 USD |
| **Total import cost** | $25,733.21 MXN (2 payments) | $34,724.29 MXN (1 payment) |
| **Import cost ratio** | ~57% of invoice value | ~49% of invoice value |
| **Payment structure** | 2 separate SPEI transfers (PED + CRUZ) | 1 consolidated SPEI transfer |
| **Crossing fee** | $2,668 separate payment to Enrique | $2,668 included in consolidated payment |
| **Exchange rate** | 17.3500 | 18.0000 |
| **Broker fees** | $4,508.76 | $4,508.76 (IDENTICAL) |
| **Warehouse (USD)** | $360 | $669 (storage charge $470 = key variable) |
| **Partidas** | Unknown | 8 items across 3 vendors |
| **Notable** | USMCA cert needed for Kohler sinks | TOTO lavatories split: 2 from Mexico (0% duty) vs 8 from India (35% duty!) |
| **Pedimento payment** | $20,279 electronic | $20,279 electronic (coincidentally same!) |
| **Document count** | Incomplete | Full 11-document trail |

### Critical Insight: Origin Matters A LOT

The Pedimento for Tráfico E40-26 reveals something huge: **the same product (TOTO LT569#01 lavatory) has two different origins and two wildly different duty rates:**

```
Partida 7: TOTO Lavatory LT569#01 — 2 pcs — Origin: USA → MEX
  IGI: 0.00000  (zero duty — USMCA/domestic)
  IVA: 16%     → $516 MXN

Partida 8: TOTO Lavatory LT569#01 — 8 pcs — Origin: USA → IND (India)
  IGI: 35.00000  (35% import duty!)
  IVA: 16%      → $4,511 IGI + $2,858 IVA = $7,369 MXN
```

**10 identical lavatories, but 8 of them manufactured in India = $4,511 in extra duties.** This is exactly why the dashboard needs per-SKU origin tracking and USMCA certificate management. The savings from having the right documentation are massive.

---

## WHAT'S MISSING FROM THE SYSTEM

### A. Data Model Gaps

| Missing | Why It Matters |
|---|---|
| **Pedimento entity** | No data structure to track the customs workflow per shipment |
| **Broker contact/entity** | No place to store broker info, communication history |
| **Country of origin per product** | Can't auto-determine if USMCA applies |
| **USMCA certificate tracking** | No way to know if cert is on file vs. needs requesting |
| **Spanish manual library** | No storage/reuse of translated manuals per SKU |
| **Cálculo (tax estimate)** | No document type for broker tax estimates |
| **Customs payment tracking** | Import duties not in the Finance Dashboard or deal P&L |
| **Truck crossing fee** | Separate cost not tracked anywhere |
| **Domestic carrier/tracking** | Only one tracking # per shipment (US leg only) |
| **Factura (final broker invoice)** | No document type for final customs invoice |
| **Expediente tracking** | No workflow for case file signatures |
| **Import cost in margin calc** | Net margin doesn't include customs costs |

### B. Process Gaps

| Missing | Impact |
|---|---|
| No broker communication log | Can't see where a shipment is stuck in customs |
| No document checklist per crossing | Things get missed — manuals, certs, etc. |
| No payment tracking for import costs | Finance Dashboard blind to customs expenses |
| No reuse of USMCA certs | Same cert requested from vendor repeatedly |
| No Spanish manual library | Same manual translated multiple times |
| No cálculo vs. factura reconciliation | Can't catch broker overcharges |
| No expediente signature workflow | Paper gets lost, compliance risk |

### C. Questions Answered (from real documents)

| Question | Answer |
|---|---|
| Who is the broker? | **Jeanefer Contreras** (jeanefer_jeco@hotmail.com), with Lic. Carlos Enrique Garza Roque handling physical crossings |
| How are payments made? | **SPEI bank transfers** — two separate payments to two accounts |
| Typical cálculo turnaround? | **Same day possible** — docs submitted AM, cálculo received 3:56 PM |
| Truck crossing fee? | **$2,668 MXN** for this crossing (7 shipments). Paid to Enrique personally at Banamex |
| Who initiates? | **Antonina (bookkeeper)**, not Roger. She compiles all invoices |
| Are crossings per-PO? | **NO — batch crossings.** Multiple POs from multiple vendors in one tráfico |
| USMCA cert format? | **Blanket annual certificates** per vendor (Ferguson's covers 10/15/2025 → 10/14/2026) |
| Where do US shipments go? | **TGR Logistic Inc**, 4602 Modern Lane, Laredo TX 78041 |

### D. Questions Resolved (Apr 7 Follow-up)

| Question | Answer | Dashboard Impact |
|---|---|---|
| Domestic carrier always Tres Guerras? | **No — varies, but always a Mexican shipper.** | Carrier field must be a free-text input, not a fixed dropdown. |
| How often does factura differ from cálculo? | **Every time, by a small amount.** | Reconciliation is REQUIRED. Auto-flag variance, show side-by-side comparison. |
| How are Spanish manuals created? | **Auto-translated by a free online service.** | Opportunity: use Claude Haiku for higher-quality translations with CC branding baked in. Store in manual library for reuse. |
| Products that skip Pedimento? | **Yes — only imported products need this.** Domestic Mexican brands skip entirely. | Add `requiresImport: boolean` flag to products/line items. Only trigger Pedimento workflow for imported items. |
| Payment → delivery to SMA timeline? | **4 to 6 weeks.** | This is critical for customer expectation-setting. Auto-calculate estimated delivery date from payment confirmation. |
| Crossing fee variable? | **Usually the same (~$2,668 MXN).** Roughly fixed per crossing. | Can default to $2,668 in the payment screen, editable if different. |
| Other brokers besides Jeanefer? | **Sometimes uses UPS as broker** (when shipping via UPS). | Broker field needs to support multiple brokers. Different workflow when UPS handles brokerage vs. Jeanefer. |

### E. Final Clarifications (Apr 7)

- **Expediente is digital.** Full end-to-end automation is possible — no physical paper step.
- **Reconciliation is required on EVERYTHING.** Not just cálculo vs. factura. Every dollar in, every dollar out, every invoice, every payment. The dashboard must provide a complete audit trail with side-by-side comparisons at every step.

---

## DASHBOARD AUTOMATION PLAN

### 1. New Data Model: `Trafico` (Batch Crossing) + `PedimentoItem`

**Critical design insight from real data:** Imports are NOT one-per-PO. They're BATCH crossings — multiple POs from multiple vendors cross together as a single "tráfico." The Feb 2026 crossing had 7 shipments from 4 vendors. The data model must reflect this.

```typescript
// A Trafico is one batch crossing event — the parent container
export interface Trafico {
  id: string;                    // CC-TRF-2026-001
  traficoNumber: string;         // Broker's reference, e.g., "E27-26"
  pedimentoNumber?: string;      // Official customs #, e.g., "26 240 3482-6101796"

  // Broker
  brokerName: string;            // "Jeanefer Contreras"
  brokerEmail: string;           // "jeanefer_jeco@hotmail.com"
  crossingAgent?: string;        // "Lic. Carlos Enrique Garza Roque"
  crossingAgentEmail?: string;   // "quique73@globalpc.net"

  // Warehouse
  warehouseName: string;         // "TGR Logistic Inc"
  warehouseAddress: string;      // "4602 Modern Lane, Laredo TX 78041"
  warehousePhone?: string;       // "(956) 704-5008"
  warehouseEmail?: string;       // "auxiliartraficotgr@hotmail.com"

  // Status
  status: TraficoStatus;
  statusHistory: {
    status: TraficoStatus;
    timestamp: string;
    note?: string;
    actor?: string;              // Who triggered: "antonina", "jeanefer", "roger"
  }[];

  // Items in this crossing
  items: PedimentoItem[];

  // Documents — the 11-step trail (Google Drive file IDs)
  documents: {
    fichaId?: string;              // 1. Hoja de Tráfico (traffic sheet / master inventory)
    calculoId?: string;            // 2. Cálculo de Impuestos (tax estimate)
    carta318Id?: string;           // 3. Carta 3.1.8 (customs declaration letter, signed)
    vendorInvoiceIds: string[];    // 4. Vendor invoices (one per vendor in crossing)
    coveIds: string[];             // 5. COVE documents (electronic value declarations, one per invoice)
    acuseIds: string[];            // 5b. Acuse de Digitalización (digitization receipts)
    pedimentoId?: string;          // 6. Pedimento (official customs declaration — THE document)
    pedimentoProformaId?: string;  // 6b. Proforma pedimento (detailed version with partidas)
    facturaCruceId?: string;       // 7. Factura Cruce / Carta Porte (crossing transport invoice)
    facturaCruceXmlId?: string;    // 7b. XML version (CFDI 4.0)
    tgrInvoiceId?: string;         // 8. TGR Warehouse Invoice (handling charges in USD)
    brokerFacturaId?: string;      // 9. Factura GTA (broker's official CFDI invoice)
    brokerFacturaXmlId?: string;   // 9b. XML version
    comprobantePagoId?: string;    // 10. Comprobante de Pago (SPEI payment receipt)
    manifestacionValorId?: string; // 11. Manifestación de Valor (customs value worksheet, signed)
  };

  // Financials — the cálculo breakdown (from real document)
  invoiceValueUSD?: number;       // Total invoice value in USD ($2,611.34)
  exchangeRate?: number;          // TC USD CAAAREM (17.3500)
  customsValueMXN?: number;       // Valor en Aduana ($53,366.52)

  calculoBreakdown?: {
    // Taxes (Cuadro de Contribuciones)
    igi: number;                  // Ad Valorem duty ($2,240.16)
    prv: number;                  // ($330.00)
    cnt: number;                  // ($53.00)
    dta: number;                  // Customs processing ($426.93)
    iva: number;                  // 16% tax ($9,026.66)
    taxSubtotal: number;          // ($12,076.75)

    // Broker fees (Cuenta Mexicana)
    honorarios: number;           // ($2,000.00)
    complementarios: number;      // ($1,600.00)
    prevalidacion: number;        // ($25.86)
    validacion: number;           // ($261.00)
    sellosFiscales: number;       // (—)
    ivaCuentaMexicana: number;    // ($621.90)
    brokerSubtotal: number;       // ($4,508.76)

    // Warehouse handling (Cuenta Americana)
    revisionClasificacion: number; // ($864.00)
    cargaDescarga: number;        // ($900.00)
    coordinacionManejo: number;   // ($738.00)
    etiquetasManuales: number;    // ($54.00)
    otrosVUCEM: number;           // ($1,080.00)
    reTrabajo: number;            // ($2,844.00)
    warehouseSubtotal: number;    // ($6,480.00)
  };

  calculoTotal?: number;          // Total cálculo amount ($23,065.51)

  // Truck crossing fee (separate payment)
  truckCrossingFee?: number;      // $2,668.00 MXN
  truckFeePayee?: string;         // "Carlos Enrique Garza Roque"
  truckFeeBank?: string;          // "Banamex, CLABE 002821700962028128"

  // Payment tracking
  calculoPayment?: {
    amount: number;               // $23,065.21 MXN
    date: string;                 // "2026-02-23"
    method: string;               // "SPEI"
    bank: string;                 // "Santander → BBVA Mexico"
    reference: string;            // "1032445"
    concept: string;              // "PED"
    payeeName: string;            // "TGR Logistics / Gestores Aduanales"
    payeeClabe: string;           // "012821001951426792"
  };
  truckFeePayment?: {
    amount: number;               // $2,668.00 MXN
    date: string;
    method: string;               // "SPEI"
    bank: string;                 // "Santander → Banamex"
    reference: string;            // "202015"
    concept: string;              // "CRUZ"
  };

  totalImportCost?: number;       // calculoTotal + truckCrossingFee ($25,733.21)

  facturaAmount?: number;         // Final actual cost (may differ from cálculo)
  facturaDifference?: number;     // facturaAmount - calculoTotal (auto-calc)

  // Domestic shipping (Mexico leg: Laredo → SMA)
  domesticCarrier?: string;       // "Tres Guerras"
  domesticTracking?: string;
  domesticShipDate?: string;
  domesticEstArrival?: string;
  domesticActualArrival?: string;

  // Expediente
  expedienteStatus: "not-sent" | "received" | "e-signed" | "returned"; // Fully digital
  expedienteSignedDate?: string;

  // Key dates
  initiatedDate?: string;         // When Antonina sent invoices to broker
  importClosedDate?: string;      // When Roger confirmed "close the import"
  calculoReceivedDate?: string;
  paymentSentDate?: string;
  crossingApprovedDate?: string;
  completedDate?: string;

  // Notes
  notes?: string;
}

// Each item in the crossing — links back to POs and deals
export interface PedimentoItem {
  id: string;
  traficoId: string;              // Parent tráfico
  dealId?: string;                // Which customer deal (if any — some are inventory)
  poId?: string;                  // Which PO
  shipmentId?: string;            // Which DealShipment

  // Vendor info
  vendorName: string;             // "Ferguson", "JCR Distributors", "California Faucets"
  vendorInvoiceNumber: string;    // "Order #94108221", "INV260000100", "+4644937"
  vendorInvoiceDate: string;
  vendorInvoiceDocId?: string;    // Drive file ID

  // Products
  products: {
    sku: string;                  // "K-2215-0", "FR\\PES-360-MBK"
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];

  invoiceSubtotal: number;        // Product subtotal
  freightCharge: number;          // Shipping/freight
  invoiceTotal: number;           // Grand total

  // Tracking (US leg)
  usCarrier: string;              // "FedEx", "UPS Ground"
  usTracking: string;             // Tracking number(s)

  // Origin
  countryOfOrigin?: "US" | "Canada" | "China" | "Mexico" | "Other";
  originConfirmedBy?: string;     // "Roger" — who confirmed origin
  usmcaStatus: "on-file" | "requested" | "received" | "not-needed" | "not-applicable";
  usmcaCertId?: string;           // Drive file ID of cert

  // Spanish manuals
  spanishManualsRequired: boolean;
  spanishManualsStatus: "not-needed" | "on-file" | "in-translation" | "sent-to-broker";
  spanishManualDocIds?: string[];

  // Notes
  isReplacement?: boolean;        // For damaged item replacements
  isLateAddition?: boolean;       // Added after import was "closed"
  notes?: string;
}

export type TraficoStatus =
  | "collecting"             // Shipments arriving at TGR warehouse, not yet sent to broker
  | "sent-to-broker"         // Antonina sent invoice batch to broker
  | "at-warehouse"           // Broker confirms goods at bodega
  | "import-open"            // Broker reviewing, may ask origin/cert questions
  | "awaiting-documents"     // Waiting for USMCA cert, manuals, origin confirmation
  | "import-closed"          // Roger confirmed all items accounted for
  | "calculo-received"       // Tax estimate received from broker
  | "payment-pending"        // CC needs to pay taxes + truck fee
  | "payment-sent"           // Both SPEI transfers sent, awaiting confirmation
  | "crossing-approved"      // Cleared to cross border
  | "in-transit-domestic"    // On Tres Guerras (border → SMA)
  | "delivered-to-cc"        // Arrived at CC showroom
  | "factura-received"       // Final invoice from broker
  | "expediente-pending"     // Case file needs signatures
  | "complete"               // All done, books closed
  | "issue";                 // Problem (held at border, missing docs, etc.)
```

### 2. New Google Sheet Tab: `Traficos` (Batch Crossings)

```
Columns:
TRF_ID, Trafico_Number, Pedimento_Number, Status,
Broker_Name, Broker_Email, Crossing_Agent,
Warehouse_Name, Warehouse_Address,
Invoice_Value_USD, Exchange_Rate, Customs_Value_MXN,
Calculo_Total_MXN, Calculo_Breakdown_JSON, Calculo_Drive_ID,
Truck_Crossing_Fee, Truck_Fee_Payee,
Calculo_Payment_JSON, Truck_Payment_JSON,
Total_Import_Cost,
Factura_Amount, Factura_Difference, Factura_Drive_ID,
Domestic_Carrier, Domestic_Tracking, Domestic_Ship_Date, Domestic_Est_Arrival, Domestic_Actual_Arrival,
Expediente_Status, Expediente_Drive_ID, Expediente_Signed_Date,
Initiated_Date, Import_Closed_Date, Calculo_Received_Date, Payment_Sent_Date,
Crossing_Approved_Date, Completed_Date,
Notes, Status_History_JSON, Item_Count
```

### 2b. New Google Sheet Tab: `Trafico_Items` (Individual shipments in each crossing)

```
Columns:
Item_ID, TRF_ID, Deal_ID, PO_ID, Shipment_ID,
Vendor_Name, Vendor_Invoice_Number, Vendor_Invoice_Date, Vendor_Invoice_Drive_ID,
Products_JSON, Invoice_Subtotal, Freight_Charge, Invoice_Total,
US_Carrier, US_Tracking,
Country_of_Origin, Origin_Confirmed_By, USMCA_Status, USMCA_Cert_Drive_ID,
Spanish_Manuals_Required, Spanish_Manuals_Status, Spanish_Manual_Drive_IDs,
Is_Replacement, Is_Late_Addition, Notes
```

### 3. New Google Sheet Tab: `USMCA_Certificates`

Track certificates by brand/vendor for reuse across shipments:

```
Columns:
Cert_ID, Brand, Manufacturer, Country_of_Origin,
Cert_Type (USMCA | NAFTA_Legacy | Letter_of_Origin),
Drive_File_ID, Valid_From, Valid_To,
Products_Covered (JSON array of SKUs or "all"),
Credit_Available (boolean), Credit_Notes,
Obtained_Date, Source (vendor | broker | on_file)
```

### 4. New Google Sheet Tab: `Spanish_Manuals`

Library of translated manuals for reuse:

```
Columns:
Manual_ID, Brand, Product_Name, SKU,
Drive_File_ID, Language, CC_Branded (boolean),
Created_Date, Created_By, Version,
Original_Manual_Drive_ID
```

### 5. Dashboard Module: Pedimento Tracker

**Location:** New tab in the dashboard, alongside Pipeline, Shipments, Finance

**Layout:**

```
┌──────────────────────────────────────────────────────────────┐
│  PEDIMENTO TRACKER                                           │
│                                                              │
│  KPI Cards:                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Active   │ │ Awaiting │ │ Payment  │ │ Total    │       │
│  │ Crossings│ │ Documents│ │ Pending  │ │ Import   │       │
│  │    4     │ │    2     │ │  $45,200 │ │ Cost MTD │       │
│  │          │ │ ⚠️       │ │          │ │ $182,400 │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ACTIVE PEDIMENTOS                                    │   │
│  │                                                       │   │
│  │  CC-PED-2026-012 │ Brizo Faucet    │ ● Awaiting USMCA│   │
│  │  Deal: Carolina M │ Origin: US      │ Broker: [name]  │   │
│  │  ├── ✅ Invoice sent to broker                        │   │
│  │  ├── ✅ Origin confirmed: USA                         │   │
│  │  ├── ⏳ USMCA cert requested from vendor (3 days ago)│   │
│  │  ├── ○ Spanish manuals: on file ✓                    │   │
│  │  ├── ○ Cálculo pending                               │   │
│  │  └── ○ Payment pending                               │   │
│  │                                                       │   │
│  │  CC-PED-2026-011 │ TOTO Toilet     │ ● Payment Pending│  │
│  │  Deal: Carolina M │ Origin: China   │ Broker: [name]  │   │
│  │  ├── ✅ All documents submitted                       │   │
│  │  ├── ✅ Cálculo received: $12,400 MXN                │   │
│  │  ├── ⏳ Awaiting payment approval                     │   │
│  │  └── ○ Crossing pending                              │   │
│  │                                                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  DOCUMENT CHECKLIST (per crossing)                    │   │
│  │                                                       │   │
│  │  Required for CC-PED-2026-012:                        │   │
│  │  ☑ Vendor invoice                    Uploaded Apr 5   │   │
│  │  ☑ Packing list                      Uploaded Apr 5   │   │
│  │  ☐ USMCA certificate                 Requested Apr 5  │   │
│  │  ☑ Spanish manual (Brizo Litze)      On file          │   │
│  │  ☐ Cálculo                           Waiting          │   │
│  │  ☐ Payment confirmation              —                │   │
│  │  ☐ Factura                           —                │   │
│  │  ☐ Expediente                        —                │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### 6. Automation Triggers (Updated for Batch Crossing Reality)

| Trigger | Action |
|---|---|
| PO status → `"shipped"` + shipTo is `"cc-showroom"` | Auto-add as item to current open Tráfico (or create new one if none open) |
| Multiple shipments arriving at TGR within same week | Auto-group into single Tráfico with status `"collecting"` |
| Antonina clicks "Send to Broker" | Email all vendor invoices to Jeanefer + TGR, advance to `"sent-to-broker"` |
| Broker confirms goods at warehouse | Advance to `"at-warehouse"` |
| Broker asks about country of origin for SKU | Flag item, notify Roger for origin confirmation |
| Roger confirms origin = US/Canada | Auto-check USMCA_Certificates tab for matching vendor + SKU |
| USMCA cert found on file (blanket period valid) | Auto-attach cert to Tráfico item, mark `"on-file"` |
| No USMCA cert on file | Flag as `"requested"`, draft email to vendor requesting cert |
| Product SKU has entry in Spanish_Manuals tab | Auto-attach manual, mark `"on-file"` |
| No Spanish manual on file | Flag as `"in-translation"`, add to task queue |
| Roger clicks "Close Import" | Lock Tráfico items, advance to `"import-closed"` |
| Late shipment arrives after close | Prompt: "Add to current tráfico or hold for next?" |
| Broker uploads cálculo PDF | Parse key amounts, advance to `"calculo-received"`, notify Roger for approval |
| Roger approves cálculo | Show payment instructions (two transfers: PED + CRUZ), advance to `"payment-pending"` |
| Roger uploads payment receipts | Match amounts, advance to `"payment-sent"`, email receipts to broker |
| Broker confirms crossing approved | Advance to `"crossing-approved"` |
| Broker provides domestic tracking | Advance to `"in-transit-domestic"`, create domestic shipping record |
| Domestic delivery confirmed | Advance all linked DealShipments to `"delivered-to-cc"`, trigger inspection |
| Broker uploads factura | Auto-compare vs. cálculo, flag if > 1% variance |
| Expediente signed + returned | Advance to `"complete"`, distribute import costs to linked deals' P&L |

### 7. Finance Dashboard Integration

The existing Finance Dashboard calculates margin as:

```
Net Margin = Total Collected - Total Dealer Cost - Stripe Fees - Shipping
```

**With Pedimento, it becomes:**

```
Net Margin = Total Collected
           - Total Dealer Cost
           - Stripe Fees
           - US Shipping (to border)
           - Import Duties & Taxes (cálculo/factura)
           - Truck Crossing Fee
           - Domestic Shipping (Tres Guerras)
           - Broker Fee (if applicable)
```

Add to the `ExtendedDealFields` interface:

```typescript
// Import costs (add to existing interface)
// NOTE: Costs from a batch crossing must be ALLOCATED across deals
// Allocation method: pro-rata by invoice value of each deal's items in the tráfico
importCosts?: {
  traficoId: string;
  traficoNumber: string;        // "E27-26"
  allocationPercent: number;    // This deal's share of the total crossing
  allocatedTaxes: number;       // Pro-rata share of taxes ($12,076.75 × %)
  allocatedBrokerFees: number;  // Pro-rata share of broker fees ($4,508.76 × %)
  allocatedWarehouse: number;   // Pro-rata share of warehouse handling ($6,480.00 × %)
  allocatedTruckFee: number;    // Pro-rata share of crossing fee ($2,668.00 × %)
  totalImportCost: number;      // Sum of all above
};
```

**Example allocation from Feb 2026 crossing:**

```
Total crossing cost: $25,733.21 MXN
Total invoice value: $2,611.34 USD

If Deal A's items = $1,305.53 (Ferguson sinks) = 50% of total
  → Deal A import cost: $25,733.21 × 50% = $12,866.60 MXN

If Deal B's items = $714.02 (Cal Faucets shower) = 27.3% of total
  → Deal B import cost: $25,733.21 × 27.3% = $7,025.17 MXN
```

### 8. Shipment Tracker Update

The existing `DealShipment` needs to support two legs:

```typescript
// Add to existing DealShipment interface
export interface DealShipment {
  // ... existing fields ...

  // NEW: Multi-leg tracking
  legs?: ShipmentLeg[];
  pedimentoId?: string;          // Links to Pedimento record
}

export interface ShipmentLeg {
  leg: "us-to-border" | "domestic-to-sma" | "direct";
  carrier: string;
  trackingNumber: string;
  status: string;
  shipDate?: string;
  estimatedArrival?: string;
  actualArrival?: string;
}
```

### 9. Google Drive Folder Structure

Under each deal's Drive folder, add:

```
Deal: Carolina Mendoza — Kitchen Remodel/
├── Quotes/
├── Invoices/
├── Purchase Orders/
├── Delivery Receipts/
└── Import Documents/          ← NEW
    ├── CC-PED-2026-012 (Brizo)/
    │   ├── Vendor-Invoice.pdf
    │   ├── USMCA-Certificate.pdf
    │   ├── Calculo.pdf
    │   ├── Factura.pdf
    │   └── Expediente.pdf
    └── CC-PED-2026-011 (TOTO)/
        ├── Vendor-Invoice.pdf
        ├── Spanish-Manual-TOTO-MS920.pdf
        ├── Calculo.pdf
        ├── Factura.pdf
        └── Expediente.pdf
```

### 10. Reconciliation Engine

**Reconciliation is required on absolutely everything.** This is the bookkeeping backbone of the Pedimento module.

**Layout:**

```
┌──────────────────────────────────────────────────────────────┐
│  RECONCILIATION DASHBOARD                                     │
│                                                               │
│  KPI Cards:                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ Open     │ │ Variances│ │ Unmatched│ │ Total    │        │
│  │ Crossings│ │ Flagged  │ │ Payments │ │ Variance │        │
│  │    3     │ │   2 ⚠️   │ │    0 ✅  │ │ +$412 MXN│        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│                                                               │
│  PER-TRÁFICO RECONCILIATION VIEW:                             │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Tráfico E27-26 (Feb 23, 2026)                         │  │
│  │                                                         │  │
│  │  VENDOR INVOICES vs PO AMOUNTS:                         │  │
│  │  Ferguson #94108221    PO: $582.00   Inv: $582.00   ✅  │  │
│  │  Ferguson #93968242    PO: $1,305.53 Inv: $1,305.53 ✅  │  │
│  │  JCR INV260000100      PO: $532.63   Inv: $532.63   ✅  │  │
│  │  JCR INV260000561      PO: $102.56   Inv: $102.56   ✅  │  │
│  │  Cal Faucets +4644937  PO: $744.37   Inv: $744.37   ✅  │  │
│  │  Cal Faucets +4647694  PO: $513.71   Inv: $513.71   ✅  │  │
│  │                                                         │  │
│  │  CÁLCULO vs PAYMENT:                                    │  │
│  │  Cálculo total:     $23,065.51                          │  │
│  │  Payment sent:      $23,065.21                          │  │
│  │  Variance:          -$0.30  ⚠️ (rounding)               │  │
│  │                                                         │  │
│  │  CÁLCULO vs FACTURA:                                    │  │
│  │  Cálculo total:     $23,065.51                          │  │
│  │  Factura total:     $23,477.83  (example)               │  │
│  │  Variance:          +$412.32  ⚠️                        │  │
│  │  Breakdown:                                              │  │
│  │    IGI:         +$0.00  │  Honorarios:    +$0.00        │  │
│  │    IVA:       +$312.32  │  Warehouse:   +$100.00        │  │
│  │    DTA:         +$0.00  │  Other:         +$0.00        │  │
│  │                                                         │  │
│  │  CROSSING FEE:                                           │  │
│  │  Expected:  $2,668.00  │  Actual: $2,668.00  ✅         │  │
│  │                                                         │  │
│  │  USMCA SAVINGS:                                          │  │
│  │  USMCA cert presented for Ferguson Kohler sinks          │  │
│  │  IGI waived: ~$1,200   DTA waived: ~$426   = ~$1,626 ✅ │  │
│  │                                                         │  │
│  │  COST ALLOCATION TO DEALS:                               │  │
│  │  Deal: Carolina M    50.0%  →  $12,866.60 allocated  ✅ │  │
│  │  Deal: Proyecto B    27.3%  →  $7,025.17 allocated   ✅ │  │
│  │  Deal: Inventory     22.7%  →  $5,841.44 allocated   ✅ │  │
│  │  Total allocated:           $25,733.21  ✅ matches      │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  RUNNING TOTALS (Year to Date):                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Crossings completed: 14                                │  │
│  │  Total import costs:  $342,840 MXN                      │  │
│  │  Total USMCA savings: $28,400 MXN                       │  │
│  │  Avg cost per crossing: $24,488 MXN                     │  │
│  │  Avg variance (cálculo→factura): +1.2%                  │  │
│  │  Unresolved variances: 0                                │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

**Reconciliation rules:**

| Check | Threshold | Action |
|---|---|---|
| Vendor invoice vs PO amount | Any difference | Flag for review |
| Cálculo vs payment sent | > $1 MXN | Flag — likely rounding, but log it |
| Cálculo vs final factura | > 1% | Yellow flag — review line items |
| Cálculo vs final factura | > 5% | Red flag — escalate to Roger |
| Crossing fee vs $2,668 baseline | > $500 variance | Flag — something unusual |
| Cost allocation | Must sum to 100% | Auto-validate, block if doesn't balance |
| USMCA savings | Compare with-cert vs without-cert | Track cumulative savings for reporting |

### 11. Broker Communication Automation

**Real contacts from Feb 2026 crossing:**
- Broker: Jeanefer Contreras (jeanefer_jeco@hotmail.com)
- Warehouse: TGR Logistica (auxiliartraficotgr@hotmail.com)
- Crossing agent: Lic. Enrique / Haydee (quique73@globalpc.net)
- CC always CCs all parties on every message

For the broker relationship, add a simple communication log:

```typescript
export interface BrokerMessage {
  id: string;
  pedimentoId: string;
  direction: "to-broker" | "from-broker";
  channel: "email" | "whatsapp";
  subject?: string;
  body?: string;
  attachmentIds?: string[];      // Drive file IDs
  timestamp: string;
  automatedTrigger?: string;     // Which automation sent this
}
```

**Automated broker emails:**

| Event | Email to Broker |
|---|---|
| New Pedimento created | "New import shipment — [Brand] [Products]. Vendor invoice attached. Tracking: [#]" |
| USMCA cert uploaded | "USMCA certificate attached for [Brand] shipment" |
| Spanish manual uploaded | "Spanish product manual attached for [Product]" |
| Cálculo payment confirmed | "Payment of $[amount] MXN confirmed for Pedimento CC-PED-[#]. Reference: [ref]" |
| Expediente signed | "Signed expediente attached for Pedimento CC-PED-[#]" |

---

## IMPLEMENTATION PRIORITY

### Phase 1: Data Foundation (Week 1)
- Add `Pedimentos` tab to Google Sheets
- Add `USMCA_Certificates` tab
- Add `Spanish_Manuals` tab
- Create `Pedimento` TypeScript interface
- Add Pedimento CRUD API routes

### Phase 2: Dashboard UI (Week 2)
- Build Pedimento Tracker page
- Document checklist component
- Status progression component
- KPI cards

### Phase 3: Automation (Week 3)
- Auto-create Pedimento when PO ships
- USMCA cert lookup automation
- Spanish manual library lookup
- Broker email notifications via Resend
- Finance Dashboard import cost integration

### Phase 4: Intelligence (Week 4+)
- **Full reconciliation engine across EVERYTHING:**
  - Vendor invoice amounts vs. PO amounts (did we get charged what we expected?)
  - Cálculo line items vs. what broker actually charged (every fee category)
  - Cálculo estimate vs. final factura (always differs — track the delta)
  - Payment amounts vs. cálculo totals (catch the $0.30 rounding differences)
  - Total import cost vs. what was allocated to customer deals
  - Crossing fee consistency ($2,668 baseline — flag if significantly different)
  - USMCA savings tracking (did having the cert actually reduce IGI + DTA?)
- Import cost forecasting (estimate duties at quote stage so Roger can price with margin intact)
- Broker performance tracking (turnaround times per broker — Jeanefer vs. UPS brokerage)
- USMCA cert expiration reminders (Ferguson cert expires Oct 14, 2026 — auto-alert 30 days before)
- **Spanish manual generation via Claude Haiku** — currently using free online translation; Claude can produce higher-quality translations with CC branding baked in, stored in the manual library for reuse
- **4-6 week delivery estimate** — auto-calculate and show customer-facing ETA from payment confirmation date
- `requiresImport` flag on products — auto-determine if Pedimento workflow applies (skip for domestic Mexican brands)
- Support for **UPS brokerage** as alternative to Jeanefer (different workflow, different contacts)

---

## WHAT THIS CHANGES IN THE MEETING DECK

If you want to update the deck (CC-Meeting-Deck-Apr7.html), these slides would need additions:

1. **Slide 07 (Process Engine):** Add Pedimento as a sub-process under fulfillment
2. **Slide 09 (Shipment Tracker):** Show multi-leg tracking (US + domestic)
3. **Slide 10 (Finance Dashboard):** Add import costs to the margin calculation
4. **Slide 13 (Data Architecture):** Add new sheet tabs (Pedimentos, USMCA_Certificates, Spanish_Manuals)
5. **Slide 14 (Next Steps):** Add Pedimento automation as a priority item
