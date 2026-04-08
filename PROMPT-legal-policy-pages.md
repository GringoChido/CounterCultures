# Claude Code Prompt: Build Legal & Policy Pages (Quick Links)

## CRITICAL: Read Next.js 16 Docs First

Before writing ANY code, read `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`. This is Next.js 16.2.1 — params are `Promise`-based (`const { locale } = await params`). Heed deprecation notices.

---

## Overview

Build 4 legal/policy pages for Counter Cultures and update the footer to link to all of them. These pages exist on the current Squarespace site at countercultures.com.mx and need to be recreated in the Next.js rebuild with bilingual support (EN/ES).

The pages are:

1. **Privacy Policy** → `/[locale]/privacy`
2. **Payment Methods** → `/[locale]/payment-methods`
3. **Sales & Delivery Policy** → `/[locale]/sales-delivery`
4. **Returns & Warranty Policy** → `/[locale]/returns-warranty`

---

## Part 1: Create the 4 Page Files

All pages follow the same pattern: Server Component, bilingual, with `<Header>` and `<Footer>`, SEO metadata, and a clean typographic layout.

### Shared Page Layout Pattern

Every policy page should use this structure:

```tsx
import type { Metadata } from "next";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";

interface PageProps {
  params: Promise<{ locale: string }>;
}

const BASE_URL = "https://countercultures.mx";

export const generateMetadata = async ({ params }: PageProps): Promise<Metadata> => {
  const { locale } = await params;
  const isEs = locale === "es";
  // ... bilingual title, description, canonical, alternates, openGraph
};

const Page = async ({ params }: PageProps) => {
  const { locale } = await params;
  const lang = (locale as "en" | "es") || "en";
  const isEs = lang === "es";

  return (
    <>
      <Header locale={lang} />
      <main className="pt-20 bg-brand-linen min-h-screen">
        <div className="mx-auto max-w-3xl px-6 lg:px-8 py-16 md:py-24">
          {/* Page content here */}
        </div>
      </main>
      <Footer locale={lang} />
    </>
  );
};

export default Page;
```

### Styling for all policy pages:

- Page title: `font-display text-3xl md:text-4xl font-light text-brand-charcoal mb-8`
- Section headings: `font-display text-xl font-medium text-brand-charcoal mt-10 mb-4`
- Body paragraphs: `font-body text-base text-brand-charcoal/80 leading-relaxed mb-4`
- Lists: `font-body text-base text-brand-charcoal/80 list-disc pl-6 space-y-2 mb-4`
- Contact info blocks: `font-body text-sm text-brand-stone mt-8 pt-8 border-t border-brand-stone/10`
- Links within text: `text-brand-terracotta hover:underline`
- Max-width container: `max-w-3xl` centered (these are reading pages, not wide layouts)

---

### Page 1: Privacy Policy

**File:** `app/[locale]/privacy/page.tsx`

**Spanish content (original from site):**

