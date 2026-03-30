import Link from "next/link";
import { SITE_CONFIG } from "@/app/lib/constants";

const footerNav = {
  collections: [
    { label: "Bathroom Fixtures", href: "/shop/bathroom" },
    { label: "Kitchen Fixtures", href: "/shop/kitchen" },
    { label: "Door Hardware", href: "/shop/hardware" },
    { label: "Artisanal Collection", href: "/artisanal" },
  ],
  company: [
    { label: "Our Story", href: "/our-story" },
    { label: "Projects", href: "/projects" },
    { label: "Blog", href: "/blog" },
    { label: "Trade Program", href: "/trade" },
  ],
  contact: [
    { label: "Showroom", href: "/showroom" },
    { label: "Contact", href: "/contact" },
  ],
};

const Footer = () => (
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
            Collections
          </h4>
          <ul className="space-y-2.5">
            {footerNav.collections.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="font-body text-sm text-brand-stone hover:text-brand-terracotta transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="font-body text-sm font-semibold tracking-wider uppercase mb-4 text-brand-sand">
            Company
          </h4>
          <ul className="space-y-2.5">
            {footerNav.company.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="font-body text-sm text-brand-stone hover:text-brand-terracotta transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-body text-sm font-semibold tracking-wider uppercase mb-4 text-brand-sand">
            Contact
          </h4>
          <ul className="space-y-2.5 font-body text-sm text-brand-stone">
            <li>{SITE_CONFIG.showroom.address}</li>
            <li>{SITE_CONFIG.showroom.hours}</li>
            <li>
              <a href={`tel:${SITE_CONFIG.showroom.phone}`} className="hover:text-brand-terracotta transition-colors">
                {SITE_CONFIG.showroom.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${SITE_CONFIG.showroom.email}`} className="hover:text-brand-terracotta transition-colors">
                {SITE_CONFIG.showroom.email}
              </a>
            </li>
          </ul>
        </div>

        {/* Social */}
        <div>
          <h4 className="font-body text-sm font-semibold tracking-wider uppercase mb-4 text-brand-sand">
            Follow
          </h4>
          <ul className="space-y-2.5">
            <li>
              <a href={SITE_CONFIG.social.instagram} target="_blank" rel="noopener noreferrer" className="font-body text-sm text-brand-stone hover:text-brand-terracotta transition-colors">
                Instagram
              </a>
            </li>
            <li>
              <a href={SITE_CONFIG.social.facebook} target="_blank" rel="noopener noreferrer" className="font-body text-sm text-brand-stone hover:text-brand-terracotta transition-colors">
                Facebook
              </a>
            </li>
            <li>
              <a href={SITE_CONFIG.social.pinterest} target="_blank" rel="noopener noreferrer" className="font-body text-sm text-brand-stone hover:text-brand-terracotta transition-colors">
                Pinterest
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="font-body text-xs text-brand-stone">
          © {new Date().getFullYear()} Counter Cultures. Curated in San Miguel de Allende, Mexico.
        </p>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="font-body text-xs text-brand-stone hover:text-brand-terracotta transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="font-body text-xs text-brand-stone hover:text-brand-terracotta transition-colors">
            Terms
          </Link>
          <span className="font-body text-xs text-brand-stone">EN / ES</span>
        </div>
      </div>

      {/* Built by Untold.works */}
      <div className="mt-4 text-center">
        <p className="font-body text-[11px] text-brand-stone/50">
          Built by{" "}
          <a href="https://untold.works" target="_blank" rel="noopener noreferrer" className="hover:text-brand-stone transition-colors duration-300">
            Untold.works
          </a>
        </p>
      </div>
    </div>
  </footer>
);

export { Footer };
