"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import { ChevronLeft, ChevronRight, Loader2, ShoppingBag, Minus, Plus, X as XIcon, Truck } from "lucide-react";
import { useCartStore } from "@/app/lib/stores/cart-store";
import { CartWatermark, CartWordmark } from "@/app/components/cart/cart-watermark";
import { REGIMEN_FISCAL } from "@/app/lib/sat/regimen-fiscal";
import { USO_CFDI } from "@/app/lib/sat/uso-cfdi";
import { MEXICAN_STATES } from "@/app/lib/sat/mexican-states";
import { TERMS_EN, TERMS_ES } from "@/app/lib/legal/terms";
import type { ShippingRate } from "@/app/lib/shipping/skydropx";

const T = {
  en: {
    nombre: "First name(s) / Nombre(s) *",
    apellidoPaterno: "Paternal surname / Apellido Paterno *",
    apellidoMaterno: "Maternal surname / Apellido Materno",
    email: "Email *",
    phone: "Phone / WhatsApp",
    companyLabel: "Company / Firm",
    commPref: "Communication preference",
    emailOnly: "Email only",
    whatsappOnly: "WhatsApp only",
    both: "Both",
    line1: "Address line 1 *",
    line2: "Address line 2 (Interior / Suite)",
    line3: "Colonia / Neighborhood",
    deliveryNotes: "Delivery notes (e.g. Black door, gate code)",
    city: "City *",
    state: "State *",
    postal: "Postal code *",
    country: "Country *",
    mexico: "Mexico",
    us: "United States",
    billingSameLabel: "Billing address is the same as shipping address",
    facturaToggle: "I need a Factura (CFDI 4.0)",
    facturaWhat: "What is a Factura?",
    facturaExplain: "A Factura is Mexico's official electronic tax invoice (CFDI 4.0), required by the SAT for tax deductions. If your purchase is for a business or you need a tax receipt, enable this option and provide your fiscal information.",
    rfcLabel: "RFC *",
    rfcPlaceholder: "XAXX010101000",
    razonSocialLabel: "Razon Social *",
    cpFiscalLabel: "Codigo Postal Fiscal *",
    cpFiscalHint: "From your Constancia de Situacion Fiscal",
    regimenLabel: "Regimen Fiscal *",
    regimenPlaceholder: "Select regimen...",
    usoLabel: "Uso de CFDI *",
    usoPlaceholder: "Select use...",
    facturaEmailLabel: "Email for Factura PDF/XML",
    constanciaLabel: "Constancia de Situacion Fiscal (PDF, optional)",
    constanciaHint: "Max 5MB",
    invalidRfc: "Invalid RFC format",
    invalidPostal: "Must be 5 digits",
    billingName: "Full name on card *",
    billingCompany: "Company",
    billingPhone: "Phone",
    projectName: "Project name",
    room: "Room / area",
    timeline: "Timeline / target install",
    notes: "Notes for Counter Cultures",
    isTrade: "This is a trade/professional order",
    reviewTitle: "Review your order",
    model: "Model / Modelo",
    subtotal: "Subtotal",
    tradeDiscount: "Trade discount",
    iva: "VAT (16%) — Included on tax invoice",
    shipping: "Shipping",
    shippingFallback: "We'll quote shipping after order review",
    shippingLoading: "Getting shipping rates...",
    shippingError: "Could not load rates — we'll quote after review",
    shippingSelect: "Select shipping method",
    shippingDays: "days",
    total: "Total",
    termsLabel: "I agree to the terms of service and return policy",
    termsScrollHint: "Please scroll to the bottom of the terms to continue",
    payNow: "Pay Now",
    submitting: "Submitting...",
    next: "Next",
    back: "Back",
    required: "This field is required",
    invalidEmail: "Enter a valid email",
    emptyCart: "Your cart is empty",
    stepContact: "Contact",
    stepShipTo: "Ship To",
    stepBilling: "Payment Address",
    stepReview: "Review",
    selectState: "Select state...",
    facturaStatus: "Factura requested",
    days: "days",
    securePayment: "Secure payment",
    noRedirect: "You will not be redirected. Your payment is processed securely on this page.",
    savedInfoBanner: "Welcome back, {name}! Use your saved info?",
    useSavedInfo: "Use saved info",
    startFresh: "Start fresh",
    savedInfoCleared: "Saved info cleared",
    browseShop: "Browse Shop",
    submitErrorGeneric: "Something went wrong. Please try again.",
    submitErrorUnexpected: "Unexpected response. Please try again.",
    submitErrorConnection: "Connection error. Please try again.",
    shipToHeading: "Ship To",
    taxInfoHeading: "Tax Information",
    paymentAddressHeading: "Payment Address",
    finish: "Finish",
    projectDetailsOptional: "Project details (optional)",
  },
  es: {
    nombre: "Nombre(s) *",
    apellidoPaterno: "Apellido Paterno *",
    apellidoMaterno: "Apellido Materno",
    email: "Correo electronico *",
    phone: "Telefono / WhatsApp",
    companyLabel: "Empresa / Razon Social",
    commPref: "Preferencia de comunicacion",
    emailOnly: "Solo correo",
    whatsappOnly: "Solo WhatsApp",
    both: "Ambos",
    line1: "Direccion linea 1 *",
    line2: "Direccion linea 2 (Interior / Depto)",
    line3: "Colonia",
    deliveryNotes: "Notas de entrega (ej. Puerta negra, codigo de acceso)",
    city: "Ciudad *",
    state: "Estado *",
    postal: "Codigo postal *",
    country: "Pais *",
    mexico: "Mexico",
    us: "Estados Unidos",
    billingSameLabel: "La direccion de facturacion es la misma que la de envio",
    facturaToggle: "Necesito Factura (CFDI 4.0)",
    facturaWhat: "Que es una Factura?",
    facturaExplain: "Una Factura es el comprobante fiscal digital (CFDI 4.0) oficial de Mexico, requerido por el SAT para deducciones fiscales. Si tu compra es para un negocio o necesitas un recibo fiscal, activa esta opcion y proporciona tu informacion fiscal.",
    rfcLabel: "RFC *",
    rfcPlaceholder: "XAXX010101000",
    razonSocialLabel: "Razon Social *",
    cpFiscalLabel: "Codigo Postal Fiscal *",
    cpFiscalHint: "De tu Constancia de Situacion Fiscal",
    regimenLabel: "Regimen Fiscal *",
    regimenPlaceholder: "Seleccionar regimen...",
    usoLabel: "Uso de CFDI *",
    usoPlaceholder: "Seleccionar uso...",
    facturaEmailLabel: "Correo para Factura PDF/XML",
    constanciaLabel: "Constancia de Situacion Fiscal (PDF, opcional)",
    constanciaHint: "Maximo 5MB",
    invalidRfc: "Formato de RFC invalido",
    invalidPostal: "Debe ser de 5 digitos",
    billingName: "Nombre completo en tarjeta *",
    billingCompany: "Empresa",
    billingPhone: "Telefono",
    projectName: "Nombre del proyecto",
    room: "Habitacion / area",
    timeline: "Plazo / fecha de instalacion",
    notes: "Notas para Counter Cultures",
    isTrade: "Este es un pedido trade/profesional",
    reviewTitle: "Revisa tu pedido",
    model: "Modelo",
    subtotal: "Subtotal",
    tradeDiscount: "Descuento trade",
    iva: "IVA (16%) — Incluido en factura",
    shipping: "Envio",
    shippingFallback: "Cotizaremos el envio despues de la revision",
    shippingLoading: "Obteniendo tarifas de envio...",
    shippingError: "No se pudieron cargar tarifas — cotizaremos despues",
    shippingSelect: "Selecciona metodo de envio",
    shippingDays: "dias",
    total: "Total",
    termsLabel: "Acepto los terminos de servicio y la politica de devoluciones",
    termsScrollHint: "Desplazate hasta el final de los terminos para continuar",
    payNow: "Pagar Ahora",
    submitting: "Enviando...",
    next: "Siguiente",
    back: "Atras",
    required: "Campo requerido",
    invalidEmail: "Ingresa un correo valido",
    emptyCart: "Tu carrito esta vacio",
    stepContact: "Contacto",
    stepShipTo: "Envio",
    stepBilling: "Direccion de Pago",
    stepReview: "Revisar",
    selectState: "Seleccionar estado...",
    facturaStatus: "Factura solicitada",
    days: "dias",
    securePayment: "Pago seguro",
    noRedirect: "No seras redirigido. Tu pago se procesa de forma segura en esta pagina.",
    savedInfoBanner: "Bienvenido de nuevo, {name}! Usar tu informacion guardada?",
    useSavedInfo: "Usar info guardada",
    startFresh: "Empezar de nuevo",
    savedInfoCleared: "Informacion guardada eliminada",
    browseShop: "Ver Tienda",
    submitErrorGeneric: "Error al enviar. Intenta de nuevo.",
    submitErrorUnexpected: "Respuesta inesperada. Intenta de nuevo.",
    submitErrorConnection: "Error de conexion. Intenta de nuevo.",
    shipToHeading: "Enviar a",
    taxInfoHeading: "Datos Fiscales",
    paymentAddressHeading: "Direccion de Pago",
    finish: "Acabado",
    projectDetailsOptional: "Detalles del proyecto (opcional)",
  },
};

