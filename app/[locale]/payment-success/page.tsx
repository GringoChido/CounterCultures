import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({ params }: PageProps): Promise<Metadata> => {
  const { locale } = await params;
  const isEs = locale === "es";
  return {
    title: isEs ? "Pago Recibido" : "Payment Received",
    robots: { index: false },
  };
};

const PaymentSuccessPage = async ({ params }: PageProps) => {
  const { locale } = await params;
  const lang = (locale as "en" | "es") || "en";
  const isEs = lang === "es";

  return (
    <>
      <Header locale={lang} />
      <main className="pt-20 bg-brand-linen min-h-screen">
        <div className="mx-auto max-w-2xl px-6 lg:px-8 py-24 md:py-32 text-center">
          <div className="w-16 h-16 rounded-full bg-brand-sage/20 flex items-center justify-center mx-auto mb-8">
            <svg className="w-8 h-8 text-brand-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="font-display text-3xl md:text-4xl font-light text-brand-charcoal mb-4">
            {isEs ? "Pago Recibido" : "Payment Received"}
          </h1>

          <p className="font-body text-lg text-brand-stone leading-relaxed mb-8">
            {isEs
              ? "Gracias por su compra. Hemos recibido su pago y le enviaremos una confirmacion por correo electronico en breve."
              : "Thank you for your purchase. We've received your payment and will send you an email confirmation shortly."}
          </p>

          <div className="bg-white border border-brand-stone/10 rounded-lg p-6 mb-8 text-left">
            <h2 className="font-display text-lg font-medium text-brand-charcoal mb-4">
              {isEs ? "Proximos Pasos" : "What Happens Next"}
            </h2>
            <ul className="font-body text-base text-brand-stone space-y-3">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-copper/10 text-brand-copper font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                {isEs
                  ? "Recibira un correo de confirmacion con los detalles de su pedido."
                  : "You'll receive a confirmation email with your order details."}
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-copper/10 text-brand-copper font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                {isEs
                  ? "Nuestro equipo preparara su pedido y le notificara sobre el envio."
                  : "Our team will prepare your order and notify you about shipping."}
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-copper/10 text-brand-copper font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                {isEs
                  ? "Para articulos especiales, el tiempo de entrega es de 4-8 semanas."
                  : "For special order items, delivery time is 4-8 weeks."}
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${lang}/shop`}
              className="px-8 py-3 bg-brand-terracotta text-white font-body text-sm font-medium tracking-wider hover:bg-brand-copper transition-colors"
            >
              {isEs ? "Seguir Comprando" : "Continue Shopping"}
            </Link>
            <Link
              href={`/${lang}/contact`}
              className="px-8 py-3 border border-brand-charcoal text-brand-charcoal font-body text-sm font-medium tracking-wider hover:bg-brand-charcoal hover:text-white transition-colors"
            >
              {isEs ? "Contactenos" : "Contact Us"}
            </Link>
          </div>

          <p className="font-body text-sm text-brand-stone mt-12">
            {isEs ? "Preguntas?" : "Questions?"}{" "}
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
};

export default PaymentSuccessPage;
