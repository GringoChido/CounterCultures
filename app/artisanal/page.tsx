import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { getProducts } from "@/app/lib/sheets";
import { ArtisanalGallery } from "./artisanal-gallery";

export const metadata: Metadata = {
  title: "Artisanal Collection — Handcrafted in Mexico",
  description:
    "Copper basins, Mistoa ceramic sinks, stone vessels, and hand-forged bronze hardware — designed by Roger Williams and crafted by Mexican artisans.",
};

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

const ArtisanalPage = async () => {
  const products = await getProducts({ artisanal: true });

  return (
    <>
      <Header />
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
      <Footer />
    </>
  );
};

export default ArtisanalPage;
