"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  ShoppingBag,
  Lock,
  Check,
  Package,
  MapPin,
  Truck,
  AlertTriangle,
} from "lucide-react";
import { useCartStore, type ShippingMethod } from "@/app/lib/stores/cart-store";
import { useDisplayedMoney } from "@/app/lib/currency";
import { OrderSummary } from "@/app/components/cart/order-summary";
import { CurrencyToggle } from "@/app/components/cart/currency-toggle";
import {
  FacturaSection,
  EMPTY_FACTURA,
  type FacturaData,
} from "@/app/components/cart/factura-section";
import { computeIva } from "@/app/lib/iva";

const BUYABLE_THRESHOLD_MXN = 50_000;

const STEPS = {
  en: ["Contact", "Ship To", "Billing", "Review"],
  es: ["Contacto", "Envío", "Facturación", "Revisar"],
};

const T = {
  en: {
    eyebrow: "Secure Checkout",
    headline: (step: number) =>
      step === 0
        ? "Tell us how to reach you"
        : step === 1
          ? "Where should this ship?"
          : step === 2
            ? "Billing & invoicing"
            : "Review and place your request",
    subhead: (step: number) =>
      step === 0
        ? "We'll send your quote and updates by email or WhatsApp — your call."
        : step === 2
          ? "If your billing address differs from shipping, switch the toggle. Need a CFDI invoice? Toggle factura on below."
          : step === 3
            ? "Last look. You won't be charged until you authorize on the next screen."
            : "",
    company: "Company / firm",
    firstName: "First name *",
    lastName: "Last name(s) *",
    email: "Email *",
    phone: "Phone / WhatsApp",
    waOptIn: "Send order updates via WhatsApp on this number",
    waOptInHint:
      "Share updates via WhatsApp — we may also send you occasional offers and product news. Uncheck below if you'd prefer order-only messages.",
    marketingOptIn: "Send me special offers and updates",
    line1: "Address line 1 *",
    line2: "Address line 2",
    colonia: "Colonia",
    city: "City *",
    state: "State *",
    postal: "Postal code *",
    country: "Country *",
    mexico: "Mexico",
    us: "United States",
    deliveryNotes: "Delivery notes",
    deliveryNotesHint:
      "Anything the courier should know — e.g. \"Black door, not red. Doorbell broken — call on arrival.\"",
    sameAsShipping: "Billing address is the same as shipping",
    billingHeader: "Billing address",
    reviewTitle: "Review your order",
    contactSummary: "Contact",
    shipSummary: "Ship to",
    billingSummary: "Billing",
    facturaSummary: "Factura",
    edit: "Edit",
    facturaWillIssue: "We'll issue a CFDI",
    noFactura: "No factura requested",
    sameAsShippingShort: "Same as shipping",
    subtotal: "Subtotal",
    iva: "IVA (16%)",
    ivaNote: "Applied for Mexico delivery",
    shipping: "Shipping",
    shippingNote: "Quoted after review",
    total: "Estimated total",
    termsTitle: "Terms of Service",
    privacyTitle: "Privacy Policy",
    readMore: "Read full version",
    agreeIntro: "I agree to the",
    termsLinkLabel: "Terms of Service",
    privacyLinkLabel: "Privacy Policy",
    and: "and",
    profecoNote:
      "Per PROFECO, all electronic transactions in Mexico are protected by the Ley Federal de Protección al Consumidor.",
    payNow: "Pay Now",
    submitQuote: "Submit Quote Request",
    submitting: "Submitting…",
    next: "Continue",
    back: "Back",
    required: "This field is required",
    invalidEmail: "Enter a valid email",
    invalidRfc: "RFC should be 12 or 13 characters",
    invalidCp: "Enter a 5-digit postal code",
    emptyCart: "Your cart is empty",
    browseShop: "Browse Shop",
    secure: "Secure checkout",
    yourOrder: "Your Order",
    showOrder: "Show order summary",
    hideOrder: "Hide order summary",
    shippingMethodLabel: "Shipping method",
    localPickup: "Local pickup (SMA showroom)",
    localPickupDesc: "Pick up at our San Miguel de Allende showroom. We'll email you when ready.",
    smaDelivery: "Local delivery in SMA",
    smaDeliveryDesc: "Free delivery within San Miguel de Allende. We'll schedule with you.",
    shipFedex: "Ship via FedEx Economy (Skydropx)",
    shipFedexLoading: "Getting a live rate…",
    shipFedexError: "Couldn't get a live rate — we'll quote it manually after order review.",
    customFreight: "Custom freight quote (oversized item)",
    customFreightDesc: "This order contains an oversized item (e.g., bathtub). Our team shops freight quotes from multiple carriers — we'll send you options within 24 hours.",
  },
  es: {
    eyebrow: "Pago Seguro",
    headline: (step: number) =>
      step === 0
        ? "¿Cómo te contactamos?"
        : step === 1
          ? "¿A dónde lo enviamos?"
          : step === 2
            ? "Facturación"
            : "Revisa y envía tu solicitud",
    subhead: (step: number) =>
      step === 0
        ? "Te enviaremos tu cotización y avisos por correo o WhatsApp — tú eliges."
        : step === 2
          ? "Si tu dirección de facturación es distinta a la de envío, desactiva el toggle. ¿Necesitas CFDI? Activa la factura abajo."
          : step === 3
            ? "Una última revisión. No se cobra nada hasta que autorices en la siguiente pantalla."
            : "",
    company: "Empresa / despacho",
    firstName: "Nombre(s) *",
    lastName: "Apellido(s) *",
    email: "Correo electrónico *",
    phone: "Teléfono / WhatsApp",
    waOptIn: "Enviar avisos del pedido por WhatsApp a este número",
    waOptInHint:
      "Compartiremos novedades por WhatsApp — también podríamos enviarte ofertas y noticias de productos. Desmarca abajo si prefieres solo mensajes del pedido.",
    marketingOptIn: "Envíame ofertas especiales y novedades",
    line1: "Dirección línea 1 *",
    line2: "Dirección línea 2",
    colonia: "Colonia",
    city: "Ciudad *",
    state: "Estado *",
    postal: "Código postal *",
    country: "País *",
    mexico: "México",
    us: "Estados Unidos",
    deliveryNotes: "Notas para entrega",
    deliveryNotesHint:
      "Lo que deba saber el repartidor — p. ej. \"Puerta negra, no roja. Timbre descompuesto — llama al llegar.\"",
    sameAsShipping: "La dirección de facturación es la misma que la de envío",
    billingHeader: "Dirección de facturación",
    reviewTitle: "Revisa tu pedido",
    contactSummary: "Contacto",
    shipSummary: "Envío",
    billingSummary: "Facturación",
    facturaSummary: "Factura",
    edit: "Editar",
    facturaWillIssue: "Emitiremos un CFDI",
    noFactura: "Sin factura solicitada",
    sameAsShippingShort: "Igual a envío",
    subtotal: "Subtotal",
    iva: "IVA (16%)",
    ivaNote: "Aplicado para envíos a México",
    shipping: "Envío",
    shippingNote: "Cotizado tras revisión",
    total: "Total estimado",
    termsTitle: "Términos de Servicio",
    privacyTitle: "Aviso de Privacidad",
    readMore: "Ver versión completa",
    agreeIntro: "Acepto los",
    termsLinkLabel: "Términos de Servicio",
    privacyLinkLabel: "Aviso de Privacidad",
    and: "y el",
    profecoNote:
      "Conforme a PROFECO, todas las transacciones electrónicas en México están protegidas por la Ley Federal de Protección al Consumidor.",
    payNow: "Pagar Ahora",
    submitQuote: "Enviar Solicitud de Cotización",
    submitting: "Enviando…",
    next: "Continuar",
    back: "Atrás",
    required: "Campo requerido",
    invalidEmail: "Ingresa un correo válido",
    invalidRfc: "El RFC debe tener 12 o 13 caracteres",
    invalidCp: "Ingresa un código postal de 5 dígitos",
    emptyCart: "Tu carrito está vacío",
    browseShop: "Ver Tienda",
    secure: "Pago seguro",
    yourOrder: "Tu Pedido",
    showOrder: "Ver resumen del pedido",
    hideOrder: "Ocultar resumen del pedido",
    shippingMethodLabel: "Método de envío",
    localPickup: "Recoger en showroom (SMA)",
    localPickupDesc: "Recoge en nuestro showroom de San Miguel de Allende. Te avisaremos por correo cuando esté listo.",
    smaDelivery: "Entrega local en SMA",
    smaDeliveryDesc: "Entrega gratuita dentro de San Miguel de Allende. Coordinaremos contigo.",
    shipFedex: "Envío por FedEx Economy (Skydropx)",
    shipFedexLoading: "Obteniendo tarifa en vivo…",
    shipFedexError: "No pudimos obtener tarifa — la cotizaremos manualmente tras revisar tu pedido.",
    customFreight: "Cotización de flete especial (artículo sobredimensionado)",
    customFreightDesc: "Tu pedido contiene un artículo sobredimensionado (ej. bañera). Nuestro equipo busca las mejores opciones de flete — te enviaremos opciones en 24 horas.",
  },
};

