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
    default: "Counter Cultures | Premium Kitchen, Bath & Architectural Hardware | San Miguel de Allende",
    template: "%s | Counter Cultures",
  },
  description:
    "Premium kitchen, bath, and architectural hardware showroom in San Miguel de Allende, Mexico. Authorized dealer for Kohler, TOTO, Brizo, BLANCO, California Faucets, and 14 more brands. 491 curated pieces — international brands and Mexican artisans, sourced worldwide and delivered to your project.",
  keywords: [
    "luxury bath fixtures San Miguel de Allende",
    "kitchen fixtures Mexico",
    "Kohler dealer Mexico",
    "TOTO WASHLET San Miguel",
    "Brizo faucets Mexico",
    "BLANCO sinks Mexico",
    "Mexican artisan basins copper",
    "hardware showroom San Miguel de Allende",
    "Counter Cultures",
    "accesorios de baño lujo",
    "grifería cocina México",
    "lavabos artesanales mexicanos",
  ],
  authors: [{ name: "Counter Cultures", url: BASE_URL }],
  creator: "Counter Cultures",
  publisher: "Counter Cultures",
  category: "Home Improvement",
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: "es_MX",
    siteName: "Counter Cultures",
    url: BASE_URL,
    title: "Counter Cultures | Premium Kitchen, Bath & Hardware | San Miguel de Allende",
    description:
      "Premium kitchen, bath & architectural hardware showroom in San Miguel de Allende. Authorized dealer for Kohler, TOTO, Brizo, BLANCO, and 15 more brands. 491 curated pieces delivered to your project.",
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
    site: "@countercultures",
    creator: "@countercultures",
    title: "Counter Cultures | Premium Kitchen, Bath & Hardware | San Miguel de Allende",
    description:
      "Premium kitchen, bath & architectural hardware showroom in San Miguel de Allende. 491 curated pieces from 19 authorized brands.",
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
      en: `${BASE_URL}/en`,
      es: `${BASE_URL}/es`,
      "x-default": `${BASE_URL}/en`,
    },
  },
};

export const generateStaticParams = () => {
  return routing.locales.map((locale) => ({ locale }));
};

// GEO: Rich Organization + LocalBusiness schema with entity signals
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": ["Organization", "LocalBusiness", "Store", "HomeAndConstructionBusiness"],
  "@id": `${BASE_URL}/#organization`,
  name: "Counter Cultures",
  alternateName: ["Counter Cultures San Miguel", "Counter Cultures MX"],
  legalName: "Counter Cultures",
  description:
    "San Miguel de Allende's premier showroom for luxury bath, kitchen, and hardware fixtures. Authorized dealer for Kohler, TOTO, Brizo, BLANCO, California Faucets, Sun Valley Bronze, Emtek, Badeloft, Villeroy & Boch, Mistoa, and Banté. Founded in 2004 by Roger Williams.",
  url: BASE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${BASE_URL}/logo.png`,
    width: 200,
    height: 60,
  },
  image: {
    "@type": "ImageObject",
    url: `${BASE_URL}/og-image.jpg`,
    width: 1200,
    height: 630,
  },
  telephone: "+52-415-000-0000",
  email: "info@countercultures.mx",
  foundingDate: "2004",
  numberOfEmployees: { "@type": "QuantitativeValue", value: 10 },
  founder: {
    "@type": "Person",
    "@id": `${BASE_URL}/#founder`,
    name: "Roger Williams",
    jobTitle: "Founder & Principal",
    worksFor: { "@id": `${BASE_URL}/#organization` },
  },
  address: {
    "@type": "PostalAddress",
    streetAddress: "Providencia",
    addressLocality: "San Miguel de Allende",
    addressRegion: "Guanajuato",
    postalCode: "37700",
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
    { "@type": "City", name: "San Miguel de Allende" },
    { "@type": "State", name: "Guanajuato" },
    { "@type": "Country", name: "Mexico" },
  ],
  knowsAbout: [
    "Luxury Bath Fixtures",
    "Kitchen Fixtures",
    "Door Hardware",
    "Artisanal Mexican Crafts",
    "Interior Design",
    "Architecture",
    "Plumbing Fixtures",
    "Kohler",
    "TOTO",
    "Brizo",
    "BLANCO",
    "California Faucets",
    "Sun Valley Bronze",
    "Emtek",
  ],
  sameAs: [
    "https://www.instagram.com/countercultures",
    "https://www.facebook.com/countercultures",
    "https://www.pinterest.com/countercultures",
    "https://countercultures.mx",
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Bath, Kitchen & Hardware Fixtures",
    itemListElement: [
      {
        "@type": "OfferCatalog",
        name: "Bathroom Fixtures",
        description:
          "Sinks, faucets, bathtubs, toilets, showers, and bathroom accessories from Kohler, TOTO, Badeloft, California Faucets, and Mexican artisans.",
        url: `${BASE_URL}/en/shop/bathroom`,
      },
      {
        "@type": "OfferCatalog",
        name: "Kitchen Fixtures",
        description:
          "Sinks by BLANCO and Kohler, faucets by Brizo and California Faucets, range hoods, and professional appliances.",
        url: `${BASE_URL}/en/shop/kitchen`,
      },
      {
        "@type": "OfferCatalog",
        name: "Door Hardware",
        description:
          "Hand-cast bronze entry sets by Sun Valley Bronze and precision door hardware by Emtek.",
        url: `${BASE_URL}/en/shop/hardware`,
      },
      {
        "@type": "OfferCatalog",
        name: "Artisanal Collection",
        description:
          "Handcrafted copper basins, Mistoa ceramic sinks, stone vessels, and forged bronze hardware by Mexican artisans.",
        url: `${BASE_URL}/en/artisanal`,
      },
    ],
  },
  brand: [
    { "@type": "Brand", name: "Kohler" },
    { "@type": "Brand", name: "TOTO" },
    { "@type": "Brand", name: "Brizo" },
    { "@type": "Brand", name: "BLANCO" },
    { "@type": "Brand", name: "California Faucets" },
    { "@type": "Brand", name: "Sun Valley Bronze" },
    { "@type": "Brand", name: "Emtek" },
    { "@type": "Brand", name: "Badeloft" },
    { "@type": "Brand", name: "Mistoa" },
    { "@type": "Brand", name: "Villeroy & Boch" },
  ],
};

// AEO/GEO: WebSite with SearchAction for sitelinks searchbox
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${BASE_URL}/#website`,
  url: BASE_URL,
  name: "Counter Cultures",
  alternateName: "Counter Cultures San Miguel de Allende",
  description:
    "Luxury bath, kitchen, and hardware fixtures showroom in San Miguel de Allende, Mexico.",
  publisher: {
    "@id": `${BASE_URL}/#organization`,
  },
  inLanguage: ["en-US", "es-MX"],
  potentialAction: [
    {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/en/shop?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/es/shop?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  ],
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