```
TÍTULO: Política de Privacidad

AVISO DE PRIVACIDAD

Su privacidad y confianza son muy importantes para nosotros. Por ello nos comprometemos a mantener su información a salvo y hacer todos los esfuerzos para utilizarla de forma cuidadosa y sensata. Es importante para nosotros que usted conozca el tipo de información que recopilamos y la forma en que la utilizamos. En cumplimiento a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares publicada en el Diario Oficial de la Federación del 5 de julio de 2010 y su Reglamento publicado en el Diario Oficial de la Federación el 21 de diciembre de 2011.

1. DATOS DEL RESPONSABLE
Empresa legalmente constituida conforme a las leyes mexicanas, con domicilio en San Juan 11a, Colonia Providencia, C.P. 37737, San Miguel de Allende, Guanajuato, comprometida con la protección de sus datos personales.

2. INFORMACIÓN PROPORCIONADA POR EL TITULAR
Los datos personales que recabamos incluyen: nombre completo, registro federal de contribuyentes con homo clave (RFC), correo electrónico, domicilio, número de teléfono y nombre de empresa.

3. FINALIDAD DEL TRATAMIENTO DE DATOS
Sus datos personales serán utilizados para:
- Transacciones comerciales de productos
- Comunicaciones promocionales vía correo electrónico, teléfono u otros medios electrónicos
- Usted tendrá un plazo de cinco días hábiles después de la compra para optar por no recibir comunicaciones promocionales

4. LIMITACIÓN DEL USO Y DIVULGACIÓN
Implementamos medidas de seguridad para proteger sus datos. Si desea solicitar limitaciones en el uso o divulgación de sus datos, puede contactarnos en equipo@countercultures.com.mx

5. TRANSFERENCIA Y REMISIÓN DE DATOS
Nos comprometemos a mantener los principios de protección legal durante cualquier transferencia de datos a terceros.

6. CAMBIOS AL AVISO
Counter Cultures se reserva el derecho de modificar este aviso de privacidad. Las actualizaciones serán publicadas en countercultures.com.mx

Contacto: equipo@countercultures.com.mx | 415.154.8375
```

**English translation to include:**

```
TITLE: Privacy Policy

PRIVACY NOTICE

Your privacy and trust are very important to us. We are committed to keeping your information safe and making every effort to use it carefully and responsibly. It is important to us that you understand the type of information we collect and how we use it. In compliance with Mexico's Federal Law for the Protection of Personal Data Held by Private Parties, published in the Official Gazette on July 5, 2010, and its Regulations published on December 21, 2011.

1. RESPONSIBLE PARTY
A company legally established under Mexican law, located at San Juan 11a, Colonia Providencia, C.P. 37737, San Miguel de Allende, Guanajuato, committed to the protection of your personal data.

2. INFORMATION PROVIDED BY THE DATA SUBJECT
The personal data we collect includes: full name, Federal Taxpayer Registry number (RFC), email address, home address, telephone number, and company name.

3. PURPOSE OF DATA PROCESSING
Your personal data will be used for:
- Commercial product transactions
- Promotional communications via email, telephone, or other electronic means
- You will have a period of five business days after purchase to opt out of promotional communications

4. LIMITATIONS ON USE AND DISCLOSURE
We implement security measures to protect your data. To request limitations on the use or disclosure of your data, contact us at equipo@countercultures.com.mx

5. DATA TRANSFER
We commit to maintaining legal protection principles during any transfer of data to third parties.

6. CHANGES TO THIS NOTICE
Counter Cultures reserves the right to modify this privacy notice. Updates will be published at countercultures.com.mx

Contact: equipo@countercultures.com.mx | 415.154.8375
```

---

### Page 2: Payment Methods

**File:** `app/[locale]/payment-methods/page.tsx`

**Spanish content:**

```
TÍTULO: Métodos de Pago

EFECTIVO Y TRANSFERENCIAS BANCARIAS
Se aceptan pagos en efectivo, cheque o transferencias electrónicas a nuestra cuenta Santander. Envíe su comprobante a cuentas@countercultures.com.mx

CHEQUES
- A nombre de la empresa
- Cantidad y firma claramente escritas
- Mínimo: $500 USD/CAD
- Dirección: San Juan 11A, Col. Providencia, San Miguel de Allende, Gto. CP.37737

MERCADO PAGO
- Se aceptan cuentas de Mercado Libre
- VISA, Mastercard, American Express aceptadas

COMPRO PAGO
Depósitos en efectivo en: OXXO, 7-Eleven, Extra, Del Sol, Elektra, Coppel, Woolworth, Casa Ley, Benavides, Guadalajara, Esquivar, ABC, y bancos (Banamex, Bancomer, Scotiabank, Inbursa, Santander, Banorte, Bancoppel)

EFECTIVO EN PERSONA
En nuestra ubicación: San Juan 11A, Col. Providencia, San Miguel de Allende

PAYPAL
PayPal resguarda tus datos. No se requieren datos de tarjeta.

NOTA IMPORTANTE:
No se pueden combinar las formas de pago dentro de un mismo pedido.

Contacto: equipo@countercultures.com.mx | 415.154.8375
Horario: Lunes a Viernes 10 AM - 6 PM; Cerrado fines de semana
```