// ──────────────────────────────────────────────────────────────────
// Inline terms + privacy text (summarized for in-checkout reading).
// Source: docs/legal/* — keep in sync if those change.
// ──────────────────────────────────────────────────────────────────

const TERMS_TEXT = {
  en: [
    "These Terms govern your purchase from Counter Cultures S.A. de C.V. (\"Counter Cultures\"). By submitting an order or quote request, you agree to be bound by these Terms and our Privacy Policy.",
    "Quotes are valid for 14 days unless otherwise stated. Pricing is subject to change due to currency, freight, or supplier adjustments and will be confirmed in writing before any charge.",
    "All sales are final after order confirmation. Returns of stocked items may be accepted within 14 days of delivery, in original condition, subject to a restocking fee. Made-to-order, custom, and quote-only items are non-returnable.",
    "Lead times shown are estimates from the manufacturer and are not guaranteed. Counter Cultures is not liable for delays caused by suppliers, customs, or freight carriers.",
    "Shipping is quoted separately after order review. Risk of loss transfers to you upon delivery. Damages must be reported within 48 hours.",
    "Trade pricing is confidential and may not be resold or shared. Misuse may result in revocation of trade access.",
    "Mexican consumers are protected by the Ley Federal de Protección al Consumidor (PROFECO). Disputes will be resolved under the laws of Mexico, in the courts of San Miguel de Allende, Guanajuato.",
  ],
  es: [
    "Estos Términos rigen tu compra a Counter Cultures S.A. de C.V. (\"Counter Cultures\"). Al enviar un pedido o solicitud de cotización, aceptas estos Términos y nuestro Aviso de Privacidad.",
    "Las cotizaciones tienen vigencia de 14 días salvo se indique lo contrario. Los precios pueden cambiar por tipo de cambio, flete o ajustes del proveedor y se confirmarán por escrito antes de cualquier cargo.",
    "Todas las ventas son finales tras la confirmación. Las devoluciones de productos en stock pueden aceptarse dentro de 14 días de la entrega, en condición original y sujetas a cargo de reposición. Los productos hechos a la medida, personalizados o solo bajo cotización no son retornables.",
    "Los plazos mostrados son estimados del fabricante y no son garantizados. Counter Cultures no es responsable por retrasos causados por proveedores, aduana o transportistas.",
    "El envío se cotiza por separado tras la revisión del pedido. El riesgo de pérdida se transfiere al cliente al momento de la entrega. Los daños deben reportarse dentro de 48 horas.",
    "Los precios trade son confidenciales y no pueden ser revendidos o compartidos. El uso indebido puede resultar en la revocación del acceso trade.",
    "Los consumidores mexicanos están protegidos por la Ley Federal de Protección al Consumidor (PROFECO). Las controversias se resolverán bajo las leyes de México, en los tribunales de San Miguel de Allende, Guanajuato.",
  ],
};

