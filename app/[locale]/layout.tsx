import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/app/i18n/routing";
import { ChatWidget } from "@/app/components/ui/chat-widget";
import "../globals.css";

const BASE_URL = "https://countercultures.mx";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Counter Cultures — Luxury Bath & Kitchen Fixtures in San Miguel de Allende",
    template: "%s | Counter Cultures",
  },
  description:
    "San Miguel de Allende's premier showroom for luxury bath, kitchen, and hardware fixtures. Authorized dealer for Kohler, TOTO, Brizo, BLANCO, and more — alongside handcrafted Mexican artisanal pieces.",
  keywords: [
    "luxury bath fixtures",
    "kitchen fixtures Mexico",
    "Kohler dealer Mexico",
    "TOTO fixtures San Miguel",
    "Brizo faucets",
    "BLANCO sinks",
    "Mexican artisan basins",
    "hardware showroom San Miguel de Allende",
    "Counter Cultures",
  ],
  authors: [{ name: "Counter Cultures", url: BASE_URL }],
  creator: "Counter Cultures",
  publisher: "Counter Cultures",
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: "es_MX",
    siteName: "Counter Cultures",
    url: BASE_URL,
    title: "Counter Cultures — Luxury Bath & Kitchen Fixtures",
    description:
      "San Miguel de Allende's premier showroom for luxury bath, kitchen, and hardware fixtures. Kohler, TOTO, Brizo, BLANCO, and handcrafted Mexican artisanal pieces.",
    images: [
      {
        url: `${BASE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Counter Cultures showroom — luxury bath and kitchen fixtures in San Miguel de Allende",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Counter Cultures — Luxury Bath & Kitchen Fixtures",
    description:
      "San Miguel de Allende's premier showroom for luxury bath, kitchen, and hardware fixtures.",
    images: [`${BASE_URL}/og-image.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
    languages: {
      "en": `${BASE_URL}/en`,
      "es": `${BASE_URL}/es`,
      "x-default": `${BASE_URL}/en`,
    },
  },
};

export const generateStaticParams = () => {
  return routing.locales.map((locale) => ({ locale }));
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": ["Organization", "LocalBusiness", "Store"],
  "@id": `${BASE_URL}/#organization`,
  name: "Counter Cultures",
  alternateName: "Counter Cultures San Miguel",
  description:
    "San Miguel de Allende's premier showroom for luxury bath, kitchen, and hardware fixtures. Authorized dealer for Kohler, TOTO, Brizo, BLANCO, California Faucets, Sun Valley Bronze, Emtek, Badeloft, Villeroy & Boch, Mistoa, and Banté. Founded in 2004 by Roger Williams.",
  url: BASE_URL,
  logo: `${BASE_URL}/logo.png`,
  image: `${BASE_URL}/og-image.jpg`,
  telephone: "+52 415 XXX XXXX",
  email: "info@countercultures.mx",
  foundingDate: "2004",
  founder: {
    "@type": "Person",
    name: "Roger Williams",
  },
  address: {
    "@type": "PostalAddress",
    streetAddress: "Providencia",
    addressLocality: "San Miguel de Allende",
    addressRegion: "Guanajuato",
    addressCountry: "MX",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 20.9144,
    longitude: -100.7452,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "10:00",
      closes: "18:00",
    },
  ],
  priceRange: "$$$",
  currenciesAccepted: "MXN, USD",
  paymentAccepted: "Cash, Credit Card, Bank Transfer",
  areaServed: [
    {
      "@type": "City",
      name: "San Miguel de Allende",
    },
    {
      "@type": "State",
      name: "Guanajuato",
    },
    {
      "@type": "Country",
      name: "Mexico",
    },
  ],
  sameAs: [
    "https://instagram.com/countercultures",
    "https://facebook.com/countercultures",
    "https://pinterest.com/countercultures",
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Bath, Kitchen & Hardware Fixtures",
    itemListElement: [
      { "@type": "OfferCatalog", name: "Bathroom Fixtures" },
      { "@type": "OfferCatalog", name: "Kitchen Fixtures" },
      { "@type": "OfferCatalog", name: "Door Hardware" },
      { "@type": "OfferCatalog", name: "Artisanal Collection" },
    ],
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${BASE_URL}/#website`,
  url: BASE_URL,
  name: "Counter Cultures",
  description:
    "Luxury bath, kitchen, and hardware fixtures showroom in San Miguel de Allende, Mexico.",
  publisher: {
    "@id": `${BASE_URL}/#organization`,
  },
  inLanguage: ["en", "es"],
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${BASE_URL}/en/shop?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
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
    <div
      lang={locale}
      className="min-h-screen flex flex-col antialiased"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteJsonLd),
        }}
      />
      <NextIntlClientProvider messages={messages}>
        {children}
        <ChatWidget locale={locale} />
      </NextIntlClientProvider>
    </div>
  );
};

export default LocaleLayout;