**English translation:**

```
TITLE: Payment Methods

CASH & BANK TRANSFERS
We accept payments by cash, check, or electronic transfer to our Santander account. Send your proof of payment to cuentas@countercultures.com.mx

CHECKS
- Made payable to the company
- Amount and signature clearly written
- Minimum: $500 USD/CAD
- Address: San Juan 11A, Col. Providencia, San Miguel de Allende, Gto. CP.37737

MERCADO PAGO
- Mercado Libre accounts accepted
- VISA, Mastercard, American Express accepted

COMPRO PAGO
Cash deposits at: OXXO, 7-Eleven, Extra, Del Sol, Elektra, Coppel, Woolworth, Casa Ley, Benavides, Guadalajara, Esquivar, ABC, and banks (Banamex, Bancomer, Scotiabank, Inbursa, Santander, Banorte, Bancoppel)

IN-PERSON CASH
At our location: San Juan 11A, Col. Providencia, San Miguel de Allende

PAYPAL
PayPal protects your information. No card details required.

IMPORTANT NOTE:
Payment methods cannot be combined within a single order.

Contact: equipo@countercultures.com.mx | 415.154.8375
Hours: Monday–Friday 10 AM – 6 PM; Closed weekends
```

---

### Page 3: Sales & Delivery Policy

**File:** `app/[locale]/sales-delivery/page.tsx`

**Spanish content:**

```
TÍTULO: Políticas de Venta y Entrega

SEGURIDAD
Utilizamos una variedad de medidas de seguridad de la información para proteger sus transacciones. Nuestro sistema encripta los datos para proteger pedidos que contienen nombres y direcciones.

TÉRMINOS DE ENTREGA
- Las entregas se realizan en la dirección proporcionada por el comprador dentro de los plazos acordados
- Los costos de envío al interior están sujetos a condiciones particulares y se declaran al momento de la compra
- El riesgo de envío corresponde al cliente
- Entregas a toda la República: 70% de anticipo, 30% al notificar el envío; la entrega es gratuita
- La disponibilidad del producto determina los tiempos de entrega
- Los precios y existencias están sujetos a cambio sin previo aviso

TIEMPOS DE PROCESAMIENTO
- El procesamiento inicia al recibir la orden de compra y el depósito bancario
- Los clientes deben enviar comprobante por correo a roger@countercultures.com.mx
- El envío de mercancía toma de 4 a 6 semanas para su entrega

PRECIOS
- Los precios de lista no incluyen IVA
- Los precios cotizados en dólares se convierten a moneda local al tipo de cambio del día según las tasas del sitio web
- Las cotizaciones son válidas por 7 días a partir de su emisión
- Los productos se entregan LAB (punto de destino)

REQUISITOS ADICIONALES
- Se requiere información completa de facturación y dirección de envío para el cumplimiento del pedido
- La facturación solo se permite dentro de los 5 días posteriores a la compra con comprobante
- De lo contrario, se factura como público en general

Contacto: roger@countercultures.com.mx
```

**English translation:**

```
TITLE: Sales & Delivery Policy

SECURITY
We use a variety of information security measures to protect your transactions. Our system encrypts data to protect orders containing names and addresses.

DELIVERY TERMS
- Deliveries are made to the address provided by the buyer within agreed timeframes
- Interior shipping costs are subject to particular conditions and are stated at the time of purchase
- Shipping risk belongs to the customer
- Republic-wide deliveries: 70% upfront payment, 30% upon shipment notification; delivery is free
- Product availability determines delivery timelines
- Prices and stock are subject to change without notice

PROCESSING TIMELINE
- Processing begins upon receipt of purchase orders and bank deposits
- Customers must email proof of payment to roger@countercultures.com.mx
- Merchandise shipment takes 4 to 6 weeks for delivery

PRICING
- List prices do not include VAT (IVA)
- Dollar-quoted prices are converted to local currency at the day's exchange rate per website rates
- Quotations are valid for 7 days from the date of issuance
- Products are delivered LAB (destination point)

ADDITIONAL REQUIREMENTS
- Complete billing and shipping address information is required for order fulfillment
- Invoicing is only permitted within 5 days of purchase with proof
- Otherwise, the order will be invoiced as "general public"

Contact: roger@countercultures.com.mx
```

