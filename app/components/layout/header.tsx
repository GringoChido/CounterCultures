"use client";

import { useState, useEffect } from "react";
import NextLink from "next/link";
import { usePathname as useIntlPathname } from "@/app/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  MessageCircle,
  Sparkles,
  Search,
  KeyRound,
} from "lucide-react";
import { NAV_LINKS, SITE_CONFIG, PRODUCT_CATEGORIES } from "@/app/lib/constants";
import { SearchPalette } from "@/app/components/search/search-palette";
import { CartIconButton } from "@/app/components/cart/cart-icon-button";
import { CartDrawer } from "@/app/components/cart/cart-drawer";
import { MyProjectsDropdown } from "@/app/components/nav/my-projects-dropdown";

const Header = ({ locale: localeProp = "en", transparent = false }: { locale?: string; transparent?: boolean }) => {
  const locale = localeProp as "en" | "es";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!transparent) return;
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [transparent]);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const lang = locale as "en" | "es";
  const intlPathname = useIntlPathname();

  // Global cmd-K / ctrl-K binding to open the search palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Build locale-aware hrefs for nav links
  const localizedHref = (path: string) => `/${locale}${path}`;

  const categories = Object.entries(PRODUCT_CATEGORIES);
  const isTransparent = transparent && !scrolled && !mobileOpen && !megaMenuOpen;

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isTransparent
          ? "bg-transparent border-b border-transparent"
          : "bg-brand-linen/95 backdrop-blur-sm border-b border-brand-stone/10"
      }`}>
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <NextLink href={localizedHref("/")} className="flex flex-col leading-none shrink-0">
            <span className={`font-display text-xl md:text-2xl font-light tracking-wider whitespace-nowrap transition-colors duration-300 ${isTransparent ? "text-white" : "text-brand-charcoal"}`}>
              Counter Cultures
            </span>
            <span className={`hidden sm:block font-body text-[10px] md:text-[11px] tracking-[0.2em] uppercase mt-0.5 transition-colors duration-300 ${isTransparent ? "text-white/70" : "text-brand-copper"}`}>
              San Miguel de Allende, MX
            </span>
          </NextLink>

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
                    <NextLink
                      href={localizedHref(link.href)}
                      className={`font-body text-sm font-medium transition-colors duration-300 flex items-center gap-1 py-2 ${isTransparent ? "text-white hover:text-white/70" : "text-brand-charcoal hover:text-brand-terracotta"}`}
                    >
                      {link.label[lang]}
                      <ChevronDown className={`w-3 h-3 transition-transform ${megaMenuOpen ? "rotate-180" : ""}`} />
                    </NextLink>
                  </div>
                );
              }

              return (
                <NextLink
                  key={link.href}
                  href={localizedHref(link.href)}
                  className={`font-body text-sm font-medium transition-colors duration-300 py-2 ${isTransparent ? "text-white hover:text-white/70" : "text-brand-charcoal hover:text-brand-terracotta"}`}
                >
                  {link.label[lang]}
                </NextLink>
              );
            })}
          </div>

          {/* Right side — Search + WhatsApp + CTA + Mobile toggle */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search trigger — visible bar on desktop, icon on mobile */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className={`flex items-center gap-2 h-9 transition-colors cursor-pointer w-9 justify-center md:w-auto md:justify-start md:px-3.5 md:border md:rounded-full ${
                isTransparent
                  ? "text-white hover:text-white/70 md:border-white/25 md:bg-white/10 md:hover:border-white/40"
                  : "text-brand-charcoal hover:text-brand-terracotta md:border-brand-stone/25 md:bg-white/60 md:hover:border-brand-stone/40"
              }`}
              aria-label={lang === "es" ? "Buscar (⌘K)" : "Search (⌘K)"}
            >
              <Search className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline font-body text-sm text-dash-text-secondary/70">
                {lang === "es" ? "Buscar…" : "Search…"}
              </span>
              <kbd className="hidden md:inline font-mono text-[10px] text-dash-text-secondary/50 border border-brand-stone/20 rounded px-1.5 py-0.5 ml-2">
                ⌘K
              </kbd>
            </button>

            <a
              href={`https://wa.me/${SITE_CONFIG.showroom.whatsapp.replace(/\s+/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-11 h-11 text-vendor-whatsapp hover:text-vendor-whatsapp-dark transition-colors"
              aria-label="WhatsApp"
            >
              <MessageCircle className="w-5 h-5" />
            </a>

            <MyProjectsDropdown locale={lang} />

            <NextLink
              href="/account/sign-in"
              className={`hidden sm:flex items-center gap-1.5 h-9 px-3 border rounded-full text-xs font-body font-medium tracking-wider uppercase transition-colors ${
                isTransparent
                  ? "border-white/25 text-white bg-white/10 hover:border-white/40"
                  : "border-brand-copper/30 text-brand-copper bg-brand-copper/5 hover:bg-brand-copper/10 hover:border-brand-copper/50"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              {lang === "es" ? "Trade" : "Trade"}
            </NextLink>

            <CartIconButton />

            {/* Language toggle — full page reload to bypass CDN/router cache */}
            <div className="flex items-center font-body text-xs tracking-wider">
              <a
                href={`/en${intlPathname}`}
                className={`flex items-center justify-center h-11 px-1.5 sm:px-2 transition-colors ${
                  lang === "en"
                    ? "text-brand-terracotta font-bold pointer-events-none"
                    : "text-dash-text-secondary hover:text-brand-charcoal"
                }`}
                aria-current={lang === "en" ? "true" : undefined}
              >
                <span className="sm:hidden">EN</span>
                <span className="hidden sm:inline">English</span>
              </a>
              <span className="text-dash-text-secondary/40">|</span>
              <a
                href={`/es${intlPathname}`}
                className={`flex items-center justify-center h-11 px-1.5 sm:px-2 transition-colors ${
                  lang === "es"
                    ? "text-brand-terracotta font-bold pointer-events-none"
                    : "text-dash-text-secondary hover:text-brand-charcoal"
                }`}
                aria-current={lang === "es" ? "true" : undefined}
              >
                <span className="sm:hidden">ES</span>
                <span className="hidden sm:inline">Español</span>
              </a>
            </div>

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
            className="hidden lg:block absolute left-0 right-0 top-full bg-dash-surface shadow-lg border border-brand-stone/10"
            onMouseEnter={() => setMegaMenuOpen(true)}
            onMouseLeave={() => setMegaMenuOpen(false)}
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid grid-cols-3 gap-10">
                {categories.map(([key, cat]) => (
                  <div key={key}>
                    <NextLink
                      href={localizedHref(`/shop/${key}`)}
                      className="font-display text-lg font-light tracking-wide text-brand-charcoal hover:text-brand-terracotta transition-colors"
                    >
                      {cat.label[lang]}
                    </NextLink>
                    <div className="mt-1 mb-4 w-8 h-px bg-brand-terracotta" />
                    <ul className="space-y-2">
                      {cat.subcategories.map((sub) => (
                        <li key={sub.slug}>
                          <NextLink
                            href={localizedHref(`/shop/${key}/${sub.slug}`)}
                            className="font-body text-sm text-dash-text-secondary hover:text-brand-terracotta transition-colors duration-200"
                          >
                            {sub.label[lang]}
                          </NextLink>
                        </li>
                      ))}
                    </ul>
                    <NextLink
                      href={localizedHref(`/shop/${key}`)}
                      className="inline-flex items-center gap-1 mt-4 font-body text-xs font-medium text-brand-terracotta hover:text-brand-copper transition-colors"
                    >
                      {lang === "en" ? "View All" : "Ver Todo"}
                      <ChevronRight className="w-3 h-3" />
                    </NextLink>
                  </div>
                ))}
              </div>

              {/* Featured bar */}
              <div className="mt-8 pt-6 border-t border-brand-stone/10">
                <NextLink
                  href={localizedHref("/brands")}
                  className="flex items-center gap-3 group"
                >
                  <Sparkles className="w-4 h-4 text-brand-copper" />
                  <span className="font-body text-sm font-medium text-brand-charcoal group-hover:text-brand-terracotta transition-colors">
                    {lang === "en" ? "Artisanal Collection" : "Colección Artesanal"}
                  </span>
                  <span className="font-body text-xs text-dash-text-secondary">
                    {lang === "en"
                      ? "Browse handcrafted pieces by Mexico's master artisans"
                      : "Explora piezas hechas a mano por los maestros artesanos de México"}
                  </span>
                  <ChevronRight className="w-3 h-3 text-dash-text-secondary ml-auto group-hover:text-brand-terracotta transition-colors" />
                </NextLink>
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
                      <NextLink
                        href={localizedHref(link.href)}
                        onClick={() => setMobileOpen(false)}
                        className="block py-3.5 font-body text-base font-medium text-brand-charcoal hover:text-brand-terracotta transition-colors border-b border-brand-stone/5"
                      >
                        {link.label[lang]}
                      </NextLink>
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
                                className={`w-4 h-4 text-dash-text-secondary transition-transform shrink-0 ${
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
                                      <NextLink
                                        key={sub.slug}
                                        href={localizedHref(`/shop/${key}/${sub.slug}`)}
                                        onClick={() => setMobileOpen(false)}
                                        className="flex items-center py-2.5 min-h-[44px] text-sm text-dash-text-secondary hover:text-brand-terracotta transition-colors"
                                      >
                                        {sub.label[lang]}
                                      </NextLink>
                                    ))}
                                    <NextLink
                                      href={localizedHref(`/shop/${key}`)}
                                      onClick={() => setMobileOpen(false)}
                                      className="flex items-center py-2.5 min-h-[44px] text-sm font-medium text-brand-terracotta"
                                    >
                                      {lang === "en" ? `View All ${cat.label[lang]}` : `Ver Todo ${cat.label[lang]}`}
                                    </NextLink>
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
                  <NextLink
                    key={link.href}
                    href={localizedHref(link.href)}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center py-3.5 min-h-[44px] font-body text-base font-medium text-brand-charcoal hover:text-brand-terracotta transition-colors border-b border-brand-stone/5"
                  >
                    {link.label[lang]}
                  </NextLink>
                );
              })}

              {/* Trade Login in mobile */}
              <NextLink
                href="/account/sign-in"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 py-3.5 min-h-[44px] font-body text-base font-medium text-brand-copper border-b border-brand-stone/5"
              >
                <KeyRound className="w-5 h-5" />
                {lang === "es" ? "Trade Login" : "Trade Login"}
              </NextLink>

              {/* WhatsApp in mobile */}
              <a
                href={`https://wa.me/${SITE_CONFIG.showroom.whatsapp.replace(/\s+/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 py-3.5 min-h-[44px] font-body text-base font-medium text-vendor-whatsapp border-b border-brand-stone/5"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp
              </a>

              {/* Language toggle — mobile */}
              <div className="flex items-center justify-center gap-4 py-3.5 border-b border-brand-stone/5">
                <a
                  href={`/en${intlPathname}`}
                  onClick={() => setMobileOpen(false)}
                  className={`font-body text-base font-medium transition-colors ${
                    lang === "en"
                      ? "text-brand-terracotta pointer-events-none"
                      : "text-dash-text-secondary hover:text-brand-charcoal"
                  }`}
                >
                  English
                </a>
                <span className="text-dash-text-secondary/40">|</span>
                <a
                  href={`/es${intlPathname}`}
                  onClick={() => setMobileOpen(false)}
                  className={`font-body text-base font-medium transition-colors ${
                    lang === "es"
                      ? "text-brand-terracotta pointer-events-none"
                      : "text-dash-text-secondary hover:text-brand-charcoal"
                  }`}
                >
                  Español
                </a>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </header>

      <SearchPalette
        locale={lang}
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      <CartDrawer locale={lang} />
    </>
  );
};

export { Header };
