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

  const title = isEs ? "Métodos de Pago" : "Payment Methods";
  const description = isEs
    ? "Métodos de pago aceptados por Counter Cultures: transferencias, tarjetas, efectivo, PayPal y más."
    : "Payment methods accepted by Counter Cultures: bank transfers, cards, cash, PayPal, and more.";

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/payment-methods`,
      languages: {
        en: `${BASE_URL}/en/payment-methods`,
        es: `${BASE_URL}/es/payment-methods`,
        "x-default": `${BASE_URL}/en/payment-methods`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/payment-methods`,
      locale: isEs ? "es_MX" : "en_US",
      type: "website",
    },
  };
};

const PaymentMethodsPage = async ({ params }: PageProps) => {
  const { locale } = await params;
  const lang = (locale as "en" | "es") || "en";
  const isEs = lang === "es";

  return (
    <>
      <Header locale={lang} />
      <main className="pt-20 bg-brand-linen min-h-screen">
        <div className="mx-auto max-w-3xl px-6 lg:px-8 py-16 md:py-24">
          <h1 className="font-display text-3xl md:text-4xl font-light text-brand-charcoal mb-8">
            {isEs ? "Métodos de Pago" : "Payment Methods"}
          </h1>

          <h2 className="font-display text-xl font-medium text-brand-charcoal mt-10 mb-4">
            {isEs ? "Efectivo y Transferencias Bancarias" : "Cash & Bank Transfers"}
          </h2>
          <p className="font-body text-base text-brand-charcoal/80 leading-relaxed mb-4">
            {isEs
              ? "Se aceptan pagos en efectivo, cheque o transferencias electrónicas a nuestra cuenta Santander. Envíe su comprobante a "
              : "We accept payments by cash, check, or electronic transfer to our Santander account. Send your proof of payment to "}
            <a href="mailto:cuentas@countercultures.com.mx" className="text-brand-terracotta hover:underline">
              cuentas@countercultures.com.mx
            </a>
          </p>

          <h2 className="font-display text-xl font-medium text-brand-charcoal mt-10 mb-4">
            {isEs ? "Cheques" : "Checks"}
          </h2>
          <ul className="font-body text-base text-brand-charcoal/80 list-disc pl-6 space-y-2 mb-4">
            <li>{isEs ? "A nombre de la empresa" : "Made payable to the company"}</li>
            <li>{isEs ? "Cantidad y firma claramente escritas" : "Amount and signature clearly written"}</li>
            <li>{isEs ? "Mínimo: $500 USD/CAD" : "Minimum: $500 USD/CAD"}</li>
            <li>{isEs ? "Dirección: San Juan 11A, Col. Providencia, San Miguel de Allende, Gto. CP.37737" : "Address: San Juan 11A, Col. Providencia, San Miguel de Allende, Gto. CP.37737"}</li>
          </ul>

          <h2 className="font-display text-xl font-medium text-brand-charcoal mt-10 mb-4">
            Mercado Pago
          </h2>
          <ul className="font-body text-base text-brand-charcoal/80 list-disc pl-6 space-y-2 mb-4">
            <li>{isEs ? "Se aceptan cuentas de Mercado Libre" : "Mercado Libre accounts accepted"}</li>
            <li>{isEs ? "VISA, Mastercard, American Express aceptadas" : "VISA, Mastercard, American Express accepted"}</li>
          </ul>

          <h2 className="font-display text-xl font-medium text-brand-charcoal mt-10 mb-4">
            Compro Pago
          </h2>
          <p className="font-body text-base text-brand-charcoal/80 leading-relaxed mb-4">
            {isEs
              ? "Depósitos en efectivo en: OXXO, 7-Eleven, Extra, Del Sol, Elektra, Coppel, Woolworth, Casa Ley, Benavides, Guadalajara, Esquivar, ABC, y bancos (Banamex, Bancomer, Scotiabank, Inbursa, Santander, Banorte, Bancoppel)"
              : "Cash deposits at: OXXO, 7-Eleven, Extra, Del Sol, Elektra, Coppel, Woolworth, Casa Ley, Benavides, Guadalajara, Esquivar, ABC, and banks (Banamex, Bancomer, Scotiabank, Inbursa, Santander, Banorte, Bancoppel)"}
          </p>

          <h2 className="font-display text-xl font-medium text-brand-charcoal mt-10 mb-4">
            {isEs ? "Efectivo en Persona" : "In-Person Cash"}
          </h2>
          <p className="font-body text-base text-brand-charcoal/80 leading-relaxed mb-4">
            {isEs
              ? "En nuestra ubicación: San Juan 11A, Col. Providencia, San Miguel de Allende"
              : "At our location: San Juan 11A, Col. Providencia, San Miguel de Allende"}
          </p>

          <h2 className="font-display text-xl font-medium text-brand-charcoal mt-10 mb-4">
            PayPal
          </h2>
          <p className="font-body text-base text-brand-charcoal/80 leading-relaxed mb-4">
            {isEs
              ? "PayPal resguarda tus datos. No se requieren datos de tarjeta."
              : "PayPal protects your information. No card details required."}
          </p>

          <h2 className="font-display text-xl font-medium text-brand-charcoal mt-10 mb-4">
            {isEs ? "Nota Importante" : "Important Note"}
          </h2>
          <p className="font-body text-base text-brand-charcoal/80 leading-relaxed mb-4 font-medium">
            {isEs
              ? "No se pueden combinar las formas de pago dentro de un mismo pedido."
              : "Payment methods cannot be combined within a single order."}
          </p>

          <div className="font-body text-sm text-brand-stone mt-8 pt-8 border-t border-brand-stone/10">
            <p>
              {isEs ? "Contacto" : "Contact"}:{" "}
              <a href="mailto:equipo@countercultures.com.mx" className="text-brand-terracotta hover:underline">
                equipo@countercultures.com.mx
              </a>
              {" | "}
              <a href="tel:4151548375" className="text-brand-terracotta hover:underline">
                415.154.8375
              </a>
            </p>
            <p className="mt-2">
              {isEs
                ? "Horario: Lunes a Viernes 10 AM \u2013 6 PM; Cerrado fines de semana"
                : "Hours: Monday\u2013Friday 10 AM \u2013 6 PM; Closed weekends"}
            </p>
          </div>
        </div>
      </main>
      <Footer locale={lang} />
    </>
  );
};

export default PaymentMethodsPage;
