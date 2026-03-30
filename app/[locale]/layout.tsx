import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Cormorant_Garamond, DM_Sans, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/app/i18n/routing";
import "../globals.css";

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Counter Cultures — The Connected System",
    template: "%s | Counter Cultures",
  },
  description:
    "San Miguel de Allende's premier bath and kitchen fixture destination. Where world-class design meets the soul of Mexican craft.",
  metadataBase: new URL("https://countercultures.mx"),
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: "es_MX",
    siteName: "Counter Cultures",
  },
};

export const generateStaticParams = () => {
  return routing.locales.map((locale) => ({ locale }));
};

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

const LocaleLayout = async ({ children, params }: LocaleLayoutProps) => {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${cormorantGaramond.variable} ${dmSans.variable} ${jetBrainsMono.variable}`}
    >
      <body className="min-h-screen flex flex-col antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
};

export default LocaleLayout;