const PRIVACY_TEXT = {
  en: [
    "Counter Cultures S.A. de C.V. is the data controller (\"responsable\") for personal data you provide. This notice complies with the Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).",
    "We collect: name, contact details (email, phone), shipping and billing address, RFC and tax-related data when you request factura, and order history. We do not collect or store payment card numbers — those are handled by Stripe.",
    "We use your data to process and fulfill orders, issue CFDIs, communicate quote and order status, and improve our service. With your opt-in we may send marketing about new collections; you can unsubscribe at any time.",
    "We share data only with service providers necessary to fulfill your order: Stripe (payments), Odoo (order management), Google (email delivery), Meta (WhatsApp messaging), and authorized couriers. We do not sell your data.",
    "You have ARCO rights (Acceso, Rectificación, Cancelación, Oposición) plus the right to revoke consent and limit use. Submit requests to privacidad@countercultures.com.mx.",
    "Data is retained for the period required by Mexican commercial and tax law (5 years for invoiced transactions). After that period, data is deleted or anonymized.",
    "We use cookies and similar technologies for analytics and personalization. You can disable cookies in your browser settings; some site features may be limited as a result.",
  ],
  es: [
    "Counter Cultures S.A. de C.V. es el responsable del tratamiento de los datos personales que proporciones. Este aviso cumple con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).",
    "Recopilamos: nombre, datos de contacto (correo, teléfono), dirección de envío y facturación, RFC y datos fiscales cuando solicitas factura, e historial de pedidos. No recopilamos ni almacenamos números de tarjeta — los procesa Stripe.",
    "Usamos tus datos para procesar y cumplir pedidos, emitir CFDIs, comunicar el estatus de cotizaciones y pedidos, y mejorar nuestro servicio. Con tu consentimiento podemos enviarte marketing sobre nuevas colecciones; puedes darte de baja en cualquier momento.",
    "Compartimos datos solo con proveedores necesarios para cumplir tu pedido: Stripe (pagos), Odoo (gestión de pedidos), Google (correo), Meta (WhatsApp) y mensajeros autorizados. No vendemos tus datos.",
    "Tienes derechos ARCO (Acceso, Rectificación, Cancelación, Oposición) además del derecho a revocar el consentimiento y limitar el uso. Envía solicitudes a privacidad@countercultures.com.mx.",
    "Los datos se conservan por el periodo requerido por la legislación comercial y fiscal mexicana (5 años para transacciones facturadas). Tras ese periodo, los datos se eliminan o anonimizan.",
    "Usamos cookies y tecnologías similares para analítica y personalización. Puedes desactivar las cookies en tu navegador; algunas funciones del sitio pueden verse limitadas.",
  ],
};

interface ContactForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  // True = customer is OK getting WhatsApp updates on their phone number.
  // We derive the legacy `channelPreference` ("email" | "whatsapp" | "both")
  // at submit-time so the API stays unchanged.
  whatsappOptIn: boolean;
  marketingOptIn: boolean;
}

interface AddressForm {
  line1: string;
  line2: string;
  colonia: string;
  city: string;
  state: string;
  postal: string;
  country: "MX" | "US";
  deliveryNotes: string;
}

interface BillingForm {
  sameAsShipping: boolean;
  line1: string;
  line2: string;
  colonia: string;
  city: string;
  state: string;
  postal: string;
  country: "MX" | "US";
}

const RFC_REGEX = /^([A-ZÑ&]{3,4})(\d{6})([A-Z\d]{3})$/;