---

### Page 4: Returns & Warranty Policy

**File:** `app/[locale]/returns-warranty/page.tsx`

**Spanish content:**

```
TÍTULO: Políticas de Devolución y Garantías

MERCANCÍA DAÑADA O INCORRECTA
Los intercambios físicos solo se aceptan si se reportan dentro de las 72 horas posteriores a la recepción.
Contacto: roger@countercultures.com.mx o (415) 154 8375

COBERTURA DE GARANTÍA
- Garantía eléctrica/electrónica: Válida por 30 días a partir de la recepción
- La garantía cubre reemplazo de piezas y reparaciones solo por defectos de fabricación

REQUISITOS DE DEVOLUCIÓN
- Todos los artículos deben ser devueltos en sus cajas originales con todos los accesorios
- Se requiere el empaque original

VERIFICACIÓN CON PROVEEDOR
Counter Cultures contacta a los proveedores para determinar la elegibilidad de la garantía.

DISPONIBILIDAD DE INVENTARIO
Si el producto no está disponible, se ofrece intercambio por un artículo equivalente o un reembolso del 75% al método de pago original.

CARGO OPERATIVO DEL 25%
Se aplica un cargo operativo del 25% a todas las devoluciones, cambios o cancelaciones.

EXCLUSIONES DE GARANTÍA
- Daño por mal uso, errores de instalación, vandalismo, accidentes, incendio o inundación
- Artículos abiertos por personal no autorizado
- Productos cerámicos (sin garantía; envío bajo riesgo del cliente)

COSTOS DE ENVÍO DE DEVOLUCIÓN
- Los clientes cubren todos los gastos de envío de devolución
- Dirección de devolución: San Juan 11A, Col. Providencia, San Miguel de Allende, Gto. México CP.37737

Ubicación: Providencia, San Miguel de Allende, Guanajuato, 37737
Horario: Lunes a Viernes 10 AM - 6 PM; Cerrado fines de semana
Contacto: equipo@countercultures.com.mx | 415.154.8375
```

**English translation:**

```
TITLE: Returns & Warranty Policy

DAMAGED OR INCORRECT MERCHANDISE
Physical exchanges are only accepted if reported within 72 hours of receipt.
Contact: roger@countercultures.com.mx or (415) 154 8375

WARRANTY COVERAGE
- Electrical/Electronic Warranty: Valid for 30 days from receipt
- Warranty covers parts replacement and repairs for manufacturing defects only

RETURN REQUIREMENTS
- All items must be returned in their original boxes with all accessories
- Original packaging is required

SUPPLIER VERIFICATION
Counter Cultures contacts suppliers to determine warranty eligibility.

STOCK AVAILABILITY
If the product is unavailable, an exchange for an equivalent item or a 75% refund to the original payment method will be offered.

25% OPERATIONAL FEE
A 25% operational fee is applied to all returns, exchanges, or cancellations.

WARRANTY EXCLUSIONS
- Damage from misuse, installation errors, vandalism, accidents, fire, or flooding
- Items opened by unauthorized personnel
- Ceramic products (no warranty; shipping at customer's risk)

RETURN SHIPPING COSTS
- Customers cover all return shipping expenses
- Return address: San Juan 11A, Col. Providencia, San Miguel de Allende, Gto. México CP.37737

Location: Providencia, San Miguel de Allende, Guanajuato, 37737
Hours: Monday–Friday 10 AM – 6 PM; Closed weekends
Contact: equipo@countercultures.com.mx | 415.154.8375
```

