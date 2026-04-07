"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, ChevronRight, MessageCircle, Sparkles } from "lucide-react";
import { NAV_LINKS, SITE_CONFIG, PRODUCT_CATEGORIES } from "@/app/lib/constants";

const Header = ({ locale: localeProp = "en" }: { locale?: string }) => {
  const locale = localeProp as "en" | "es";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState<string | null>(null);
  const lang = locale as "en" | "es";
  const pathname = usePathname();

  const getLocalePath = (targetLocale: "en" | "es") => {
    const segments = pathname.split("/");
    if (segments[1] === "en" || segments[1] === "es") {
      segments[1] = targetLocale;
    } else {
      segments.splice(1, 0, targetLocale);
    }
    return segments.join("/") || `/${targetLocale}`;
  };

  const categories = Object.entries(PRODUCT_CATEGORIES);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-brand-linen/95 backdrop-blur-sm border-b border-brand-stone/10">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex flex-col leading-none shrink-0">
            <span className="font-display text-xl md:text-2xl font-light tracking-wider text-brand-charcoal whitespace-nowrap">
              Counter Cultures
            </span>
            <span className="hidden sm:block font-body text-[10px] md:text-[11px] tracking-[0.2em] text-brand-copper uppercase mt-0.5">
              San Miguel de Allende, MX
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-6">
            {NAV_LINKS.map((link) => {
              const isShop = "children" in link;

              if (isShop) {
                return (
                  <div
                    key={link.href}
                    className="relative"
                    onMouseEnter={() => setMegaMenuOpen(true)}
                    onMouseLeave={() => setMegaMenuOpen(false)}
                  >
                    <Link
                      href={link.href}
                      className="font-body text-sm font-medium text-brand-charcoal hover:text-brand-terracotta transition-colors duration-300 flex items-center gap-1 py-2"
                    >
                      {link.label[lang]}
                      <ChevronDown className={`w-3 h-3 transition-transform ${megaMenuOpen ? "rotate-180" : ""}`} />
                    </Link>
                  </div>
                );
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-body text-sm font-medium text-brand-charcoal hover:text-brand-terracotta transition-colors duration-300 py-2"
                >
                  {link.label[lang]}
                </Link>
              );
            })}
          </div>

          {/* Right side — WhatsApp + CTA + Mobile toggle */}
          <div className="flex items-center gap-1 sm:gap-2">
            <a
              href={`https://wa.me/${SITE_CONFIG.showroom.whatsapp.replace(/\s+/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-11 h-11 text-[#25D366] hover:text-[#20BD5A] transition-colors"
              aria-label="WhatsApp"
            >
              <MessageCircle className="w-5 h-5" />
            </a>

            {/* Language toggle */}
            <div className="flex items-center font-body text-xs tracking-wider">
              <Link
                href={getLocalePath("en")}
                className={`flex items-center justify-center h-11 px-1.5 sm:px-2 transition-colors ${
                  lang === "en"
                    ? "text-brand-terracotta font-bold"
                    : "text-brand-stone hover:text-brand-charcoal"
                }`}
              >
                <span className="sm:hidden">EN</span>
                <span className="hidden sm:inline">English</span>
              </Link>
              <span className="text-brand-stone/40">|</span>
              <Link
                href={getLocalePath("es")}
                className={`flex items-center justify-center h-11 px-1.5 sm:px-2 transition-colors ${
                  lang === "es"
                    ? "text-brand-terracotta font-bold"
                    : "text-brand-stone hover:text-brand-charcoal"
                }`}
              >
                <span className="sm:hidden">ES</span>
                <span className="hidden sm:inline">Español</span>
              </Link>
            </div>

            <Link
              href="/dashboard"
              className="hidden md:inline-flex font-body text-sm font-medium px-5 py-2.5 bg-brand-copper text-white hover:bg-brand-terracotta transition-colors duration-300"
            >
              Portal
            </Link>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden flex items-center justify-center w-11 h-11 text-brand-charcoal cursor-pointer"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Desktop Mega Menu */}
      <AnimatePresence>
        {megaMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="hidden lg:block absolute left-0 right-0 top-full bg-white shadow-lg border border-brand-stone/10"
            onMouseEnter={() => setMegaMenuOpen(true)}
            onMouseLeave={() => setMegaMenuOpen(false)}
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid grid-cols-3 gap-10">
                {categories.map(([key, cat]) => (
                  <div key={key}>
                    <Link
                      href={`/${locale}/shop/${key}`}
                      className="font-display text-lg font-light tracking-wide text-brand-charcoal hover:text-brand-terracotta transition-colors"
                    >
                      {cat.label[lang]}
                    </Link>
                    <div className="mt-1 mb-4 w-8 h-px bg-brand-terracotta" />
                    <ul className="space-y-2">
                      {cat.subcategories.map((sub) => (
                        <li key={sub.slug}>
                          <Link
                            href={`/${locale}/shop/${key}/${sub.slug}`}
                            className="font-body text-sm text-brand-stone hover:text-brand-terracotta transition-colors duration-200"
                          >
                            {sub.label[lang]}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={`/${locale}/shop/${key}`}
                      className="inline-flex items-center gap-1 mt-4 font-body text-xs font-medium text-brand-terracotta hover:text-brand-copper transition-colors"
                    >
                      {lang === "en" ? "View All" : "Ver Todo"}
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
              </div>

              {/* Featured bar */}
              <div className="mt-8 pt-6 border-t border-brand-stone/10">
                <Link
                  href={`/${locale}/brands`}
                  className="flex items-center gap-3 group"
                >
                  <Sparkles className="w-4 h-4 text-brand-copper" />
                  <span className="font-body text-sm font-medium text-brand-charcoal group-hover:text-brand-terracotta transition-colors">
                    {lang === "en" ? "Artisanal Collection" : "Colección Artesanal"}
                  </span>
                  <span className="font-body text-xs text-brand-stone">
                    {lang === "en"
                      ? "Browse handcrafted pieces by Mexico's master artisans"
                      : "Explora piezas hechas a mano por los maestros artesanos de México"}
                  </span>
                  <ChevronRight className="w-3 h-3 text-brand-stone ml-auto group-hover:text-brand-terracotta transition-colors" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden bg-brand-linen border-t border-brand-stone/10 overflow-hidden shadow-lg"
          >
            <div className="px-4 sm:px-6 py-4 space-y-0 max-h-[calc(100dvh-4rem)] overflow-y-auto">
              {NAV_LINKS.map((link) => {
                const isShop = "children" in link;

                if (isShop) {
                  return (
                    <div key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className="block py-3.5 font-body text-base font-medium text-brand-charcoal hover:text-brand-terracotta transition-colors border-b border-brand-stone/5"
                      >
                        {link.label[lang]}
                      </Link>
                      {/* Mobile category accordion */}
                      <div className="pl-3">
                        {categories.map(([key, cat]) => (
                          <div key={key} className="border-b border-brand-stone/5">
                            <button
                              onClick={() =>
                                setMobileCategoryOpen(
                                  mobileCategoryOpen === key ? null : key
                                )
                              }
                              className="flex items-center justify-between w-full py-3.5 text-left cursor-pointer min-h-[44px]"
                            >
                              <span className="font-body text-sm font-medium text-brand-charcoal">
                                {cat.label[lang]}
                              </span>
                              <ChevronDown
                                className={`w-4 h-4 text-brand-stone transition-transform shrink-0 ${
                                  mobileCategoryOpen === key ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                            <AnimatePresence>
                              {mobileCategoryOpen === key && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="pl-3 pb-2 space-y-0">
                                    {cat.subcategories.map((sub) => (
                                      <Link
                                        key={sub.slug}
                                        href={`/${locale}/shop/${key}/${sub.slug}`}
                                        onClick={() => setMobileOpen(false)}
                                        className="flex items-center py-2.5 min-h-[44px] text-sm text-brand-stone hover:text-brand-terracotta transition-colors"
                                      >
                                        {sub.label[lang]}
                                      </Link>
                                    ))}
                                    <Link
                                      href={`/${locale}/shop/${key}`}
                                      onClick={() => setMobileOpen(false)}
                                      className="flex items-center py-2.5 min-h-[44px] text-sm font-medium text-brand-terracotta"
                                    >
                                      {lang === "en" ? `View All ${cat.label[lang]}` : `Ver Todo ${cat.label[lang]}`}
                                    </Link>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center py-3.5 min-h-[44px] font-body text-base font-medium text-brand-charcoal hover:text-brand-terracotta transition-colors border-b border-brand-stone/5"
                  >
                    {link.label[lang]}
                  </Link>
                );
              })}

              {/* WhatsApp in mobile */}
              <a
                href={`https://wa.me/${SITE_CONFIG.showroom.whatsapp.replace(/\s+/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 py-3.5 min-h-[44px] font-body text-base font-medium text-[#25D366] border-b border-brand-stone/5"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp
              </a>

              <div className="pt-4 pb-2 flex flex-col gap-3">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="block text-center py-3.5 bg-brand-copper text-white font-body font-medium text-sm hover:bg-brand-terracotta transition-colors"
                >
                  Counter Portal
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export { Header };
