"use client";

import { useState, useEffect } from "react";
import NextLink from "next/link";
import { Link, usePathname } from "@/app/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
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

const LanguageToggle = ({
  variant,
  onSwitch,
}: {
  variant: "desktop" | "mobile";
  onSwitch?: () => void;
}) => {
  const pathname = usePathname();
  const lang = useLocale() as "en" | "es";

  const buildHref = (next: "en" | "es") => {
    const qs = typeof window !== "undefined" ? window.location.search : "";
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    return `${pathname}${qs}${hash}`;
  };

  if (variant === "mobile") {
    return (
      <div className="flex items-center justify-center gap-4 py-3.5 border-b border-brand-stone/5">
        {lang === "en" ? (
          <span className="font-body text-base font-medium text-brand-terracotta">
            English
          </span>
        ) : (
          <Link
            href={buildHref("en")}
            locale="en"
            onClick={() => onSwitch?.()}
            className="font-body text-base font-medium text-dash-text-secondary hover:text-brand-charcoal transition-colors"
          >
            English
          </Link>
        )}
        <span className="text-dash-text-secondary/40">|</span>
        {lang === "es" ? (
          <span className="font-body text-base font-medium text-brand-terracotta">
            Español
          </span>
        ) : (
          <Link
            href={buildHref("es")}
            locale="es"
            onClick={() => onSwitch?.()}
            className="font-body text-base font-medium text-dash-text-secondary hover:text-brand-charcoal transition-colors"
          >
            Español
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center font-body text-xs tracking-wider">
      {lang === "en" ? (
        <span
          className="flex items-center justify-center h-11 px-1.5 sm:px-2 text-brand-terracotta font-bold"
          aria-current="true"
        >
          <span className="sm:hidden">EN</span>
          <span className="hidden sm:inline">English</span>
        </span>
      ) : (
        <Link
          href={buildHref("en")}
          locale="en"
          className="flex items-center justify-center h-11 px-1.5 sm:px-2 transition-colors text-dash-text-secondary hover:text-brand-charcoal"
        >
          <span className="sm:hidden">EN</span>
          <span className="hidden sm:inline">English</span>
        </Link>
      )}
      <span className="text-dash-text-secondary/40">|</span>
      {lang === "es" ? (
        <span
          className="flex items-center justify-center h-11 px-1.5 sm:px-2 text-brand-terracotta font-bold"
          aria-current="true"
        >
          <span className="sm:hidden">ES</span>
          <span className="hidden sm:inline">Español</span>
        </span>
      ) : (
        <Link
          href={buildHref("es")}
          locale="es"
          className="flex items-center justify-center h-11 px-1.5 sm:px-2 transition-colors text-dash-text-secondary hover:text-brand-charcoal"
        >
          <span className="sm:hidden">ES</span>
          <span className="hidden sm:inline">Español</span>
        </Link>
      )}
    </div>
  );
};

const Header = ({ transparent = false }: { transparent?: boolean }) => {
  const lang = useLocale() as "en" | "es";
  const t = useTranslations("nav");
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
          <Link href="/" className="flex flex-col leading-none shrink-0">
            <span className={`font-display text-xl md:text-2xl font-light tracking-wider whitespace-nowrap transition-colors duration-300 ${isTransparent ? "text-white" : "text-brand-charcoal"}`}>
              Counter Cultures
            </span>
            <span className={`hidden sm:block font-body text-[10px] md:text-[11px] tracking-[0.2em] uppercase mt-0.5 transition-colors duration-300 ${isTransparent ? "text-white/70" : "text-brand-copper"}`}>
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
                      className={`font-body text-sm font-medium transition-colors duration-300 flex items-center gap-1 py-2 ${isTransparent ? "text-white hover:text-white/70" : "text-brand-charcoal hover:text-brand-terracotta"}`}
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
                  className={`font-body text-sm font-medium transition-colors duration-300 py-2 ${isTransparent ? "text-white hover:text-white/70" : "text-brand-charcoal hover:text-brand-terracotta"}`}
                >
                  {link.label[lang]}
                </Link>
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
              aria-label={t("searchAriaLabel")}
            >
              <Search className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline font-body text-sm text-dash-text-secondary/70">
                {t("search")}
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
              Trade
            </NextLink>

            <CartIconButton />

            <LanguageToggle variant="desktop" />

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
                    <Link
                      href={`/shop/${key}`}
                      className="font-display text-lg font-light tracking-wide text-brand-charcoal hover:text-brand-terracotta transition-colors"
                    >
                      {cat.label[lang]}
                    </Link>
                    <div className="mt-1 mb-4 w-8 h-px bg-brand-terracotta" />
                    <ul className="space-y-2">
                      {cat.subcategories.map((sub) => (
                        <li key={sub.slug}>
                          <Link
                            href={`/shop/${key}/${sub.slug}`}
                            className="font-body text-sm text-dash-text-secondary hover:text-brand-terracotta transition-colors duration-200"
                          >
                            {sub.label[lang]}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={`/shop/${key}`}
                      className="inline-flex items-center gap-1 mt-4 font-body text-xs font-medium text-brand-terracotta hover:text-brand-copper transition-colors"
                    >
                      {t("viewAllCategory", { category: cat.label[lang] })}
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
              </div>

              {/* Featured bar */}
              <div className="mt-8 pt-6 border-t border-brand-stone/10">
                <Link
                  href="/brands"
                  className="flex items-center gap-3 group"
                >
                  <Sparkles className="w-4 h-4 text-brand-copper" />
                  <span className="font-body text-sm font-medium text-brand-charcoal group-hover:text-brand-terracotta transition-colors">
                    {t("artisanalCollection")}
                  </span>
                  <span className="font-body text-xs text-dash-text-secondary">
                    {t("artisanalCollectionDesc")}
                  </span>
                  <ChevronRight className="w-3 h-3 text-dash-text-secondary ml-auto group-hover:text-brand-terracotta transition-colors" />
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
                                      <Link
                                        key={sub.slug}
                                        href={`/shop/${key}/${sub.slug}`}
                                        onClick={() => setMobileOpen(false)}
                                        className="flex items-center py-2.5 min-h-[44px] text-sm text-dash-text-secondary hover:text-brand-terracotta transition-colors"
                                      >
                                        {sub.label[lang]}
                                      </Link>
                                    ))}
                                    <Link
                                      href={`/shop/${key}`}
                                      onClick={() => setMobileOpen(false)}
                                      className="flex items-center py-2.5 min-h-[44px] text-sm font-medium text-brand-terracotta"
                                    >
                                      {t("viewAllCategory", { category: cat.label[lang] })}
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

              {/* Trade Login in mobile */}
              <NextLink
                href="/account/sign-in"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 py-3.5 min-h-[44px] font-body text-base font-medium text-brand-copper border-b border-brand-stone/5"
              >
                <KeyRound className="w-5 h-5" />
                Trade Login
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

              <LanguageToggle variant="mobile" onSwitch={() => setMobileOpen(false)} />

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