export const CheckoutStepper = ({ locale }: { locale: "en" | "es" }) => {
  const t = T[locale];
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [redirectingToPayment, setRedirectingToPayment] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const cartMode = useCartStore((s) => s.cartMode());
  const cartSessionId = useCartStore((s) => s.cartSessionId);
  const tradeCode = useCartStore((s) => s.tradeCode);
  const clear = useCartStore((s) => s.clear);
  const hasOversized = useCartStore((s) => s.hasOversized());
  const setShipping = useCartStore((s) => s.setShipping);

  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>(
    hasOversized ? "custom_freight" : "local_pickup"
  );
  const [shippingQuote, setShippingQuote] = useState<number | null>(null);
  const [shippingQuoteLoading, setShippingQuoteLoading] = useState(false);
  const [shippingQuoteError, setShippingQuoteError] = useState(false);
  const [shippingQuoteLabel, setShippingQuoteLabel] = useState("");

  const [contact, setContact] = useState<ContactForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: locale === "es" ? "+52 " : "",
    company: "",
    whatsappOptIn: true,
    marketingOptIn: true,
  });

  const [address, setAddress] = useState<AddressForm>({
    line1: "",
    line2: "",
    colonia: "",
    city: "",
    state: "",
    postal: "",
    country: "MX",
    deliveryNotes: "",
  });

  const [billing, setBilling] = useState<BillingForm>({
    sameAsShipping: true,
    line1: "",
    line2: "",
    colonia: "",
    city: "",
    state: "",
    postal: "",
    country: "MX",
  });

  const [factura, setFactura] = useState<FacturaData>(EMPTY_FACTURA);

  const fetchShippingQuote = async () => {
    if (!address.postal || address.postal.length < 5) return;
    setShippingQuoteLoading(true);
    setShippingQuoteError(false);
    try {
      const res = await fetch("/api/shipping/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ quantity: i.quantity })),
          address: { postal: address.postal, country: address.country },
        }),
      });
      const data = await res.json();
      const rates = data.rates as Array<{
        carrier: string;
        service: string;
        amount_mxn: number;
      }>;
      if (rates && rates.length > 0) {
        const economy = rates.find(
          (r) => r.carrier === "fedex" && r.service === "economy"
        );
        const best = economy ?? rates[0];
        setShippingQuote(best.amount_mxn);
        setShippingQuoteLabel(
          `${best.carrier.toUpperCase()} ${best.service}`
        );
        setShipping("ship", best.amount_mxn);
      } else {
        setShippingQuoteError(true);
        setShippingQuote(null);
      }
    } catch {
      setShippingQuoteError(true);
      setShippingQuote(null);
    } finally {
      setShippingQuoteLoading(false);
    }
  };

  // SSR-safe mount guard for zustand-persist cart store (see CART-RULES rule 42).
  // The lint rule prefers useSyncExternalStore, but the codebase convention
  // here is the mount flag — same as cart-icon-button.tsx.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Cinematic crop for the left rail — uses the most recently added item's
  // image so the customer literally sees what they're buying as the
  // atmospheric anchor of the page.
  const heroItem = useMemo(
    () => [...items].sort((a, b) => b.addedAt - a.addedAt)[0],
    [items]
  );

  // Hook MUST be called before any conditional return.
  const sourceCurrency = items[0]?.currency ?? "MXN";
  const { format: formatted } = useDisplayedMoney({
    sourceCurrency,
    locale,
  });

  if (!mounted) {
    return (
      <div className="cc-paper min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-stone/20 border-t-brand-terracotta rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="cc-paper min-h-[70vh]">
        <div className="mx-auto max-w-xl px-4 py-24 flex flex-col items-center text-center">
          <div className="w-16 h-16 flex items-center justify-center rounded-full bg-brand-copper/10 mb-5">
            <ShoppingBag className="w-7 h-7 text-brand-copper" />
          </div>
          <p className="font-display text-2xl font-light text-brand-charcoal">
            {t.emptyCart}
          </p>
          <NextLink
            href={`/${locale}/shop`}
            className="mt-6 px-8 py-3 bg-brand-charcoal text-white font-body text-sm font-medium tracking-wider hover:bg-brand-terracotta transition-colors"
          >
            {t.browseShop}
          </NextLink>
        </div>
      </div>
    );
  }

  const isMxShipTo = address.country === "MX";
  const { iva: ivaAmount, subtotal: productSubtotal } = computeIva(subtotal, address.country);
  const effectiveShippingCost =
    shippingMethod === "ship" && shippingQuote != null ? shippingQuote : 0;
  const total = subtotal + effectiveShippingCost;
  const isBuyPath =
    !hasOversized &&
    cartMode === "all_buyable" &&
    (sourceCurrency === "MXN"
      ? total < BUYABLE_THRESHOLD_MXN
      : total < BUYABLE_THRESHOLD_MXN / 20);

  const validateStep = (): boolean => {
    const e: Record<string, string> = {};
    if (step === 0) {
      if (!contact.firstName.trim()) e.firstName = t.required;
      if (!contact.lastName.trim()) e.lastName = t.required;
      if (
        !contact.email.trim() ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)
      )
        e.email = t.invalidEmail;
    }
    if (step === 1) {
      if (!address.line1.trim()) e.line1 = t.required;
      if (!address.city.trim()) e.city = t.required;
      if (!address.state.trim()) e.state = t.required;
      if (!address.postal.trim()) e.postal = t.required;
    }
    if (step === 2) {
      if (!billing.sameAsShipping) {
        if (!billing.line1.trim()) e.bLine1 = t.required;
        if (!billing.city.trim()) e.bCity = t.required;
        if (!billing.state.trim()) e.bState = t.required;
        if (!billing.postal.trim()) e.bPostal = t.required;
      }
      if (factura.enabled) {
        if (!factura.rfc.trim() || !RFC_REGEX.test(factura.rfc))
          e.rfc = t.invalidRfc;
        if (!factura.razonSocial.trim()) e.razonSocial = t.required;
        if (!factura.regimenFiscal) e.regimenFiscal = t.required;
        if (!factura.usoCfdi) e.usoCfdi = t.required;
        if (!factura.cpFiscal.trim() || factura.cpFiscal.length !== 5)
          e.cpFiscal = t.invalidCp;
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep((s) => Math.min(s + 1, 3));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    if (!termsAccepted) return;
    setSubmitError(null);
    setSubmitting(true);

    // Effective billing — when "same as shipping" is on, copy shipping (minus
    // delivery notes which only apply to the courier, not the invoice).
    const effectiveBilling = billing.sameAsShipping
      ? {
          sameAsShipping: true,
          line1: address.line1,
          line2: address.line2,
          colonia: address.colonia,
          city: address.city,
          state: address.state,
          postal: address.postal,
          country: address.country,
        }
      : billing;

    const fullName = `${contact.firstName} ${contact.lastName}`.trim();

    // Derive legacy channelPreference from the WhatsApp checkbox so the
    // existing /api/checkout/* handlers and Customer_Preferences write-
    // through keep working without a schema change.
    //   no phone     → email
    //   phone, no WA → email
    //   phone, +WA   → both
    const hasPhone = !!contact.phone.trim();
    const channelPreference: "email" | "whatsapp" | "both" =
      hasPhone && contact.whatsappOptIn ? "both" : "email";

    const payload = {
      locale,
      contact: {
        // Keep `name` for API backwards compat; also send the split parts so
        // we can persist them properly when the API schema evolves.
        name: fullName,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        channelPreference,
        whatsappOptIn: contact.whatsappOptIn,
        marketingOptIn: contact.marketingOptIn,
        commLocale: locale,
      },
      address: {
        ...address,
        // Embed factura + billing in the address JSON blob — the API stores
        // this column as raw JSON, so we don't need a schema migration.
        billing: effectiveBilling,
        factura: factura.enabled ? factura : null,
      },
      // Project step was removed from the UI; send empty stub so the existing
      // /api/checkout/quote handler keeps working unchanged.
      project: {
        projectName: "",
        room: "",
        timeline: "",
        notes: "",
        isTrade: items.some((i) => i.tradePrice != null && i.tradePrice > 0),
      },
      items: items.map((i) => ({
        productId: i.id,
        sku: i.sku,
        name: i.name,
        brand: i.brand,
        quantity: i.quantity,
        listPrice: i.listPrice,
        tradePrice: i.tradePrice,
        selectedFinish: i.selectedFinish,
        notes: i.notes,
        buyable: i.buyable,
        availability: i.availability,
      })),
      cartSessionId,
      tradeCode: tradeCode ?? null,
      mode: isBuyPath ? "buy" : "quote",
      subtotal,
      ivaAmount,
      total,
      currency: sourceCurrency,
      shippingMethod,
      shippingCost: effectiveShippingCost,
      requiresFreightQuote: hasOversized,
    };

    const attemptCheckout = async (attempt: number): Promise<void> => {
      const endpoint = isBuyPath ? "/api/checkout/buy" : "/api/checkout/quote";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        if (attempt < 2 && res.status >= 500) {
          await new Promise((r) => setTimeout(r, 1000));
          return attemptCheckout(attempt + 1);
        }
        setSubmitError(
          data.error ||
            (locale === "es"
              ? "Error al enviar. Intenta de nuevo."
              : "Something went wrong. Please try again.")
        );
        setSubmitting(false);
        return;
      }

      if (isBuyPath && data.stripeUrl) {
        setRedirectingToPayment(true);
        window.location.href = data.stripeUrl;
      } else if (data.dealId) {
        clear();
        const trackerParam = data.trackerUrl
          ? `?tracker=${encodeURIComponent(data.trackerUrl)}`
          : "";
        router.push(
          `/${locale}/checkout/submitted/${data.dealId}${trackerParam}`
        );
      } else {
        setSubmitError(
          locale === "es"
            ? "Respuesta inesperada. Intenta de nuevo."
            : "Unexpected response. Please try again."
        );
        setSubmitting(false);
      }
    };

    try {
      await attemptCheckout(1);
    } catch {
      setSubmitError(
        locale === "es"
          ? "Error de conexión. Intenta de nuevo."
          : "Connection error. Please try again."
      );
      setSubmitting(false);
    }
  };

  const formatAddress = (a: {
    line1: string;
    line2: string;
    colonia: string;
    city: string;
    state: string;
    postal: string;
    country: string;
  }) => {
    const lineA = [a.line1, a.line2].filter(Boolean).join(", ");
    const lineB = [a.colonia, a.city, a.state, a.postal]
      .filter(Boolean)
      .join(", ");
    return { lineA, lineB, country: a.country };
  };

  if (redirectingToPayment) {
    return (
      <div className="cc-paper min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-copper mx-auto mb-4" />
          <p className="font-body text-sm text-brand-charcoal">
            {locale === "es"
              ? "Redirigiendo al pago seguro…"
              : "Redirecting to secure payment…"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="cc-paper min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Eyebrow + currency toggle + secure pill */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <p className="font-body text-xs uppercase tracking-[0.22em] text-brand-copper">
            {t.eyebrow}
          </p>
          <div className="flex items-center gap-3">
            <CurrencyToggle variant="outlined" />
            <div className="inline-flex items-center gap-1.5 font-body text-xs text-dash-text-secondary">
              <Lock className="w-3.5 h-3.5" />
              {t.secure}
            </div>
          </div>
        </div>

        {/* Mobile summary toggle (hidden on lg+) */}
        <details
          className="lg:hidden mb-5 cc-surface-card overflow-hidden"
          open={mobileSummaryOpen}
          onToggle={(e) => setMobileSummaryOpen((e.target as HTMLDetailsElement).open)}
        >
          <summary className="px-5 py-4 cursor-pointer flex items-center justify-between list-none">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-4 h-4 text-brand-copper" />
              <span className="font-body text-sm font-medium text-brand-charcoal">
                {t.yourOrder}
              </span>
              <span className="font-body text-xs text-dash-text-secondary">
                {items.length}
              </span>
            </div>
            <span className="font-display text-lg text-brand-charcoal tabular-nums">
              {formatted(total)}
            </span>
          </summary>
          <div className="px-5 pb-5 pt-1">
            <OrderSummary
              locale={locale}
              variant="inline"
              density="full"
              isMxShipTo={isMxShipTo}
              ivaAmount={ivaAmount}
              productSubtotal={productSubtotal}
              shippingMethod={shippingMethod}
              shippingCost={effectiveShippingCost > 0 ? effectiveShippingCost : undefined}
            />
          </div>
        </details>

        {/* Two-column shell */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_22rem] xl:grid-cols-[1fr_24rem] gap-8 lg:gap-12">
          {/* ────────── LEFT: Form rail ────────── */}
          <div className="min-w-0">
            {/* Stepper */}
            <nav
              aria-label="Checkout progress"
              className="flex items-center mb-8"
            >
              {STEPS[locale].map((label, i) => (
                <div
                  key={label}
                  className="flex items-center flex-1 last:flex-none"
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      aria-current={i === step ? "step" : undefined}
                      className={`w-8 h-8 flex items-center justify-center font-mono text-xs transition-all ${
                        i < step
                          ? "bg-brand-sage text-white shadow-sm"
                          : i === step
                            ? "bg-brand-terracotta text-white shadow-md ring-4 ring-brand-terracotta/15"
                            : "bg-brand-stone/15 text-brand-stone"
                      }`}
                    >
                      {i < step ? (
                        <Check className="w-4 h-4" strokeWidth={2.5} />
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span
                      className={`font-body text-[11px] sm:text-xs tracking-wide ${
                        i <= step ? "text-brand-charcoal" : "text-brand-stone"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  {i < 3 && (
                    <div className="flex-1 h-px bg-brand-stone/20 mx-2 sm:mx-3 mt-[-18px]" />
                  )}
                </div>
              ))}
            </nav>

            {/* Headline + subhead */}
            <header className="mb-7">
              <h1 className="font-display text-2xl md:text-3xl font-light text-brand-charcoal tracking-wide leading-tight">
                {t.headline(step)}
              </h1>
              {t.subhead(step) && (
                <p className="mt-2 font-body text-sm text-dash-text-secondary leading-relaxed max-w-md">
                  {t.subhead(step)}
                </p>
              )}
              <div className="cc-rule-copper mt-5" />
            </header>

            {/* ─── Form panel ─── */}
            <div className="cc-surface-card p-6 md:p-8">
              {/* Step 0: Contact */}
              {step === 0 && (
                <div className="space-y-5">
                  <Input
                    label={t.company}
                    value={contact.company}
                    onChange={(v) => setContact({ ...contact, company: v })}
                    autoComplete="organization"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label={t.firstName}
                      value={contact.firstName}
                      error={errors.firstName}
                      onChange={(v) =>
                        setContact({ ...contact, firstName: v })
                      }
                      autoComplete="given-name"
                    />
                    <Input
                      label={t.lastName}
                      value={contact.lastName}
                      error={errors.lastName}
                      onChange={(v) =>
                        setContact({ ...contact, lastName: v })
                      }
                      autoComplete="family-name"
                    />
                  </div>
                  <Input
                    label={t.email}
                    type="email"
                    value={contact.email}
                    error={errors.email}
                    onChange={(v) => setContact({ ...contact, email: v })}
                    autoComplete="email"
                  />
                  <div>
                    <Input
                      label={t.phone}
                      value={contact.phone}
                      onChange={(v) => setContact({ ...contact, phone: v })}
                      autoComplete="tel"
                      placeholder="+52 415 154 8375"
                    />
                    {/* WhatsApp opt-in directly under the phone field —
                        cleaner pattern for MX buyers than a separate
                        "channel preference" picker. */}
                    <label className="mt-2.5 flex items-start gap-2.5 cursor-pointer p-2.5 -mx-1 hover:bg-brand-linen/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={contact.whatsappOptIn}
                        onChange={(e) =>
                          setContact({
                            ...contact,
                            whatsappOptIn: e.target.checked,
                          })
                        }
                        className="w-4 h-4 mt-0.5 accent-brand-terracotta shrink-0"
                      />
                      <span className="font-body text-sm text-brand-charcoal leading-snug">
                        {t.waOptIn}
                        <span className="block mt-0.5 font-body text-xs text-dash-text-secondary">
                          {t.waOptInHint}
                        </span>
                      </span>
                    </label>
                    <label className="mt-1 flex items-start gap-2.5 cursor-pointer p-2.5 -mx-1 hover:bg-brand-linen/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={contact.marketingOptIn}
                        onChange={(e) =>
                          setContact({
                            ...contact,
                            marketingOptIn: e.target.checked,
                          })
                        }
                        className="w-4 h-4 mt-0.5 accent-brand-terracotta shrink-0"
                      />
                      <span className="font-body text-sm text-brand-charcoal leading-snug">
                        {t.marketingOptIn}
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Step 1: Ship To */}
              {step === 1 && (
                <div className="space-y-5">
                  <Input
                    label={t.line1}
                    value={address.line1}
                    error={errors.line1}
                    onChange={(v) => setAddress({ ...address, line1: v })}
                    autoComplete="address-line1"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label={t.line2}
                      value={address.line2}
                      onChange={(v) => setAddress({ ...address, line2: v })}
                      autoComplete="address-line2"
                    />
                    <Input
                      label={t.colonia}
                      value={address.colonia}
                      onChange={(v) => setAddress({ ...address, colonia: v })}
                      autoComplete="address-level3"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label={t.city}
                      value={address.city}
                      error={errors.city}
                      onChange={(v) => setAddress({ ...address, city: v })}
                      autoComplete="address-level2"
                    />
                    <Input
                      label={t.state}
                      value={address.state}
                      error={errors.state}
                      onChange={(v) => setAddress({ ...address, state: v })}
                      autoComplete="address-level1"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label={t.postal}
                      value={address.postal}
                      error={errors.postal}
                      onChange={(v) => setAddress({ ...address, postal: v })}
                      autoComplete="postal-code"
                      maxLength={6}
                    />
                    <Select
                      label={t.country}
                      value={address.country}
                      onChange={(v) =>
                        setAddress({ ...address, country: v as "MX" | "US" })
                      }
                      options={[
                        { value: "MX", label: t.mexico },
                        { value: "US", label: t.us },
                      ]}
                    />
                  </div>

                  {/* Delivery notes */}
                  <div>
                    <label className="block font-body text-xs tracking-wide text-dash-text-secondary mb-1.5">
                      {t.deliveryNotes}
                    </label>
                    <textarea
                      value={address.deliveryNotes}
                      onChange={(e) =>
                        setAddress({
                          ...address,
                          deliveryNotes: e.target.value,
                        })
                      }
                      rows={3}
                      maxLength={400}
                      placeholder={t.deliveryNotesHint}
                      className="w-full px-3 py-2.5 font-body text-sm bg-white border border-brand-stone/25 focus:border-brand-copper focus:outline-none focus:ring-1 focus:ring-brand-copper/20 resize-none placeholder:text-brand-stone/50"
                    />
                  </div>

                  {/* ─── Shipping method picker ─── */}
                  <div className="pt-2">
                    <p className="font-body text-[11px] uppercase tracking-[0.2em] text-brand-copper mb-3">
                      {t.shippingMethodLabel}
                    </p>

                    {hasOversized && (
                      <div className="mb-4 px-4 py-3 bg-dash-warn-soft border-l-2 border-dash-warn flex gap-3">
                        <AlertTriangle className="w-4 h-4 text-dash-warn shrink-0 mt-0.5" />
                        <p className="font-body text-sm text-brand-charcoal/80">
                          {t.customFreightDesc}
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      {!hasOversized && (
                        <>
                          <ShippingOption
                            value="local_pickup"
                            selected={shippingMethod}
                            onSelect={(v) => {
                              setShippingMethod(v);
                              setShipping(v, 0);
                            }}
                            icon={<MapPin className="w-4 h-4" />}
                            label={t.localPickup}
                            description={t.localPickupDesc}
                            price={formatted(0)}
                          />
                          <ShippingOption
                            value="sma_delivery"
                            selected={shippingMethod}
                            onSelect={(v) => {
                              setShippingMethod(v);
                              setShipping(v, 0);
                            }}
                            icon={<Package className="w-4 h-4" />}
                            label={t.smaDelivery}
                            description={t.smaDeliveryDesc}
                            price={formatted(0)}
                          />
                          <ShippingOption
                            value="ship"
                            selected={shippingMethod}
                            onSelect={(v) => {
                              setShippingMethod(v);
                              if (shippingQuote != null) {
                                setShipping(v, shippingQuote);
                              } else {
                                fetchShippingQuote();
                              }
                            }}
                            icon={<Truck className="w-4 h-4" />}
                            label={
                              shippingQuoteLabel
                                ? `${t.shipFedex} — ${shippingQuoteLabel}`
                                : t.shipFedex
                            }
                            description={
                              shippingQuoteLoading
                                ? t.shipFedexLoading
                                : shippingQuoteError
                                  ? t.shipFedexError
                                  : undefined
                            }
                            price={
                              shippingQuoteLoading
                                ? "…"
                                : shippingQuote != null
                                  ? formatted(shippingQuote)
                                  : undefined
                            }
                            loading={shippingQuoteLoading}
                          />
                        </>
                      )}

                      {hasOversized && (
                        <ShippingOption
                          value="custom_freight"
                          selected="custom_freight"
                          onSelect={() => {}}
                          icon={<Truck className="w-4 h-4" />}
                          label={t.customFreight}
                          disabled
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Billing + Factura */}
              {step === 2 && (
                <div className="space-y-6">
                  {/* Same-as-shipping toggle */}
                  <div className="flex items-start gap-3 p-4 border border-brand-stone/15 bg-brand-linen/40">
                    <button
                      type="button"
                      onClick={() =>
                        setBilling({
                          ...billing,
                          sameAsShipping: !billing.sameAsShipping,
                        })
                      }
                      aria-pressed={billing.sameAsShipping}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-copper/40 focus:ring-offset-2 focus:ring-offset-brand-linen mt-0.5 ${
                        billing.sameAsShipping
                          ? "bg-brand-copper"
                          : "bg-brand-stone/30"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                          billing.sameAsShipping
                            ? "translate-x-5"
                            : "translate-x-0.5"
                        }`}
                      />
                    </button>
                    <p className="font-body text-sm text-brand-charcoal flex-1">
                      {t.sameAsShipping}
                    </p>
                  </div>

                  {/* Billing address (when toggle off) */}
                  {!billing.sameAsShipping && (
                    <div className="space-y-5 cc-item-in">
                      <p className="font-body text-[11px] uppercase tracking-[0.2em] text-brand-copper">
                        {t.billingHeader}
                      </p>
                      <Input
                        label={t.line1}
                        value={billing.line1}
                        error={errors.bLine1}
                        onChange={(v) => setBilling({ ...billing, line1: v })}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label={t.line2}
                          value={billing.line2}
                          onChange={(v) =>
                            setBilling({ ...billing, line2: v })
                          }
                        />
                        <Input
                          label={t.colonia}
                          value={billing.colonia}
                          onChange={(v) =>
                            setBilling({ ...billing, colonia: v })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label={t.city}
                          value={billing.city}
                          error={errors.bCity}
                          onChange={(v) => setBilling({ ...billing, city: v })}
                        />
                        <Input
                          label={t.state}
                          value={billing.state}
                          error={errors.bState}
                          onChange={(v) =>
                            setBilling({ ...billing, state: v })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label={t.postal}
                          value={billing.postal}
                          error={errors.bPostal}
                          onChange={(v) =>
                            setBilling({ ...billing, postal: v })
                          }
                          maxLength={6}
                        />
                        <Select
                          label={t.country}
                          value={billing.country}
                          onChange={(v) =>
                            setBilling({
                              ...billing,
                              country: v as "MX" | "US",
                            })
                          }
                          options={[
                            { value: "MX", label: t.mexico },
                            { value: "US", label: t.us },
                          ]}
                        />
                      </div>
                    </div>
                  )}

                  {/* Factura toggle */}
                  <FacturaSection
                    locale={locale}
                    value={factura}
                    onChange={setFactura}
                    errors={errors as Partial<Record<keyof FacturaData, string>>}
                  />
                </div>
              )}

              {/* Step 3: Review */}
              {step === 3 && (
                <div className="space-y-6">
                  <ReviewBlock
                    label={t.contactSummary}
                    onEdit={() => setStep(0)}
                    editLabel={t.edit}
                  >
                    <div>
                      <p className="font-body text-sm text-brand-charcoal">
                        {`${contact.firstName} ${contact.lastName}`.trim()}
                      </p>
                      <p className="font-body text-xs text-dash-text-secondary">
                        {contact.email}
                        {contact.phone && ` · ${contact.phone}`}
                      </p>
                      {contact.company && (
                        <p className="font-body text-xs text-dash-text-secondary">
                          {contact.company}
                        </p>
                      )}
                    </div>
                  </ReviewBlock>

                  <ReviewBlock
                    label={t.shipSummary}
                    onEdit={() => setStep(1)}
                    editLabel={t.edit}
                  >
                    {(() => {
                      const f = formatAddress(address);
                      return (
                        <>
                          {f.lineA && (
                            <p className="font-body text-sm text-brand-charcoal">
                              {f.lineA}
                            </p>
                          )}
                          <p className="font-body text-xs text-dash-text-secondary">
                            {f.lineB} · {f.country}
                          </p>
                          {address.deliveryNotes && (
                            <p className="mt-1 font-body text-xs italic text-dash-text-secondary/80">
                              &ldquo;{address.deliveryNotes}&rdquo;
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </ReviewBlock>

                  <ReviewBlock
                    label={t.billingSummary}
                    onEdit={() => setStep(2)}
                    editLabel={t.edit}
                  >
                    {billing.sameAsShipping ? (
                      <p className="font-body text-sm text-dash-text-secondary">
                        {t.sameAsShippingShort}
                      </p>
                    ) : (
                      (() => {
                        const f = formatAddress(billing);
                        return (
                          <>
                            {f.lineA && (
                              <p className="font-body text-sm text-brand-charcoal">
                                {f.lineA}
                              </p>
                            )}
                            <p className="font-body text-xs text-dash-text-secondary">
                              {f.lineB} · {f.country}
                            </p>
                          </>
                        );
                      })()
                    )}
                  </ReviewBlock>

                  <ReviewBlock
                    label={t.facturaSummary}
                    onEdit={() => setStep(2)}
                    editLabel={t.edit}
                  >
                    {factura.enabled ? (
                      <div>
                        <p className="font-body text-sm text-brand-charcoal">
                          {t.facturaWillIssue}
                          <span className="font-mono ml-2 text-xs">
                            · {factura.rfc}
                          </span>
                        </p>
                        <p className="font-body text-xs text-dash-text-secondary">
                          {factura.razonSocial}
                        </p>
                      </div>
                    ) : (
                      <p className="font-body text-sm text-dash-text-secondary">
                        {t.noFactura}
                      </p>
                    )}
                  </ReviewBlock>

                  <div className="cc-rule-copper" />

                  {/* Collapsible terms + privacy — readable inline */}
                  <div className="space-y-2">
                    <LegalAccordion
                      title={t.termsTitle}
                      paragraphs={TERMS_TEXT[locale]}
                      readMoreHref={`/${locale}/terms`}
                      readMoreLabel={t.readMore}
                    />
                    <LegalAccordion
                      title={t.privacyTitle}
                      paragraphs={PRIVACY_TEXT[locale]}
                      readMoreHref={`/${locale}/privacy`}
                      readMoreLabel={t.readMore}
                    />
                  </div>

                  {/* Agreement checkbox */}
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="w-4 h-4 mt-0.5 accent-brand-terracotta shrink-0"
                    />
                    <span className="font-body text-xs text-dash-text-secondary leading-relaxed">
                      {t.agreeIntro}{" "}
                      <NextLink
                        href={`/${locale}/terms`}
                        className="text-brand-copper hover:underline"
                      >
                        {t.termsLinkLabel}
                      </NextLink>{" "}
                      {t.and}{" "}
                      <NextLink
                        href={`/${locale}/privacy`}
                        className="text-brand-copper hover:underline"
                      >
                        {t.privacyLinkLabel}
                      </NextLink>
                      .
                      <br />
                      <span className="text-dash-text-secondary/70">
                        {t.profecoNote}
                      </span>
                    </span>
                  </label>
                </div>
              )}

              {/* Error banner */}
              {submitError && (
                <div
                  className="mt-6 px-4 py-3 bg-dash-danger-soft border-l-2 border-dash-danger text-dash-danger font-body text-sm"
                  role="alert"
                >
                  {submitError}
                </div>
              )}

              {/* Step navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-brand-stone/15">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    className="flex items-center gap-1 font-body text-sm text-dash-text-secondary hover:text-brand-charcoal transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {t.back}
                  </button>
                ) : (
                  <div />
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-1.5 px-7 py-3 bg-brand-terracotta text-white font-body text-sm font-medium tracking-wider hover:bg-brand-copper transition-colors cursor-pointer shadow-sm hover:shadow-md"
                  >
                    {t.next}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!termsAccepted || submitting}
                    className="px-8 py-3.5 bg-brand-terracotta text-white font-body text-sm font-medium tracking-[0.18em] uppercase hover:bg-brand-copper transition-colors disabled:opacity-50 disabled:cursor-default cursor-pointer flex items-center gap-2 shadow-sm hover:shadow-md"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t.submitting}
                      </>
                    ) : (
                      <>
                        {isBuyPath ? t.payNow : t.submitQuote}
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Trust strip beneath the form */}
            <div className="mt-6 flex items-center justify-center gap-6 text-dash-text-secondary/70">
              <div className="font-body text-xs">SSL</div>
              <span className="text-brand-stone/30">·</span>
              <div className="font-body text-xs">PROFECO</div>
              <span className="text-brand-stone/30">·</span>
              <div className="font-body text-xs">SAT CFDI 4.0</div>
            </div>
          </div>

          {/* ────────── RIGHT: Order rail (desktop only) ────────── */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-5">
              {/* Atmospheric crop of the customer's first cart item */}
              {heroItem?.imageSrc && (
                <div className="relative cc-surface-card overflow-hidden">
                  <div className="aspect-[4/3] bg-brand-stone/5">
                    <img
                      src={heroItem.imageSrc}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal/55 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="font-body text-[10px] uppercase tracking-[0.2em] text-white/70">
                      {heroItem.brand}
                    </p>
                    <p className="mt-0.5 font-display text-base text-white font-light leading-tight line-clamp-2">
                      {heroItem.name}
                    </p>
                  </div>
                </div>
              )}

              {/* Live order summary */}
              <OrderSummary
                locale={locale}
                variant="panel"
                density="full"
                isMxShipTo={isMxShipTo}
                ivaAmount={ivaAmount}
                productSubtotal={productSubtotal}
                shippingMethod={shippingMethod}
                shippingCost={effectiveShippingCost > 0 ? effectiveShippingCost : undefined}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────
// Form primitives
// ──────────────────────────────────────────────────────────────────

interface InputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  maxLength?: number;
}

function Input({
  label,
  value,
  onChange,
  error,
  type = "text",
  autoComplete,
  placeholder,
  maxLength,
}: InputProps) {
  return (
    <div>
      <label className="block font-body text-xs tracking-wide text-dash-text-secondary mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-invalid={!!error}
        className={`w-full px-3 py-2.5 font-body text-sm bg-white border transition-colors focus:outline-none focus:ring-1 ${
          error
            ? "border-dash-danger focus:border-dash-danger focus:ring-dash-danger/20"
            : "border-brand-stone/25 focus:border-brand-copper focus:ring-brand-copper/20"
        }`}
      />
      {error && (
        <p className="mt-1 font-body text-xs text-dash-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface SelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}

function Select({ label, value, onChange, options }: SelectProps) {
  return (
    <div>
      <label className="block font-body text-xs tracking-wide text-dash-text-secondary mb-1.5">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none w-full px-3 py-2.5 pr-9 font-body text-sm bg-white border border-brand-stone/25 focus:border-brand-copper focus:outline-none focus:ring-1 focus:ring-brand-copper/20"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-brand-stone pointer-events-none" />
      </div>
    </div>
  );
}

interface ReviewBlockProps {
  label: string;
  onEdit: () => void;
  editLabel: string;
  children: React.ReactNode;
}

function ReviewBlock({ label, onEdit, editLabel, children }: ReviewBlockProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <p className="font-body text-[11px] uppercase tracking-[0.2em] text-brand-copper">
          {label}
        </p>
        <button
          type="button"
          onClick={onEdit}
          className="font-body text-xs text-dash-text-secondary hover:text-brand-charcoal underline-offset-2 hover:underline cursor-pointer"
        >
          {editLabel}
        </button>
      </div>
      {children}
    </div>
  );
}

interface LegalAccordionProps {
  title: string;
  paragraphs: string[];
  readMoreHref: string;
  readMoreLabel: string;
}

function LegalAccordion({
  title,
  paragraphs,
  readMoreHref,
  readMoreLabel,
}: LegalAccordionProps) {
  return (
    <details className="group border border-brand-stone/15 bg-brand-linen/40">
      <summary className="px-4 py-3 cursor-pointer flex items-center justify-between list-none">
        <span className="font-body text-sm font-medium text-brand-charcoal">
          {title}
        </span>
        <ChevronDown className="w-4 h-4 text-brand-stone group-open:rotate-180 transition-transform" />
      </summary>
      <div className="px-4 pb-4 pt-1 max-h-72 overflow-y-auto">
        <div className="space-y-2.5">
          {paragraphs.map((p, i) => (
            <p
              key={i}
              className="font-body text-xs text-dash-text-secondary leading-relaxed"
            >
              {p}
            </p>
          ))}
          <NextLink
            href={readMoreHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 font-body text-xs text-brand-copper hover:underline"
          >
            {readMoreLabel} →
          </NextLink>
        </div>
      </div>
    </details>
  );
}

interface ShippingOptionProps {
  value: ShippingMethod;
  selected: ShippingMethod;
  onSelect: (v: ShippingMethod) => void;
  icon: React.ReactNode;
  label: string;
  description?: string;
  price?: string;
  loading?: boolean;
  disabled?: boolean;
}

function ShippingOption({
  value,
  selected,
  onSelect,
  icon,
  label,
  description,
  price,
  loading,
  disabled,
}: ShippingOptionProps) {
  const isSelected = selected === value;
  return (
    <button
      type="button"
      onClick={() => !disabled && onSelect(value)}
      disabled={disabled && !isSelected}
      className={`w-full text-left px-4 py-3.5 border transition-colors flex items-start gap-3 ${
        isSelected
          ? "border-brand-copper bg-brand-copper/5 ring-1 ring-brand-copper/20"
          : "border-brand-stone/20 hover:border-brand-stone/40"
      } ${disabled ? "opacity-80 cursor-default" : "cursor-pointer"}`}
    >
      <div
        className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
          isSelected ? "border-brand-copper" : "border-brand-stone/40"
        }`}
      >
        {isSelected && (
          <div className="w-2 h-2 rounded-full bg-brand-copper" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-brand-copper">{icon}</span>
          <span className="font-body text-sm text-brand-charcoal">
            {label}
          </span>
          {loading && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-copper" />
          )}
        </div>
        {description && (
          <p className="mt-1 font-body text-xs text-dash-text-secondary leading-relaxed ml-6">
            {description}
          </p>
        )}
      </div>
      {price && (
        <span className="font-mono text-sm text-brand-charcoal tabular-nums shrink-0 mt-0.5">
          {price}
        </span>
      )}
    </button>
  );
}