---

## Part 2: Update the Footer

**File:** `app/components/layout/footer.tsx`

Update the bottom bar (currently around line 172-191) to include all 4 policy links. Replace the current Privacy/Terms links:

**Current:**
```tsx
<Link href="/privacy">Privacy</Link>
<Link href="/terms">Terms</Link>
```

**Replace with (bilingual):**
```tsx
<Link href={`/${locale}/privacy`}>
  {lang === "es" ? "Privacidad" : "Privacy"}
</Link>
<Link href={`/${locale}/payment-methods`}>
  {lang === "es" ? "Métodos de Pago" : "Payment Methods"}
</Link>
<Link href={`/${locale}/sales-delivery`}>
  {lang === "es" ? "Venta y Entrega" : "Sales & Delivery"}
</Link>
<Link href={`/${locale}/returns-warranty`}>
  {lang === "es" ? "Devoluciones" : "Returns & Warranty"}
</Link>
```

Keep the same styling: `font-body text-xs text-brand-stone hover:text-brand-terracotta transition-colors`

On mobile, these should wrap gracefully — use `flex flex-wrap` on the container.

---

## Part 3: SEO Metadata for Each Page

Each page needs full bilingual metadata. Example for Privacy:

```typescript
export const generateMetadata = async ({ params }: PageProps): Promise<Metadata> => {
  const { locale } = await params;
  const isEs = locale === "es";

  const title = isEs ? "Política de Privacidad" : "Privacy Policy";
  const description = isEs
    ? "Aviso de privacidad de Counter Cultures. Cómo protegemos y utilizamos sus datos personales."
    : "Counter Cultures privacy notice. How we protect and use your personal data.";

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/privacy`,
      languages: {
        en: `${BASE_URL}/en/privacy`,
        es: `${BASE_URL}/es/privacy`,
        "x-default": `${BASE_URL}/en/privacy`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/privacy`,
      locale: isEs ? "es_MX" : "en_US",
      type: "website",
    },
  };
};
```

Repeat this pattern for each page with the appropriate titles/descriptions:

| Page | EN Title | ES Title |
|------|----------|----------|
| Privacy | Privacy Policy | Política de Privacidad |
| Payment Methods | Payment Methods | Métodos de Pago |
| Sales & Delivery | Sales & Delivery Policy | Políticas de Venta y Entrega |
| Returns & Warranty | Returns & Warranty Policy | Políticas de Devolución y Garantías |

---

## File Structure

```
app/[locale]/
├── privacy/
│   └── page.tsx
├── payment-methods/
│   └── page.tsx
├── sales-delivery/
│   └── page.tsx
├── returns-warranty/
│   └── page.tsx
```

---

## Design Notes

- These are text-heavy reading pages — keep them simple and elegant
- Use `max-w-3xl` container (not the full `max-w-7xl` used elsewhere)
- Generous vertical padding: `py-16 md:py-24`
- Add `pt-20` to account for the fixed header
- No hero sections needed — just a clean heading and body
- Use the numbered section pattern from the original site (1, 2, 3...)
- Contact info block at the bottom of each page with a top border separator
- All content is **hardcoded in the page files** (not from translation files) since this is legal content that rarely changes and needs exact wording

## Quality Checklist

- [ ] All 4 pages render correctly at `/en/[page]` and `/es/[page]`
- [ ] Spanish version shows original Spanish content, English shows translated content
- [ ] Footer links point to correct locale-prefixed routes
- [ ] Footer links work in both EN and ES
- [ ] SEO metadata is bilingual with correct canonical and alternate URLs
- [ ] Pages are responsive and readable on mobile
- [ ] `next build` completes without errors
- [ ] Typography uses brand tokens (font-display for headings, font-body for text)
- [ ] Contact email addresses are clickable `mailto:` links
- [ ] Phone number is a clickable `tel:` link