interface ContactForm {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string;
  phone: string;
  company: string;
  channelPreference: "email" | "whatsapp" | "both";
}

interface AddressForm {
  line1: string;
  line2: string;
  line3: string;
  deliveryNotes: string;
  city: string;
  state: string;
  postal: string;
  country: "MX" | "US";
}

interface BillingAddressForm {
  name: string;
  company: string;
  line1: string;
  line2: string;
  line3: string;
  city: string;
  state: string;
  postal: string;
  country: "MX" | "US";
  phone: string;
}

interface FacturaForm {
  enabled: boolean;
  rfc: string;
  razonSocial: string;
  cpFiscal: string;
  regimenFiscal: string;
  usoCfdi: string;
  email: string;
  constanciaBase64: string | null;
}

interface ProjectForm {
  projectName: string;
  room: string;
  timeline: string;
  notes: string;
  isTrade: boolean;
}

const RFC_REGEX = /^([A-ZÑ&]{3,4})\d{6}([A-Z\d]{3})$/i;

const SAVED_INFO_KEY = "cc_checkout_saved_v1";

interface SavedCheckoutInfo {
  contact: ContactForm;
  address: AddressForm;
  billing: BillingAddressForm;
  factura: Omit<FacturaForm, "constanciaBase64">;
  project: ProjectForm;
  billingSameAsShipping: boolean;
  savedAt: number;
}

type StepKey = "contact" | "shipTo" | "billing" | "review";

