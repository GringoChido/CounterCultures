import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { CartWordmark } from "@/app/components/cart/cart-watermark";

interface PageProps {
  params: Promise<{ locale: string; dealId: string }>;
  searchParams: Promise<{ tracker?: string }>;
}

export const generateMetadata = async ({ params }: PageProps): Promise<Metadata> => {
  const { locale } = await params;
  return {
    title: locale === "es" ? "Cotización Enviada" : "Quote Submitted",
    robots: { index: false },
  };
};

const WHATSAPP_NUMBER = "524151548375";

export default async function SubmittedPage({ params, searchParams }: PageProps) {
  const { locale, dealId } = await params;
  const { tracker } = await searchParams;
  setRequestLocale(locale);
  const lang = (locale as "en" | "es") || "en";
  const isEs = lang === "es";

  const whatsappText = isEs
    ? `Hola, acabo de enviar una solicitud de cotización (${dealId}). ¿Podrían darme seguimiento?`
    : `Hi, I just submitted a quote request (${dealId}). Could you follow up with me?`;
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText)}`;

  return (
    <>
      <Header locale={lang} />
      <main id="main" tabIndex={-1} className="pt-20 bg-brand-linen min-h-screen">
        <div className="mx-auto max-w-2xl px-6 lg:px-8 py-24 md:py-32 text-center">
          <div className="flex justify-center mb-6">
            <CartWordmark />
          </div>
          <div className="w-16 h-16 rounded-full bg-brand-sage/20 flex items-center justify-center mx-auto mb-8">
            <svg className="w-8 h-8 text-brand-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="font-display text-3xl md:text-4xl font-light text-brand-charcoal mb-4">
            {isEs ? "Cotización Enviada" : "Quote Request Submitted"}
          </h1>

          <p className="font-body text-lg text-dash-text-secondary leading-relaxed mb-2">
            {isEs
              ? "Gracias. Hemos recibido su solicitud y nuestro equipo está preparando su cotización formal."
              : "Thank you. We've received your request and our team is preparing your formal quote."}
          </p>

          <p className="font-mono text-sm text-dash-text-secondary/70 mb-8">
            {isEs ? "Referencia" : "Reference"}: {dealId}
          </p>

          <div className="bg-dash-surface border border-brand-stone/10 rounded-lg p-6 mb-8 text-left">
            <h2 className="font-display text-lg font-medium text-brand-charcoal mb-4">
              {isEs ? "Próximos Pasos" : "What Happens Next"}
            </h2>
            <ul className="font-body text-base text-dash-text-secondary space-y-3">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-copper/10 text-brand-copper font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                {isEs
                  ? "Recibirá una cotización formal dentro de las próximas 24 horas hábiles."
                  : "You'll receive a formal quote within the next 24 business hours."}
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-copper/10 text-brand-copper font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                {isEs
                  ? "Incluirá precios finales, disponibilidad exacta y opciones de envío."
                  : "It will include final pricing, exact availability, and shipping options."}
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-copper/10 text-brand-copper font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                {isEs
                  ? "Puede aceptar, negociar, o solicitar cambios directamente desde el enlace de seguimiento."
                  : "You can accept, negotiate, or request changes directly from your tracking link."}
              </li>
            </ul>
          </div>

          {tracker && (
            <div className="bg-brand-charcoal/5 border border-brand-stone/10 rounded-lg p-4 mb-8">
              <p className="font-body text-sm text-dash-text-secondary mb-2">
                {isEs ? "Enlace de seguimiento (guardado en su correo)" : "Tracking link (also sent to your email)"}
              </p>
              <code className="font-mono text-xs text-brand-terracotta break-all">{tracker}</code>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-vendor-whatsapp text-white font-body text-sm font-medium tracking-wider hover:bg-vendor-whatsapp-dark transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.638l4.67-1.222A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.344 0-4.532-.691-6.367-1.879l-.447-.291-2.88.754.768-2.806-.319-.505A9.946 9.946 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z" />
              </svg>
              {isEs ? "Escribir por WhatsApp" : "Message on WhatsApp"}
            </a>
            <Link
              href={`/${lang}/shop`}
              className="px-8 py-3 border border-brand-charcoal text-brand-charcoal font-body text-sm font-medium tracking-wider hover:bg-brand-charcoal hover:text-white transition-colors text-center"
            >
              {isEs ? "Seguir Navegando" : "Continue Browsing"}
            </Link>
          </div>

          <p className="font-body text-sm text-dash-text-secondary mt-12">
            {isEs ? "¿Preguntas?" : "Questions?"}{" "}
            <a href="mailto:equipo@countercultures.com.mx" className="text-brand-terracotta hover:underline">
              equipo@countercultures.com.mx
            </a>
            {" | "}
            <a href="tel:4151548375" className="text-brand-terracotta hover:underline">
              415.154.8375
            </a>
          </p>
        </div>
      </main>
      <Footer locale={lang} />
    </>
  );
}
