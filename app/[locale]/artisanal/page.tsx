import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { getProducts } from "@/app/lib/sheets";
import { ArtisanalGallery } from "./artisanal-gallery";

const BASE_URL = "https://countercultures.mx";

const artisans = [
  {
    name: "Mistoa Studio",
    location: "Guanajuato",
    specialty: "Ceramic basins in 10 colorways",
    story:
      "Each Mistoa basin is hand-shaped on the wheel, dipped in small-batch glazes inspired by the Mexican landscape — from Arcilla clay to Azul Profundo.",
  },
  {
    name: "Santa Clara del Cobre",
    location: "Michoacán",
    specialty: "Hand-hammered copper vessels",
    story:
      "The coppersmiths of Santa Clara del Cobre have forged copper since pre-Hispanic times. Each Counter Cultures basin carries the marks of its maker — Michelle, Eloy, Cindi, Flor de Plata.",
  },
  {
    name: "Stone Artisans",
    location: "Querétaro",
    specialty: "Riolita stone & travertine sinks",
    story:
      "Quarried from the volcanic highlands, each stone sink is carved by hand and polished to reveal the natural grain — no two pieces are alike.",
  },
];

interface ArtisanalPageProps {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({
  params,
}: ArtisanalPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const isEs = locale === "es";

  const title = isEs
    ? "Colección Artesanal — Hecho a Mano en México"
    : "Artisanal Collection — Handcrafted in Mexico";
  const description = isEs
    ? "Lavabos de cobre, cerámicas Mistoa, vasijas de piedra y herrajes de bronce forjado a mano — diseñados por Roger Williams y creados por artesanos mexicanos."
    : "Copper basins, Mistoa ceramic sinks, stone vessels, and hand-forged bronze hardware — designed by Roger Williams and crafted by Mexican artisans.";

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/artisanal`,
      languages: {
        en: `${BASE_URL}/en/artisanal`,
        es: `${BASE_URL}/es/artisanal`,
        "x-default": `${BASE_URL}/en/artisanal`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/artisanal`,
      locale: isEs ? "es_MX" : "en_US",
      alternateLocale: isEs ? "en_US" : "es_MX",
      type: "website",
      images: [
        {
          url: "https://images.unsplash.com/photo-1615529328331-f8917597711f?w=1200&q=80",
          width: 1200,
          height: 630,
          alt: isEs
            ? "Artesano mexicano trabajando en lavabo de cobre"
            : "Mexican artisan working on a copper basin",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://images.unsplash.com/photo-1615529328331-f8917597711f?w=1200&q=80"],
    },
  };
};

const ArtisanalPage = async ({ params }: ArtisanalPageProps) => {
  const { locale } = await params;
  const isEs = locale === "es";
  const products = await getProducts({ artisanal: true });

  // GEO: Entity-rich structured data for artisanal collection
  const artisanalJsonLd = {
    "@context": "https://schema.org",
    "@type": "Collection",
    name: isEs
      ? "Colección Artesanal Counter Cultures"
      : "Counter Cultures Artisanal Collection",
    description: isEs
      ? "Lavabos de cobre, cerámicas Mistoa, vasijas de piedra y herrajes de bronce forjado a mano — diseñados por Roger Williams y creados por artesanos mexicanos de Michoacán, Guanajuato y Querétaro."
      : "Copper basins, Mistoa ceramic sinks, stone vessels, and hand-forged bronze hardware — designed by Roger Williams and crafted by Mexican artisans from Michoacán, Guanajuato, and Querétaro.",
    url: `${BASE_URL}/${locale}/artisanal`,
    creator: {
      "@type": "Person",
      "@id": `${BASE_URL}/#founder`,
      name: "Roger Williams",
    },
    producer: {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: "Counter Cultures",
    },
    about: [
      { "@type": "Thing", name: "Copper Basins" },
      { "@type": "Thing", name: "Mexican Artisan Craft" },
      { "@type": "Thing", name: "Ceramic Sinks" },
      { "@type": "Thing", name: "Stone Vessels" },
      { "@type": "Thing", name: "Hand-Forged Bronze Hardware" },
    ],
    locationCreated: {
      "@type": "Country",
      name: "Mexico",
    },
  };

  // AEO: FAQ for artisanal collection questions
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: isEs
      ? [
          {
            "@type": "Question",
            name: "¿Cómo se hacen los lavabos de cobre de Counter Cultures?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Los lavabos de cobre de Counter Cultures son fabricados a mano por artesanos de Santa Clara del Cobre, Michoacán. Cada pieza comienza como una lámina de cobre plana de calibre 16. El artesano la calienta y la martilla sobre un molde de madera llamado yunque. Un solo lavabo requiere entre 3,000 y 8,000 golpes de martillo. La pátina natural evoluciona con el tiempo.",
            },
          },
          {
            "@type": "Question",
            name: "¿Puedo encargar una pieza artesanal personalizada?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Sí. Counter Cultures acepta encargos personalizados de lavabos de cobre, vasijas de piedra y cerámicas Mistoa. Elige el material, especifica las dimensiones, comparte tu inspiración y nuestros artesanos crearán una pieza única. Contáctanos para iniciar tu encargo.",
            },
          },
          {
            "@type": "Question",
            name: "¿Cuánto tiempo tarda un encargo artesanal?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Los tiempos de producción varían según la complejidad: lavabos de cobre estándar 3–4 semanas, piezas personalizadas de cobre 5–8 semanas, vasijas de piedra talladas a mano 4–6 semanas, cerámicas Mistoa 3–5 semanas.",
            },
          },
        ]
      : [
          {
            "@type": "Question",
            name: "How are Counter Cultures copper basins made?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Counter Cultures copper basins are handmade by artisans from Santa Clara del Cobre, Michoacán. Each piece starts as a flat 16-gauge copper sheet. The artisan heats it and hammers it over a wooden form called a yunque. A single basin requires 3,000–8,000 hammer strikes. The natural patina evolves over time.",
            },
          },
          {
            "@type": "Question",
            name: "Can I commission a custom artisanal piece?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Counter Cultures accepts custom commissions for copper basins, stone vessels, and Mistoa ceramics. Choose your material, specify dimensions, share your inspiration, and our artisans will craft a one-of-a-kind piece. Contact us to begin your commission.",
            },
          },
          {
            "@type": "Question",
            name: "How long does an artisanal commission take?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Production times vary by complexity: standard copper basins 3–4 weeks, custom copper pieces 5–8 weeks, hand-carved stone vessels 4–6 weeks, Mistoa ceramics 3–5 weeks.",
            },
          },
        ],
  };

  // BreadcrumbList JSON-LD
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: isEs ? "Inicio" : "Home",
        item: `${BASE_URL}/${locale}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: isEs ? "Artesanal" : "Artisanal",
        item: `${BASE_URL}/${locale}/artisanal`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(artisanalJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Header locale={locale} />
      <main className="pt-16 md:pt-20">
        {/* Hero */}
        <section className="relative py-32 lg:py-40 overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1615529328331-f8917597711f?w=1920&q=75&auto=format"
              alt="Mexican artisan hand-hammering a copper basin in a traditional workshop"
              fill
              sizes="100vw"
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-brand-charcoal/50" />
          </div>
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <span className="font-mono text-xs tracking-[0.2em] text-brand-copper uppercase">
              The Artisanal Collection
            </span>
            <h1 className="mt-6 font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-light text-white tracking-wide leading-tight">
              Handcrafted by Mexico&apos;s
              <br />
              <span className="italic">Master Artisans</span>
            </h1>
            <p className="mt-6 font-body text-lg text-white/70 max-w-xl">
              Copper basins, Mistoa ceramics, riolita stone sinks, and hand-forged
              bronze hardware — each piece designed by Roger Williams and crafted by
              artisans he&apos;s collaborated with for nearly two decades.
            </p>
          </div>
        </section>

        {/* Artisan Profiles */}
        <section className="py-20 lg:py-28 bg-brand-linen">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <span className="font-mono text-xs tracking-[0.2em] text-brand-stone uppercase">
              The Makers
            </span>
            <h2 className="mt-3 font-display text-4xl md:text-5xl font-light tracking-wide text-brand-charcoal mb-14">
              Our Artisans
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {artisans.map((artisan) => (
                <div
                  key={artisan.name}
                  className="bg-white p-8 border border-brand-stone/5"
                >
                  <div className="w-10 h-0.5 bg-brand-copper mb-6" />
                  <h3 className="font-display text-xl font-light text-brand-charcoal tracking-wide">
                    {artisan.name}
                  </h3>
                  <p className="mt-1 font-mono text-xs text-brand-copper tracking-wide">
                    {artisan.location} · {artisan.specialty}
                  </p>
                  <p className="mt-4 font-body text-sm text-brand-stone leading-relaxed">
                    {artisan.story}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Product Gallery */}
        <ArtisanalGallery products={products} />

        {/* Commission CTA */}
        <section className="py-20 lg:py-28 bg-brand-charcoal text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <span className="font-mono text-xs tracking-[0.2em] text-brand-copper uppercase">
              Bespoke
            </span>
            <h2 className="mt-4 font-display text-4xl md:text-5xl font-light tracking-wide">
              Commission a Custom Piece
            </h2>
            <p className="mt-4 font-body text-base text-white/60 max-w-lg mx-auto">
              Choose your material — copper, stone, or ceramic — specify dimensions,
              share your inspiration, and our artisans will craft a one-of-a-kind piece.
            </p>
            <Link
              href="/contact?type=commission"
              className="inline-block mt-8 px-8 py-4 border border-brand-copper/40 text-brand-copper font-body text-sm font-medium tracking-wider uppercase hover:bg-brand-copper/10 transition-colors duration-300"
            >
              Start Your Commission
            </Link>
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
};

export default ArtisanalPage;