export const CheckoutStepper = ({ locale }: { locale: "en" | "es" }) => {
  const t = T[locale];
  const satLabel = (entry: { label_es: string; label_en: string }) => locale === "es" ? entry.label_es : entry.label_en;
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsScrolled, setTermsScrolled] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [facturaHelpOpen, setFacturaHelpOpen] = useState(false);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedShippingRate, setSelectedShippingRate] = useState<string | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState(false);
  const termsRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const shippingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const cartSessionId = useCartStore((s) => s.cartSessionId);
  const tradeCode = useCartStore((s) => s.tradeCode);
  const tradeDiscountPct = useCartStore((s) => s.tradeDiscountPct);
  const clear = useCartStore((s) => s.clear);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.remove);

  const [contact, setContact] = useState<ContactForm>({
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    email: "",
    phone: "",
    company: "",
    channelPreference: "both",
  });

  const [address, setAddress] = useState<AddressForm>({
    line1: "",
    line2: "",
    line3: "",
    deliveryNotes: "",
    city: "",
    state: "",
    postal: "",
    country: "MX",
  });

  const [billing, setBilling] = useState<BillingAddressForm>({
    name: "",
    company: "",
    line1: "",
    line2: "",
    line3: "",
    city: "",
    state: "",
    postal: "",
    country: "MX",
    phone: "",
  });

  const [factura, setFactura] = useState<FacturaForm>({
    enabled: false,
    rfc: "",
    razonSocial: "",
    cpFiscal: "",
    regimenFiscal: "",
    usoCfdi: "",
    email: "",
    constanciaBase64: null,
  });

  const [project, setProject] = useState<ProjectForm>({
    projectName: "",
    room: "",
    timeline: "",
    notes: "",
    isTrade: false,
  });

  const [savedInfo, setSavedInfo] = useState<SavedCheckoutInfo | null>(null);
  const [savedInfoDismissed, setSavedInfoDismissed] = useState(false);

  useEffect(() => setMounted(true), []);

  // Check for saved checkout info on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_INFO_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SavedCheckoutInfo;
        if (parsed.contact?.nombre && parsed.contact?.email) {
          setSavedInfo(parsed);
        }
      }
    } catch { /* ignore corrupt data */ }
  }, []);

  // Sync browser autofill to React state for all form fields
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const handleAutofill = (e: Event) => {
      const el = e.target as HTMLInputElement | HTMLSelectElement;
      const n = el.name;
      const v = el.value;
      if (!n || !v) return;
      const contactMap: Record<string, (prev: ContactForm) => ContactForm> = {
        "organization": (p) => ({ ...p, company: v }),
        "given-name": (p) => ({ ...p, nombre: v }),
        "family-name": (p) => ({ ...p, apellidoPaterno: v }),
        "additional-name": (p) => ({ ...p, apellidoMaterno: v }),
        "email": (p) => ({ ...p, email: v }),
        "tel": (p) => ({ ...p, phone: v }),
      };
      if (contactMap[n]) { setContact(contactMap[n]); return; }
      const shippingMap: Record<string, (prev: AddressForm) => AddressForm> = {
        "address-line1": (p) => ({ ...p, line1: v }),
        "address-line2": (p) => ({ ...p, line2: v }),
        "address-line3": (p) => ({ ...p, line3: v }),
        "city": (p) => ({ ...p, city: v }),
        "state": (p) => ({ ...p, state: v }),
        "postal-code": (p) => ({ ...p, postal: v }),
        "country": (p) => ({ ...p, country: v as "MX" | "US" }),
      };
      if (shippingMap[n]) { setAddress(shippingMap[n]); return; }
      const billingMap: Record<string, (prev: BillingAddressForm) => BillingAddressForm> = {
        "cc-name": (p) => ({ ...p, name: v }),
        "billing-organization": (p) => ({ ...p, company: v }),
        "billing-address-line1": (p) => ({ ...p, line1: v }),
        "billing-address-line2": (p) => ({ ...p, line2: v }),
        "billing-address-line3": (p) => ({ ...p, line3: v }),
        "billing-address-level2": (p) => ({ ...p, city: v }),
        "billing-address-level1": (p) => ({ ...p, state: v }),
        "billing-postal-code": (p) => ({ ...p, postal: v }),
        "billing-country": (p) => ({ ...p, country: v as "MX" | "US" }),
        "billing-tel": (p) => ({ ...p, phone: v }),
      };
      if (billingMap[n]) { setBilling(billingMap[n]); return; }
    };
    form.addEventListener("change", handleAutofill, true);
    form.addEventListener("animationstart", handleAutofill, true);
    return () => {
      form.removeEventListener("change", handleAutofill, true);
      form.removeEventListener("animationstart", handleAutofill, true);
    };
  }, []);

  const stepKeys = useMemo<StepKey[]>(() =>
    billingSameAsShipping
      ? ["contact", "shipTo", "review"]
      : ["contact", "shipTo", "billing", "review"],
  [billingSameAsShipping]);

  const stepLabels = useMemo(() => {
    const labels: Record<StepKey, string> = {
      contact: t.stepContact,
      shipTo: t.stepShipTo,
      billing: t.stepBilling,
      review: t.stepReview,
    };
    return stepKeys.map((k) => labels[k]);
  }, [t, stepKeys]);

  const currentStepKey = stepKeys[step] ?? "contact";
  const totalSteps = stepKeys.length;
  const isLastStep = step === totalSteps - 1;

  const fetchShippingRates = useCallback(async () => {
    if (!address.postal || !address.country) return;
    setShippingLoading(true);
    setShippingError(false);
    try {
      const res = await fetch("/api/shipping/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            weight_kg: 5,
            length_cm: 30,
            width_cm: 30,
            height_cm: 20,
            quantity: i.quantity,
          })),
          address: { postal: address.postal, country: address.country },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setShippingRates(data.rates ?? []);
        if (data.rates?.length > 0 && !selectedShippingRate) {
          setSelectedShippingRate(data.rates[0].rate_id);
        }
      } else {
        setShippingError(true);
      }
    } catch {
      setShippingError(true);
    } finally {
      setShippingLoading(false);
    }
  }, [address.postal, address.country, items, selectedShippingRate]);

  useEffect(() => {
    if (currentStepKey !== "review") return;
    if (shippingDebounceRef.current) clearTimeout(shippingDebounceRef.current);
    shippingDebounceRef.current = setTimeout(fetchShippingRates, 400);
    return () => { if (shippingDebounceRef.current) clearTimeout(shippingDebounceRef.current); };
  }, [currentStepKey, fetchShippingRates]);

  // Handle terms scroll tracking
  const handleTermsScroll = useCallback(() => {
    const el = termsRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) {
      setTermsScrolled(true);
    }
  }, []);

  const applySavedInfo = useCallback(() => {
    if (!savedInfo) return;
    setContact(savedInfo.contact);
    setAddress(savedInfo.address);
    setBilling(savedInfo.billing);
    setFactura({ ...savedInfo.factura, constanciaBase64: null });
    setProject(savedInfo.project);
    setBillingSameAsShipping(savedInfo.billingSameAsShipping);
    setSavedInfoDismissed(true);
  }, [savedInfo]);

  const clearSavedInfo = useCallback(() => {
    localStorage.removeItem(SAVED_INFO_KEY);
    setSavedInfo(null);
    setSavedInfoDismissed(true);
  }, []);

  const saveInfoToStorage = useCallback(() => {
    const toSave: SavedCheckoutInfo = {
      contact,
      address,
      billing,
      factura: {
        enabled: factura.enabled,
        rfc: factura.rfc,
        razonSocial: factura.razonSocial,
        cpFiscal: factura.cpFiscal,
        regimenFiscal: factura.regimenFiscal,
        usoCfdi: factura.usoCfdi,
        email: factura.email,
      },
      project,
      billingSameAsShipping,
      savedAt: Date.now(),
    };
    localStorage.setItem(SAVED_INFO_KEY, JSON.stringify(toSave));
  }, [contact, address, billing, factura, project, billingSameAsShipping]);

  if (!mounted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-stone/20 border-t-brand-terracotta rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 flex flex-col items-center text-center">
        <div className="w-16 h-16 flex items-center justify-center rounded-full bg-brand-stone/8 mb-5">
          <ShoppingBag className="w-7 h-7 text-brand-stone/40" />
        </div>
        <p className="font-display text-lg font-light text-brand-charcoal">{t.emptyCart}</p>
        <NextLink
          href={`/${locale}/shop`}
          className="mt-6 px-8 py-3 bg-brand-charcoal text-white font-body text-sm font-medium tracking-wider hover:bg-brand-terracotta transition-colors"
        >
          {t.browseShop}
        </NextLink>
      </div>
    );
  }

  const currency = items[0]?.currency ?? "MXN";
  const isMxShipTo = address.country === "MX";
  const ivaAmount = isMxShipTo ? Math.round(subtotal * 0.16) : 0;
  const tradeDiscountAmount = tradeDiscountPct ? Math.round(subtotal * (tradeDiscountPct / 100)) : 0;
  const chosenRate = shippingRates.find((r) => r.rate_id === selectedShippingRate);
  const shippingAmount = chosenRate?.amount_mxn ?? 0;
  const total = subtotal - tradeDiscountAmount + ivaAmount + shippingAmount;

  const formatted = (amount: number) =>
    new Intl.NumberFormat(locale === "es" ? "es-MX" : "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const validateFactura = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!factura.rfc.trim() || !RFC_REGEX.test(factura.rfc)) e.rfc = t.invalidRfc;
    if (!factura.razonSocial.trim()) e.razonSocial = t.required;
    if (!factura.cpFiscal.trim() || !/^\d{5}$/.test(factura.cpFiscal)) e.cpFiscal = t.invalidPostal;
    if (!factura.regimenFiscal) e.regimenFiscal = t.required;
    if (!factura.usoCfdi) e.usoCfdi = t.required;
    return e;
  };

  const validateStep = (): boolean => {
    const e: Record<string, string> = {};

    if (currentStepKey === "contact") {
      if (!contact.nombre.trim()) e.nombre = t.required;
      if (!contact.apellidoPaterno.trim()) e.apellidoPaterno = t.required;
      if (!contact.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email))
        e.email = t.invalidEmail;
      if (factura.enabled && !contact.company.trim()) e.company = t.required;
    }

    if (currentStepKey === "shipTo") {
      if (!address.line1.trim()) e.line1 = t.required;
      if (!address.city.trim()) e.city = t.required;
      if (!address.state.trim()) e.state = t.required;
      if (!address.postal.trim()) e.postal = t.required;
      if (address.country === "MX" && !/^\d{5}$/.test(address.postal)) e.postal = t.invalidPostal;
      if (factura.enabled) {
        const facturaErrors = validateFactura();
        Object.assign(e, facturaErrors);
      }
    }

    if (currentStepKey === "billing" && !billingSameAsShipping) {
      if (!billing.name.trim()) e.billingName = t.required;
      if (!billing.line1.trim()) e.billingLine1 = t.required;
      if (!billing.city.trim()) e.billingCity = t.required;
      if (!billing.state.trim()) e.billingState = t.required;
      if (!billing.postal.trim()) e.billingPostal = t.required;
      if (billing.country === "MX" && !/^\d{5}$/.test(billing.postal)) e.billingPostal = t.invalidPostal;
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) setStep((s) => Math.min(s + 1, totalSteps - 1));
  };

  const handleConstanciaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFactura((f) => ({ ...f, constanciaBase64: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!termsAccepted) return;
    setSubmitError(null);
    setSubmitting(true);

    const payload = {
      locale,
      contact: {
        ...contact,
        name: [contact.nombre, contact.apellidoPaterno, contact.apellidoMaterno].filter(Boolean).join(" "),
        commLocale: locale,
      },
      address,
      billingAddress: billingSameAsShipping ? null : billing,
      billingSameAsShipping,
      factura: factura.enabled ? {
        enabled: true,
        rfc: factura.rfc.toUpperCase(),
        razonSocial: factura.razonSocial,
        cpFiscal: factura.cpFiscal,
        regimenFiscal: factura.regimenFiscal,
        usoCfdi: factura.usoCfdi,
        email: factura.email || contact.email,
        constanciaBase64: factura.constanciaBase64,
      } : null,
      project,
      items: items.map((i) => ({
        productId: i.id,
        sku: i.sku,
        name: i.name,
        brand: i.brand,
        quantity: i.quantity,
        listPrice: i.listPrice,
        selectedFinish: i.selectedFinish,
        notes: i.notes,
        buyable: i.buyable,
        availability: i.availability,
      })),
      cartSessionId,
      tradeCode: tradeCode ?? null,
      subtotal,
      ivaAmount,
      shippingAmount,
      selectedShippingRate: chosenRate ? {
        carrier: chosenRate.carrier,
        service: chosenRate.service,
        rate_id: chosenRate.rate_id,
        amount_mxn: chosenRate.amount_mxn,
      } : null,
      total,
      currency,
    };

    try {
      const res = await fetch("/api/checkout/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || t.submitErrorGeneric);
        setSubmitting(false);
        return;
      }

      saveInfoToStorage();

      if (data.payUrl) {
        router.push(data.payUrl);
      } else if (data.dealId) {
        clear();
        const trackerParam = data.trackerUrl ? `?tracker=${encodeURIComponent(data.trackerUrl)}` : "";
        router.push(`/${locale}/checkout/submitted/${data.dealId}${trackerParam}`);
      } else {
        setSubmitError(t.submitErrorUnexpected);
        setSubmitting(false);
      }
    } catch {
      setSubmitError(t.submitErrorConnection);
      setSubmitting(false);
    }
  };

  return (
    <div className="relative mx-auto max-w-3xl px-4 sm:px-6 py-10 md:py-16 min-h-[70vh]">
      <CartWatermark />

      <div className="relative z-10">
        <CartWordmark />

        {/* Step indicators */}
        <nav aria-label="Checkout progress" className="flex items-center mb-10">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  aria-current={i === step ? "step" : undefined}
                  className={`w-8 h-8 flex items-center justify-center font-mono text-xs transition-colors ${
                    i < step
                      ? "bg-brand-sage text-white"
                      : i === step
                        ? "bg-brand-terracotta text-white"
                        : "bg-brand-stone/10 text-brand-stone"
                  }`}
                >
                  {i < step ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
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
              {i < totalSteps - 1 && <div className="flex-1 h-px bg-brand-stone/15 mx-2 sm:mx-3 mt-[-18px]" />}
            </div>
          ))}
        </nav>

        <form ref={formRef} method="post" autoComplete="on" onSubmit={(e) => e.preventDefault()}>
        {/* ─── Saved Info Banner ─── */}
        {savedInfo && !savedInfoDismissed && step === 0 && (
          <div className="mb-8 border border-brand-sage/30 bg-brand-sage/5 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-body text-sm text-brand-charcoal">
                {t.savedInfoBanner.replace("{name}", savedInfo.contact.nombre.split(" ")[0])}
              </p>
              <p className="font-body text-xs text-brand-stone mt-0.5 truncate">
                {savedInfo.contact.email}
                {savedInfo.address.city ? ` — ${savedInfo.address.city}, ${savedInfo.address.state}` : ""}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={applySavedInfo}
                className="px-4 py-2 bg-brand-charcoal text-white font-body text-xs font-medium tracking-wider hover:bg-brand-terracotta transition-colors cursor-pointer"
              >
                {t.useSavedInfo}
              </button>
              <button
                type="button"
                onClick={clearSavedInfo}
                className="px-4 py-2 border border-brand-stone/20 text-brand-stone font-body text-xs tracking-wider hover:border-brand-stone/40 transition-colors cursor-pointer"
              >
                {t.startFresh}
              </button>
            </div>
          </div>
        )}

        {/* ─── Step: Contact ─── */}
        {currentStepKey === "contact" && (
          <div className="space-y-5">
            <Input label={t.companyLabel + (factura.enabled ? " *" : "")} value={contact.company} error={errors.company} onChange={(v) => setContact({ ...contact, company: v })} name="organization" autoComplete="organization" />
            <Input label={t.nombre} value={contact.nombre} error={errors.nombre} onChange={(v) => setContact({ ...contact, nombre: v })} name="given-name" autoComplete="given-name" />
            <div className="grid grid-cols-2 gap-4">
              <Input label={t.apellidoPaterno} value={contact.apellidoPaterno} error={errors.apellidoPaterno} onChange={(v) => setContact({ ...contact, apellidoPaterno: v })} name="family-name" autoComplete="family-name" />
              <Input label={t.apellidoMaterno} value={contact.apellidoMaterno} onChange={(v) => setContact({ ...contact, apellidoMaterno: v })} name="additional-name" autoComplete="additional-name" />
            </div>
            <Input label={t.email} type="email" value={contact.email} error={errors.email} onChange={(v) => setContact({ ...contact, email: v })} name="email" autoComplete="email" />
            <Input label={t.phone} type="tel" value={contact.phone} onChange={(v) => setContact({ ...contact, phone: v })} name="tel" autoComplete="tel" />
            <div>
              <label className="font-body text-xs text-dash-text-secondary">{t.commPref}</label>
              <div className="mt-1 flex gap-3">
                {(["email", "whatsapp", "both"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setContact({ ...contact, channelPreference: opt })}
                    className={`px-3 py-1.5 font-body text-xs border transition-colors cursor-pointer ${
                      contact.channelPreference === opt
                        ? "border-brand-terracotta text-brand-terracotta bg-brand-terracotta/5"
                        : "border-brand-stone/20 text-dash-text-secondary hover:border-brand-stone/40"
                    }`}
                  >
                    {opt === "email" ? t.emailOnly : opt === "whatsapp" ? t.whatsappOnly : t.both}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── Step: Ship To ─── */}
        {currentStepKey === "shipTo" && (
          <div className="space-y-5">
            <h3 className="font-display text-lg font-light text-brand-charcoal">
              {t.shipToHeading}
            </h3>
            <Input label={t.line1} value={address.line1} error={errors.line1} onChange={(v) => setAddress({ ...address, line1: v })} name="address-line1" autoComplete="shipping address-line1" />
            <Input label={t.line2} value={address.line2} onChange={(v) => setAddress({ ...address, line2: v })} name="address-line2" autoComplete="shipping address-line2" />
            <Input label={t.line3} value={address.line3} onChange={(v) => setAddress({ ...address, line3: v })} name="address-line3" autoComplete="shipping address-line3" />
            <Input label={t.deliveryNotes} value={address.deliveryNotes} onChange={(v) => setAddress({ ...address, deliveryNotes: v })} name="delivery-notes" />
            <div className="grid grid-cols-2 gap-4">
              <Input label={t.city} value={address.city} error={errors.city} onChange={(v) => setAddress({ ...address, city: v })} name="city" autoComplete="shipping address-level2" />
              {address.country === "MX" ? (
                <div>
                  <label htmlFor="shipping-state" className="block font-body text-xs tracking-wide text-dash-text-secondary mb-1.5">{t.state}</label>
                  <select
                    id="shipping-state"
                    name="state"
                    autoComplete="shipping address-level1"
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className={`w-full px-3 py-2.5 font-body text-sm border transition-colors focus:outline-none focus:ring-1 ${
                      errors.state
                        ? "border-dash-danger focus:border-dash-danger focus:ring-dash-danger/20"
                        : "border-brand-stone/20 focus:border-brand-terracotta focus:ring-brand-terracotta/20"
                    } bg-white`}
                  >
                    <option value="">{t.selectState}</option>
                    {MEXICAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.state && <p className="mt-1 font-body text-xs text-dash-danger" role="alert">{errors.state}</p>}
                </div>
              ) : (
                <Input label={t.state} value={address.state} error={errors.state} onChange={(v) => setAddress({ ...address, state: v })} name="state" autoComplete="shipping address-level1" />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label={t.postal} value={address.postal} error={errors.postal} onChange={(v) => setAddress({ ...address, postal: v })} name="postal-code" autoComplete="shipping postal-code" />
              <div>
                <label className="block font-body text-xs tracking-wide text-dash-text-secondary mb-1.5">{t.country}</label>
                <select
                  name="country"
                  autoComplete="shipping country"
                  value={address.country}
                  onChange={(e) => setAddress({ ...address, country: e.target.value as "MX" | "US", state: "" })}
                  className="w-full px-3 py-2.5 font-body text-sm border border-brand-stone/20 focus:border-brand-terracotta focus:outline-none bg-white"
                >
                  <option value="MX">{t.mexico}</option>
                  <option value="US">{t.us}</option>
                </select>
              </div>
            </div>

            {/* Billing same toggle */}
            <div className="pt-4 border-t border-brand-stone/10 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={billingSameAsShipping}
                  onChange={(e) => {
                    const same = e.target.checked;
                    setBillingSameAsShipping(same);
                    if (same) {
                      setBilling({
                        name: [contact.nombre, contact.apellidoPaterno, contact.apellidoMaterno].filter(Boolean).join(" "),
                        company: contact.company,
                        line1: address.line1,
                        line2: address.line2,
                        line3: address.line3,
                        city: address.city,
                        state: address.state,
                        postal: address.postal,
                        country: address.country,
                        phone: contact.phone,
                      });
                    }
                  }}
                  className="w-4 h-4 accent-brand-terracotta"
                />
                <span className="font-body text-sm text-brand-charcoal">{t.billingSameLabel}</span>
              </label>
            </div>

            {/* Factura toggle */}
            <div className="pt-4 border-t border-brand-stone/10 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={factura.enabled}
                  onChange={(e) => setFactura({ ...factura, enabled: e.target.checked })}
                  className="w-4 h-4 accent-brand-terracotta"
                />
                <span className="font-body text-sm text-brand-charcoal">{t.facturaToggle}</span>
              </label>

              {/* Factura help */}
              <details open={facturaHelpOpen} onToggle={(e) => setFacturaHelpOpen((e.target as HTMLDetailsElement).open)}>
                <summary className="font-body text-xs text-brand-terracotta cursor-pointer hover:underline">
                  {t.facturaWhat}
                </summary>
                <p className="mt-2 font-body text-xs text-dash-text-secondary leading-relaxed pl-4 border-l-2 border-brand-stone/10">
                  {t.facturaExplain}
                </p>
              </details>
            </div>

            {/* Factura fields — inline, not a separate step */}
            {factura.enabled && (
              <div className="space-y-4 p-4 bg-brand-stone/5 border border-brand-stone/10">
                <h4 className="font-display text-sm font-medium text-brand-charcoal">
                  {t.taxInfoHeading}
                </h4>
                <Input
                  label={t.rfcLabel}
                  value={factura.rfc}
                  error={errors.rfc}
                  onChange={(v) => setFactura({ ...factura, rfc: v.toUpperCase() })}
                  placeholder={t.rfcPlaceholder}
                />
                <Input
                  label={t.razonSocialLabel}
                  value={factura.razonSocial || contact.company}
                  error={errors.razonSocial}
                  onChange={(v) => setFactura({ ...factura, razonSocial: v })}
                />
                <div>
                  <Input
                    label={t.cpFiscalLabel}
                    value={factura.cpFiscal}
                    error={errors.cpFiscal}
                    onChange={(v) => setFactura({ ...factura, cpFiscal: v })}
                  />
                  <p className="mt-0.5 font-body text-[10px] text-dash-text-secondary/70">{t.cpFiscalHint}</p>
                </div>
                <div>
                  <label className="block font-body text-xs tracking-wide text-dash-text-secondary mb-1.5">{t.regimenLabel}</label>
                  <select
                    value={factura.regimenFiscal}
                    onChange={(e) => setFactura({ ...factura, regimenFiscal: e.target.value })}
                    className={`w-full px-3 py-2.5 font-body text-sm border transition-colors focus:outline-none ${
                      errors.regimenFiscal ? "border-dash-danger" : "border-brand-stone/20 focus:border-brand-terracotta"
                    } bg-white`}
                  >
                    <option value="">{t.regimenPlaceholder}</option>
                    {REGIMEN_FISCAL.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.code} — {satLabel(r)}
                      </option>
                    ))}
                  </select>
                  {errors.regimenFiscal && <p className="mt-1 font-body text-xs text-dash-danger" role="alert">{errors.regimenFiscal}</p>}
                </div>
                <div>
                  <label className="block font-body text-xs tracking-wide text-dash-text-secondary mb-1.5">{t.usoLabel}</label>
                  <select
                    value={factura.usoCfdi}
                    onChange={(e) => setFactura({ ...factura, usoCfdi: e.target.value })}
                    className={`w-full px-3 py-2.5 font-body text-sm border transition-colors focus:outline-none ${
                      errors.usoCfdi ? "border-dash-danger" : "border-brand-stone/20 focus:border-brand-terracotta"
                    } bg-white`}
                  >
                    <option value="">{t.usoPlaceholder}</option>
                    {USO_CFDI.map((u) => (
                      <option key={u.code} value={u.code}>
                        {u.code} — {satLabel(u)}
                      </option>
                    ))}
                  </select>
                  {errors.usoCfdi && <p className="mt-1 font-body text-xs text-dash-danger" role="alert">{errors.usoCfdi}</p>}
                </div>
                <Input
                  label={t.facturaEmailLabel}
                  type="email"
                  value={factura.email || contact.email}
                  onChange={(v) => setFactura({ ...factura, email: v })}
                />
                <div>
                  <label className="block font-body text-xs tracking-wide text-dash-text-secondary mb-1.5">{t.constanciaLabel}</label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleConstanciaUpload}
                    className="w-full font-body text-sm text-dash-text-secondary file:mr-3 file:px-3 file:py-1.5 file:border file:border-brand-stone/20 file:bg-white file:font-body file:text-xs file:text-brand-charcoal file:cursor-pointer"
                  />
                  <p className="mt-0.5 font-body text-[10px] text-dash-text-secondary/70">{t.constanciaHint}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Step: Payment Address (only when billing differs from shipping) ─── */}
        {currentStepKey === "billing" && (
          <div className="space-y-5">
            <h3 className="font-display text-lg font-light text-brand-charcoal">
              {t.paymentAddressHeading}
            </h3>

            <Input label={t.billingName} value={billing.name} error={errors.billingName} onChange={(v) => setBilling({ ...billing, name: v })} name="cc-name" autoComplete="billing name" />
            <Input label={t.billingCompany} value={billing.company || contact.company} onChange={(v) => setBilling({ ...billing, company: v })} name="billing-organization" autoComplete="billing organization" />
            <div>
              <label htmlFor="billing-country" className="block font-body text-xs tracking-wide text-dash-text-secondary mb-1.5">{t.country}</label>
              <select
                id="billing-country"
                name="billing-country"
                autoComplete="billing country"
                value={billing.country}
                onChange={(e) => setBilling({ ...billing, country: e.target.value as "MX" | "US", state: "" })}
                className="w-full px-3 py-2.5 font-body text-sm border border-brand-stone/20 focus:border-brand-terracotta focus:outline-none bg-white"
              >
                <option value="MX">{t.mexico}</option>
                <option value="US">{t.us}</option>
              </select>
            </div>
            <Input label={t.line1} value={billing.line1} error={errors.billingLine1} onChange={(v) => setBilling({ ...billing, line1: v })} name="billing-address-line1" autoComplete="billing address-line1" />
            <Input label={t.line2} value={billing.line2} onChange={(v) => setBilling({ ...billing, line2: v })} name="billing-address-line2" autoComplete="billing address-line2" />
            {billing.country === "MX" && (
              <Input label={t.line3} value={billing.line3} onChange={(v) => setBilling({ ...billing, line3: v })} name="billing-address-line3" autoComplete="billing address-line3" />
            )}
            <div className="grid grid-cols-2 gap-4">
              <Input label={t.city} value={billing.city} error={errors.billingCity} onChange={(v) => setBilling({ ...billing, city: v })} name="billing-address-level2" autoComplete="billing address-level2" />
              {billing.country === "MX" ? (
                <div>
                  <label htmlFor="billing-state" className="block font-body text-xs tracking-wide text-dash-text-secondary mb-1.5">{t.state}</label>
                  <select
                    id="billing-state"
                    name="billing-address-level1"
                    autoComplete="billing address-level1"
                    value={billing.state}
                    onChange={(e) => setBilling({ ...billing, state: e.target.value })}
                    className={`w-full px-3 py-2.5 font-body text-sm border transition-colors focus:outline-none ${
                      errors.billingState ? "border-dash-danger" : "border-brand-stone/20 focus:border-brand-terracotta"
                    } bg-white`}
                  >
                    <option value="">{t.selectState}</option>
                    {MEXICAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.billingState && <p className="mt-1 font-body text-xs text-dash-danger" role="alert">{errors.billingState}</p>}
                </div>
              ) : (
                <Input label={t.state} value={billing.state} error={errors.billingState} onChange={(v) => setBilling({ ...billing, state: v })} name="billing-address-level1" autoComplete="billing address-level1" />
              )}
            </div>
            <Input label={t.postal} value={billing.postal} error={errors.billingPostal} onChange={(v) => setBilling({ ...billing, postal: v })} name="billing-postal-code" autoComplete="billing postal-code" />
            <Input label={t.billingPhone} type="tel" value={billing.phone} onChange={(v) => setBilling({ ...billing, phone: v })} name="billing-tel" autoComplete="billing tel" />
          </div>
        )}

        {/* ─── Step: Review ─── */}
        {currentStepKey === "review" && (
          <div className="space-y-6">
            <h2 className="font-display text-lg font-light text-brand-charcoal">{t.reviewTitle}</h2>

            {/* Line items with images */}
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 py-3 border-b border-brand-stone/5">
                  {/* Image */}
                  {item.imageSrc ? (
                    <div className="w-24 h-24 shrink-0 bg-brand-stone/5 overflow-hidden">
                      <img src={item.imageSrc} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 shrink-0 bg-brand-stone/10 flex items-center justify-center">
                      <span className="font-mono text-[10px] text-dash-text-secondary">{item.sku}</span>
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-body text-sm font-medium text-brand-charcoal">{item.name}</p>
                        <p className="font-body text-xs text-dash-text-secondary mt-0.5">{item.brand}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-dash-text-secondary/50 hover:text-dash-danger transition-colors cursor-pointer p-1"
                        aria-label="Remove"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="font-mono text-[11px] text-dash-text-secondary mt-1">
                      {t.model}: {item.sku}
                    </p>
                    {item.selectedFinish && (
                      <p className="font-body text-xs text-dash-text-secondary mt-0.5">
                        {t.finish}: {item.selectedFinish}
                      </p>
                    )}

                    {/* Qty controls */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center border border-brand-stone/20 text-dash-text-secondary hover:text-brand-charcoal transition-colors cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center font-mono text-sm text-brand-charcoal">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center border border-brand-stone/20 text-dash-text-secondary hover:text-brand-charcoal transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="font-mono text-sm text-brand-charcoal">
                        {formatted(item.listPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Shipping rates from SkyDropX */}
            <div className="space-y-2">
              <p className="font-body text-xs tracking-wide text-dash-text-secondary">{t.shippingSelect}</p>
              {shippingLoading && (
                <div className="flex items-center gap-2 px-4 py-3 bg-brand-stone/5 border border-brand-stone/10">
                  <Loader2 className="w-4 h-4 text-brand-stone animate-spin shrink-0" />
                  <p className="font-body text-sm text-dash-text-secondary">{t.shippingLoading}</p>
                </div>
              )}
              {!shippingLoading && shippingError && (
                <div className="flex items-center gap-2 px-4 py-3 bg-brand-stone/5 border border-brand-stone/10">
                  <Truck className="w-4 h-4 text-brand-stone shrink-0" />
                  <p className="font-body text-sm text-dash-text-secondary">{t.shippingError}</p>
                </div>
              )}
              {!shippingLoading && !shippingError && shippingRates.length === 0 && (
                <div className="flex items-center gap-2 px-4 py-3 bg-brand-stone/5 border border-brand-stone/10">
                  <Truck className="w-4 h-4 text-brand-stone shrink-0" />
                  <p className="font-body text-sm text-dash-text-secondary">{t.shippingFallback}</p>
                </div>
              )}
              {!shippingLoading && shippingRates.length > 0 && shippingRates.map((rate) => (
                <label
                  key={rate.rate_id}
                  className={`flex items-center justify-between px-4 py-3 border cursor-pointer transition-colors ${
                    selectedShippingRate === rate.rate_id
                      ? "border-brand-terracotta bg-brand-terracotta/5"
                      : "border-brand-stone/10 hover:border-brand-stone/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shipping-rate"
                      value={rate.rate_id}
                      checked={selectedShippingRate === rate.rate_id}
                      onChange={() => setSelectedShippingRate(rate.rate_id)}
                      className="accent-brand-terracotta"
                    />
                    <div>
                      <p className="font-body text-sm text-brand-charcoal capitalize">
                        {rate.carrier} — {rate.service}
                      </p>
                      <p className="font-body text-xs text-dash-text-secondary">
                        {rate.days_min}–{rate.days_max} {t.shippingDays}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-sm text-brand-charcoal">{formatted(rate.amount_mxn)}</span>
                </label>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-2 pt-4 border-t border-brand-stone/10">
              <div className="flex justify-between">
                <span className="font-body text-sm text-dash-text-secondary">{t.subtotal}</span>
                <span className="font-mono text-sm">{formatted(subtotal)}</span>
              </div>
              {tradeDiscountAmount > 0 && (
                <div className="flex justify-between text-brand-sage">
                  <span className="font-body text-sm">{t.tradeDiscount}</span>
                  <span className="font-mono text-sm">-{formatted(tradeDiscountAmount)}</span>
                </div>
              )}
              {isMxShipTo && (
                <div className="flex justify-between">
                  <span className="font-body text-sm text-dash-text-secondary">{t.iva}</span>
                  <span className="font-mono text-sm">{formatted(ivaAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-body text-sm text-dash-text-secondary">{t.shipping}</span>
                {chosenRate ? (
                  <span className="font-mono text-sm">{formatted(shippingAmount)}</span>
                ) : (
                  <span className="font-body text-xs text-dash-text-secondary italic">{t.shippingFallback}</span>
                )}
              </div>
              <div className="flex justify-between pt-2 border-t border-brand-stone/10">
                <span className="font-body text-sm font-medium">{t.total}</span>
                <span className="font-mono text-lg text-brand-charcoal font-medium">{formatted(total)}</span>
              </div>
            </div>

            {/* Factura status badge */}
            {factura.enabled && (
              <div className="px-3 py-2 bg-brand-sage/10 border border-brand-sage/20 font-body text-xs text-brand-charcoal">
                {t.facturaStatus} &bull; CFDI 4.0 &bull; RFC: {factura.rfc.toUpperCase()}
              </div>
            )}

            {/* Project details (optional) */}
            <details className="group border border-brand-stone/10">
              <summary className="px-4 py-3 font-body text-sm text-brand-charcoal cursor-pointer hover:bg-brand-stone/3 transition-colors flex items-center justify-between">
                <span>{t.projectDetailsOptional}</span>
                <ChevronRight className="w-4 h-4 text-dash-text-secondary transition-transform group-open:rotate-90" />
              </summary>
              <div className="px-4 pb-4 space-y-4">
                <Input label={t.projectName} value={project.projectName} onChange={(v) => setProject({ ...project, projectName: v })} />
                <Input label={t.room} value={project.room} onChange={(v) => setProject({ ...project, room: v })} />
                <Input label={t.timeline} value={project.timeline} onChange={(v) => setProject({ ...project, timeline: v })} />
                <div>
                  <label htmlFor="project-notes" className="font-body text-xs text-dash-text-secondary">{t.notes}</label>
                  <textarea
                    id="project-notes"
                    value={project.notes}
                    onChange={(e) => setProject({ ...project, notes: e.target.value })}
                    rows={3}
                    className="mt-1 w-full px-3 py-2.5 font-body text-sm border border-brand-stone/20 focus:border-brand-terracotta focus:outline-none resize-none"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={project.isTrade}
                    onChange={(e) => setProject({ ...project, isTrade: e.target.checked })}
                    className="w-4 h-4 accent-brand-terracotta"
                  />
                  <span className="font-body text-sm text-brand-charcoal">{t.isTrade}</span>
                </label>
              </div>
            </details>

            {/* Inline terms */}
            <div>
              <div
                ref={termsRef}
                onScroll={handleTermsScroll}
                className="max-h-64 overflow-y-auto border border-brand-stone/15 p-4 font-body text-xs text-dash-text-secondary leading-relaxed whitespace-pre-line"
              >
                {locale === "es" ? TERMS_ES : TERMS_EN}
              </div>
              {!termsScrolled && (
                <p className="mt-1 font-body text-[10px] text-brand-terracotta">{t.termsScrollHint}</p>
              )}
            </div>

            {/* Terms checkbox */}
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                disabled={!termsScrolled}
                className="w-4 h-4 mt-0.5 accent-brand-terracotta disabled:opacity-40"
              />
              <span className="font-body text-xs text-dash-text-secondary">{t.termsLabel}</span>
            </label>
          </div>
        )}

        {/* Error banner */}
        {submitError && (
          <div className="mt-6 px-4 py-3 bg-dash-danger-soft border border-dash-danger/30 text-dash-danger font-body text-sm" role="alert">
            {submitError}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-brand-stone/10">
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

          {!isLastStep ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1 px-6 py-3 bg-brand-terracotta text-white font-body text-sm font-medium hover:bg-brand-copper transition-colors cursor-pointer"
            >
              {t.next}
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!termsAccepted || submitting}
              className="px-8 py-3 bg-brand-terracotta text-white font-body text-sm font-medium hover:bg-brand-copper transition-colors disabled:opacity-50 disabled:cursor-default cursor-pointer flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.submitting}
                </>
              ) : (
                t.payNow
              )}
            </button>
          )}
        </div>
        </form>
      </div>
    </div>
  );
};

function Input({
  label,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
  autoComplete,
  name,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  name?: string;
}) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
  const inputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const sync = () => {
      if (el.value && el.value !== value) onChangeRef.current(el.value);
    };
    el.addEventListener("change", sync);
    el.addEventListener("animationstart", sync);
    return () => {
      el.removeEventListener("change", sync);
      el.removeEventListener("animationstart", sync);
    };
  }, [value]);

  return (
    <div>
      <label htmlFor={id} className="block font-body text-xs tracking-wide text-dash-text-secondary mb-1.5">
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        className={`w-full px-3 py-2.5 font-body text-sm border transition-colors focus:outline-none focus:ring-1 ${
          error
            ? "border-dash-danger focus:border-dash-danger focus:ring-dash-danger/20"
            : "border-brand-stone/20 focus:border-brand-terracotta focus:ring-brand-terracotta/20"
        }`}
      />
      {error && (
        <p className="mt-1 font-body text-xs text-dash-danger" role="alert">{error}</p>
      )}
    </div>
  );
}
