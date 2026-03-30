import Link from "next/link";
import { SITE_CONFIG } from "@/app/lib/constants";

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const PinterestIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24 18.635 24 24 18.633 24 12.017 24 5.373 18.635 0 12.017 0z" />
  </svg>
);

const footerNav = {
  collections: [
    { label: { en: "Bathroom Fixtures", es: "Accesorios de Baño" }, href: "/shop/bathroom" },
    { label: { en: "Kitchen Fixtures", es: "Accesorios de Cocina" }, href: "/shop/kitchen" },
    { label: { en: "Door Hardware", es: "Chapas y Herrajes" }, href: "/shop/hardware" },
    { label: { en: "Artisanal Collection", es: "Colección Artesanal" }, href: "/artisanal" },
  ],
  company: [
    { label: { en: "Our Story", es: "Nuestra Historia" }, href: "/our-story" },
    { label: { en: "Projects", es: "Proyectos" }, href: "/projects" },
    { label: { en: "Insights", es: "Insights" }, href: "/insights" },
    { label: { en: "Resources", es: "Recursos" }, href: "/resources" },
    { label: { en: "Trade Program", es: "Programa Trade" }, href: "/trade" },
    { label: { en: "Counter Portal", es: "Counter Portal" }, href: "/dashboard" },
  ],
  contact: [
    { label: { en: "Showroom", es: "Showroom" }, href: "/showroom" },
    { label: { en: "Contact", es: "Contacto" }, href: "/contact" },
  ],
};

const Footer = ({ locale: localeProp = "en" }: { locale?: string }) => {
  const lang = (localeProp as "en" | "es") || "en";
  const t = {
    collections: { en: "Collections", es: "Colecciones" },
    company: { en: "Company", es: "Compañía" },
    contact: { en: "Contact", es: "Contacto" },
    follow: { en: "Follow", es: "Síguenos" },
    curated: {
      en: "Curated in San Miguel de Allende, Mexico.",
      es: "Curado en San Miguel de Allende, México.",
    },
  };

  return (
    <footer className="bg-brand-charcoal text-white py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="block mb-12">
          <span className="font-display text-2xl font-light tracking-wider">
            Counter Cultures
          </span>
          <span className="block font-mono text-[10px] tracking-[0.2em] text-brand-stone uppercase mt-1">
            The Connected System
          </span>
        </Link>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Collections */}
          <div>
            <h4 className="font-body text-sm font-semibold tracking-wider uppercase mb-4 text-brand-sand">
              {t.collections[lang]}
            </h4>
            <ul className="space-y-2.5">
              {footerNav.collections.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-body text-sm text-brand-stone hover:text-brand-terracotta transition-colors"
                  >
                    {link.label[lang]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-body text-sm font-semibold tracking-wider uppercase mb-4 text-brand-sand">
              {t.company[lang]}
            </h4>
            <ul className="space-y-2.5">
              {footerNav.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-body text-sm text-brand-stone hover:text-brand-terracotta transition-colors"
                  >
                    {link.label[lang]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-body text-sm font-semibold tracking-wider uppercase mb-4 text-brand-sand">
              {t.contact[lang]}
            </h4>
            <ul className="space-y-2.5 font-body text-sm text-brand-stone">
              <li>{SITE_CONFIG.showroom.address}</li>
              <li>{SITE_CONFIG.showroom.hours}</li>
              <li>
                <a
                  href={`tel:${SITE_CONFIG.showroom.phone}`}
                  className="hover:text-brand-terracotta transition-colors"
                >
                  {SITE_CONFIG.showroom.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${SITE_CONFIG.showroom.email}`}
                  className="hover:text-brand-terracotta transition-colors"
                >
                  {SITE_CONFIG.showroom.email}
                </a>
              </li>
            </ul>
          </div>

          {/* Social — icons */}
          <div>
            <h4 className="font-body text-sm font-semibold tracking-wider uppercase mb-4 text-brand-sand">
              {t.follow[lang]}
            </h4>
            <div className="flex items-center gap-4">
              <a
                href={SITE_CONFIG.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-stone hover:text-brand-terracotta transition-colors"
                aria-label="Instagram"
              >
                <InstagramIcon className="w-5 h-5" />
              </a>
              <a
                href={SITE_CONFIG.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-stone hover:text-brand-terracotta transition-colors"
                aria-label="Facebook"
              >
                <FacebookIcon className="w-5 h-5" />
              </a>
              <a
                href={SITE_CONFIG.social.pinterest}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-stone hover:text-brand-terracotta transition-colors"
                aria-label="Pinterest"
              >
                <PinterestIcon className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-body text-xs text-brand-stone">
            &copy; {new Date().getFullYear()} Counter Cultures.{" "}
            {t.curated[lang]}
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="font-body text-xs text-brand-stone hover:text-brand-terracotta transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="font-body text-xs text-brand-stone hover:text-brand-terracotta transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>

        {/* Built by Untold.works */}
        <div className="mt-4 text-center">
          <p className="font-body text-[11px] text-brand-stone/50">
            Built by{" "}
            <a
              href="https://untold.works"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-stone transition-colors duration-300"
            >
              Untold.works
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export { Footer };
