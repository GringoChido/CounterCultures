import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { BRANDS } from "@/app/lib/constants";
import { getProducts } from "@/app/lib/sheets";
import { ArtisanalGallery } from "../artisanal/artisanal-gallery";

const BASE_URL = "https://countercultures.mx";

/* ------------------------------------------------------------------ */
/*  Artisan profiles                                                   */
/* ------------------------------------------------------------------ */

const artisans = [
  {
    name: "Mistoa Studio",
    location: "Guanajuato",
    specialty: "Ceramic basins in 10 colorways",
    image: "/Assets/Mistoa Studio.png",
    alt: "Mistoa Studio ceramic basin handcrafted in Guanajuato, Mexico",
    story:
      "Each Mistoa basin is hand-shaped on the wheel, dipped in small-batch glazes inspired by the Mexican landscape — from Arcilla clay to Azul Profundo.",
  },
  {
    name: "Santa Clara del Cobre",
    location: "Michoacán",
    specialty: "Hand-hammered copper vessels",
    image: "/Assets/Santa Clara del Cobre.webp",
    alt: "Hand-hammered copper basin by artisans of Santa Clara del Cobre, Michoacán",
    story:
      "The coppersmiths of Santa Clara del Cobre have forged copper since pre-Hispanic times. Each Counter Cultures basin carries the marks of its maker — Michelle, Eloy, Cindi, Flor de Plata.",
  },
  {
    name: "Stone Artisans",
    location: "Querétaro",
    specialty: "Riolita stone & travertine sinks",
    image: "/Assets/Stone Artisans.webp",
    alt: "Hand-carved riolita stone sink by artisans in Querétaro, Mexico",
    story:
      "Quarried from the volcanic highlands, each stone sink is carved by hand and polished to reveal the natural grain — no two pieces are alike.",
  },
];

/* ------------------------------------------------------------------ */
/*  Brand descriptions                                                 */
/* ------------------------------------------------------------------ */

const brandDescriptions: Record<string, { tagline: string; description: string; origin: string }> = {
  kohler: {
    tagline: "Bold Looks. Lasting Quality.",
    description: "Since 1873, Kohler has defined kitchen and bath innovation — from precision-engineered faucets to their iconic cast iron sinks.",
    origin: "Wisconsin, USA",
  },
  toto: {
    tagline: "People-First Innovation.",
    description: "Japan's leading fixture manufacturer, known for CEFIONTECT glaze technology and the world's most advanced toilet engineering.",
    origin: "Kitakyushu, Japan",
  },
  brizo: {
    tagline: "Fashion for the Home.",
    description: "Brizo brings fashion-forward design to kitchen and bath — the Litze collection's industrial precision is a kitchen centerpiece.",
    origin: "Indianapolis, USA",
  },
  blanco: {
    tagline: "The Kitchen Sink Experts.",
    description: "German engineering meets kitchen design. BLANCO's patented Silgranit material is heat, scratch, and stain resistant.",
    origin: "Oberderdingen, Germany",
  },
  "california-faucets": {
    tagline: "Handcrafted in Huntington Beach.",
    description: "Over 30 finish options, made to order in California. Bridge-style faucets and custom configurations for architects.",
    origin: "Huntington Beach, USA",
  },
  "sun-valley-bronze": {
    tagline: "Hand-Cast. Hand-Finished. Idaho-Made.",
    description: "Each Sun Valley Bronze lock set is individually sand-cast in silicon bronze and hand-finished — functional sculpture for your door.",
    origin: "Bellevue, Idaho, USA",
  },
  emtek: {
    tagline: "Hardware for Every Style.",
    description: "Solid brass door hardware with designs spanning modern to traditional — Hampton, Ribbon & Reed, T-Bar, and more.",
    origin: "City of Industry, USA",
  },
  badeloft: {
    tagline: "Modern Bathing Reimagined.",
    description: "Freestanding tubs in seamless mineral casting — sculptural forms with ergonomic comfort and easy-clean surfaces.",
    origin: "Berlin, Germany",
  },
  bante: {
    tagline: "Farmhouse Refined.",
    description: "Fireclay and ceramic farmhouse sinks — the Duetto, Marea, and Duo collections bring timeless style to the kitchen.",
    origin: "Mexico",
  },
  mistoa: {
    tagline: "Mexican Artisanal Ceramics.",
    description: "Hand-shaped ceramic basins available in 10 curated colorways inspired by the Mexican landscape — Surco, Poas, Barú, Sisa, Musa.",
    origin: "Guanajuato, Mexico",
  },
  "villeroy-boch": {
    tagline: "European Craftsmanship Since 1748.",
    description: "The Architectura line brings German precision to the bathroom — undermount, vessel, and countertop basins in timeless white.",
    origin: "Mettlach, Germany",
  },
  aquaspa: {
    tagline: "Spa-Grade Shower Systems.",
    description: "Rain showers, body sprays, and complete spa systems — bringing the luxury spa experience into the home.",
    origin: "Mexico",
  },
};

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

interface BrandsPageProps {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({
  params,
}: BrandsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const isEs = locale === "es";

  const title = isEs
    ? "Marcas y Artesanos — Counter Cultures"
    : "Brands & Makers — Counter Cultures";
  const description = isEs
    ? "Distribuidor autorizado de Kohler, TOTO, Brizo, BLANCO y más. Artesanos mexicanos de cobre, cerámica y piedra. Descubre nuestra colección en San Miguel de Allende."
    : "Authorized dealer for Kohler, TOTO, Brizo, BLANCO, and more. Mexican artisans crafting copper, ceramic, and stone. Discover our collection in San Miguel de Allende.";

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/brands`,
      languages: {
        en: `${BASE_URL}/en/brands`,
        es: `${BASE_URL}/es/brands`,
        "x-default": `${BASE_URL}/en/brands`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/brands`,
      locale: isEs ? "es_MX" : "en_US",
      alternateLocale: isEs ? "en_US" : "es_MX",
      type: "website",
      images: [
        {
          url: "https://images.unsplash.com/photo-1615529328331-f8917597711f?w=1200&q=80",
          width: 1200,
          height: 630,
          alt: isEs
            ? "Marcas de lujo y artesanos mexicanos — Counter Cultures"
            : "Luxury brands and Mexican artisans — Counter Cultures",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

const BrandsPage = async ({ params }: BrandsPageProps) => {
  const { locale } = await params;
  const isEs = locale === "es";
  const products = await getProducts({ artisanal: true });

  const brandListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: isEs
      ? "Marcas y Artesanos — Counter Cultures"
      : "Brands & Makers — Counter Cultures",
    description: isEs
      ? "Counter Cultures es distribuidor autorizado de Kohler, TOTO, Brizo, BLANCO, California Faucets, Sun Valley Bronze y más. Artesanos mexicanos de cobre, cerámica y piedra en San Miguel de Allende."
      : "Counter Cultures is an authorized dealer for Kohler, TOTO, Brizo, BLANCO, California Faucets, Sun Valley Bronze, and more. Mexican artisans crafting copper, ceramic, and stone in San Miguel de Allende.",
    url: `${BASE_URL}/${locale}/brands`,
    numberOfItems: BRANDS.length,
    itemListElement: BRANDS.map((brand, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Brand",
        name: brand.name,
        url: `${BASE_URL}/${locale}/brands/${brand.slug}`,
      },
    })),
  };

  const artisanalJsonLd = {
    "@context": "https://schema.org",
    "@type": "Collection",
    name: isEs
      ? "Colección Artesanal Counter Cultures"
      : "Counter Cultures Artisanal Collection",
    description: isEs
      ? "Lavabos de cobre, cerámicas Mistoa, vasijas de piedra y herrajes de bronce forjado a mano — diseñados por Roger Williams y creados por artesanos mexicanos."
      : "Copper basins, Mistoa ceramic sinks, stone vessels, and hand-forged bronze hardware — designed by Roger Williams and crafted by Mexican artisans.",
    url: `${BASE_URL}/${locale}/brands`,
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
    ],
    locationCreated: { "@type": "Country", name: "Mexico" },
  };

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
              text: "Los lavabos de cobre de Counter Cultures son fabricados a mano por artesanos de Santa Clara del Cobre, Michoacán. Cada pieza comienza como una lámina de cobre plana de calibre 16. El artesano la calienta y la martilla sobre un molde de madera llamado yunque. Un solo lavabo requiere entre 3,000 y 8,000 golpes de martillo.",
            },
          },
          {
            "@type": "Question",
            name: "¿Puedo encargar una pieza artesanal personalizada?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Sí. Counter Cultures acepta encargos personalizados de lavabos de cobre, vasijas de piedra y cerámicas Mistoa. Elige el material, especifica las dimensiones, comparte tu inspiración y nuestros artesanos crearán una pieza única.",
            },
          },
        ]
      : [
          {
            "@type": "Question",
            name: "How are Counter Cultures copper basins made?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Counter Cultures copper basins are handmade by artisans from Santa Clara del Cobre, Michoacán. Each piece starts as a flat 16-gauge copper sheet. The artisan heats it and hammers it over a wooden form called a yunque. A single basin requires 3,000–8,000 hammer strikes.",
            },
          },
          {
            "@type": "Question",
            name: "Can I commission a custom artisanal piece?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Counter Cultures accepts custom commissions for copper basins, stone vessels, and Mistoa ceramics. Choose your material, specify dimensions, share your inspiration, and our artisans will craft a one-of-a-kind piece.",
            },
          },
        ],
  };

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
        name: isEs ? "Marcas y Artesanos" : "Brands & Makers",
        item: `${BASE_URL}/${locale}/brands`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(brandListJsonLd) }}
      />
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

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  HERO                                                      */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="relative py-32 lg:py-44 overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="/Assets/Santa Clara del Cobre.webp"
              alt="Hand-hammered copper basin by artisans of Santa Clara del Cobre"
              fill
              sizes="100vw"
              priority
              className="object-cover scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-charcoal/80 via-brand-charcoal/50 to-brand-charcoal/30" />
          </div>
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <span className="font-mono text-xs tracking-[0.2em] text-brand-copper uppercase">
              {isEs ? "Distribuidor Autorizado · Hecho a Mano en México" : "Authorized Dealer · Handcrafted in Mexico"}
            </span>
            <h1 className="mt-6 font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-light text-white tracking-wide leading-[0.95]">
              {isEs ? "Marcas de Clase Mundial." : "World-Class Brands."}
              <br />
              <span className="italic">{isEs ? "Artesanía Mexicana." : "Mexican Craft."}</span>
            </h1>
            <p className="mt-6 font-body text-lg text-white/70 max-w-2xl leading-relaxed">
              {isEs
                ? "Representamos a las marcas más prestigiosas del mundo en baño, cocina y herrajes — y colaboramos con artesanos mexicanos que transforman cobre, cerámica y piedra en piezas únicas."
                : "We carry the world's most prestigious bath, kitchen, and hardware brands — and collaborate with Mexican artisans who transform copper, ceramic, and stone into one-of-a-kind pieces."}
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  OUR BRANDS                                                */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="py-20 lg:py-28 bg-brand-linen">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-14">
              <div>
                <span className="font-mono text-xs tracking-[0.2em] text-brand-stone uppercase">
                  {isEs ? "Distribuidor Autorizado" : "Authorized Dealer"}
                </span>
                <h2 className="mt-3 font-display text-4xl md:text-5xl font-light tracking-wide text-brand-charcoal">
                  {isEs ? "Nuestras Marcas" : "Our Brands"}
                </h2>
              </div>
              <p className="font-body text-sm text-brand-stone max-w-md leading-relaxed">
                {isEs
                  ? "Cada marca fue elegida por su calidad, integridad de diseño y valor duradero."
                  : "Every brand chosen for quality, design integrity, and lasting value."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {BRANDS.map((brand) => {
                const info = brandDescriptions[brand.slug];
                return (
                  <Link
                    key={brand.slug}
                    href={`/${locale}/brands/${brand.slug}`}
                    className="group relative bg-white p-7 border border-brand-stone/8 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-brand-copper/20 hover:-translate-y-0.5"
                  >
                    <div className="absolute top-0 left-0 w-0 h-0.5 bg-brand-copper transition-all duration-500 group-hover:w-full" />
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display text-xl font-light text-brand-charcoal group-hover:text-brand-terracotta transition-colors duration-300 tracking-wide">
                          {brand.name}
                        </h3>
                        {info && (
                          <>
                            <p className="mt-1.5 font-mono text-[10px] text-brand-copper tracking-[0.15em] uppercase">
                              {info.origin}
                            </p>
                            <p className="mt-2 font-mono text-xs text-brand-stone/80 tracking-wide">
                              {info.tagline}
                            </p>
                            <p className="mt-3 font-body text-sm text-brand-stone leading-relaxed line-clamp-2">
                              {info.description}
                            </p>
                          </>
                        )}
                      </div>
                      <span className="shrink-0 mt-1 w-8 h-8 rounded-full border border-brand-stone/10 flex items-center justify-center text-brand-stone/30 group-hover:border-brand-copper/40 group-hover:text-brand-copper transition-all duration-300">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M7 17L17 7M17 7H7M17 7V17" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  NARRATIVE BRIDGE                                          */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="relative py-20 lg:py-24 bg-brand-charcoal overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]">
            <div className="absolute inset-0" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
          </div>
          <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-12 h-0.5 bg-brand-copper mx-auto mb-8" />
            <p className="font-display text-2xl md:text-3xl lg:text-4xl font-light text-white tracking-wide leading-snug">
              {isEs
                ? "Las mejores marcas del mundo nos dan la base. Nuestros artesanos mexicanos le dan "
                : "The world's finest brands give us the foundation. Our Mexican artisans give it "}
              <span className="italic text-brand-copper">
                {isEs ? "alma." : "soul."}
              </span>
            </p>
            <div className="w-12 h-0.5 bg-brand-copper mx-auto mt-8" />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  THE MAKERS                                                */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="py-20 lg:py-28 bg-brand-sand/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-14">
              <span className="font-mono text-xs tracking-[0.2em] text-brand-stone uppercase">
                {isEs ? "Los Creadores" : "The Makers"}
              </span>
              <h2 className="mt-3 font-display text-4xl md:text-5xl font-light tracking-wide text-brand-charcoal">
                {isEs ? "Nuestros Artesanos" : "Our Artisans"}
              </h2>
              <p className="mt-4 font-body text-base text-brand-stone leading-relaxed">
                {isEs
                  ? "Cobre martillado en Michoacán. Cerámica moldeada en Guanajuato. Piedra tallada en Querétaro. Cada pieza lleva la huella de su creador — diseñada por Roger Williams y elaborada por artesanos con los que ha colaborado durante casi dos décadas."
                  : "Copper hammered in Michoacán. Ceramic shaped in Guanajuato. Stone carved in Querétaro. Every piece carries the fingerprint of its maker — designed by Roger Williams and crafted by artisans he\u2019s collaborated with for nearly two decades."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {artisans.map((artisan) => (
                <div
                  key={artisan.name}
                  className="group relative bg-white overflow-hidden"
                >
                  {/* Image */}
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <Image
                      src={artisan.image}
                      alt={artisan.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal/70 via-brand-charcoal/20 to-transparent" />

                    {/* Overlay content at bottom of image */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <span className="inline-block bg-brand-copper text-white px-3 py-1 text-[10px] font-mono tracking-[0.15em] uppercase mb-3">
                        {artisan.location}
                      </span>
                      <h3 className="font-display text-2xl font-light text-white tracking-wide">
                        {artisan.name}
                      </h3>
                      <p className="mt-1 font-mono text-xs text-white/70 tracking-wide">
                        {artisan.specialty}
                      </p>
                    </div>
                  </div>

                  {/* Text content */}
                  <div className="p-6 lg:p-8">
                    <div className="w-8 h-0.5 bg-brand-copper mb-4" />
                    <p className="font-body text-sm text-brand-stone leading-relaxed">
                      {artisan.story}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  ARTISANAL GALLERY                                         */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <ArtisanalGallery products={products} />

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  COMMISSION CTA                                            */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="relative py-24 lg:py-32 bg-brand-charcoal overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="/Assets/Stone Artisans.webp"
              alt="Hand-carved stone artisanal work"
              fill
              sizes="100vw"
              className="object-cover opacity-20"
            />
          </div>
          <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <span className="font-mono text-xs tracking-[0.2em] text-brand-copper uppercase">
              {isEs ? "A Tu Medida" : "Bespoke"}
            </span>
            <h2 className="mt-4 font-display text-4xl md:text-5xl font-light tracking-wide text-white">
              {isEs ? "Encarga una Pieza Única" : "Commission a Custom Piece"}
            </h2>
            <p className="mt-5 font-body text-base text-white/60 max-w-lg mx-auto leading-relaxed">
              {isEs
                ? "Elige tu material — cobre, piedra o cerámica — especifica dimensiones, comparte tu inspiración y nuestros artesanos crearán una pieza irrepetible."
                : "Choose your material — copper, stone, or ceramic — specify dimensions, share your inspiration, and our artisans will craft a one-of-a-kind piece."}
            </p>
            <Link
              href={`/${locale}/contact?type=commission`}
              className="inline-block mt-8 px-10 py-4 bg-brand-copper text-white font-body text-sm font-medium tracking-wider uppercase hover:bg-brand-copper/90 transition-colors duration-300"
            >
              {isEs ? "Comenzar Tu Encargo" : "Start Your Commission"}
            </Link>
          </div>
        </section>

      </main>
      <Footer locale={locale} />
    </>
  );
};

export default BrandsPage;
