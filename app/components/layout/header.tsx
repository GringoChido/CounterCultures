"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, MessageCircle } from "lucide-react";
import { NAV_LINKS, SITE_CONFIG } from "@/app/lib/constants";

const Header = ({ locale: localeProp = "en" }: { locale?: string }) => {
  const locale = localeProp as "en" | "es";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const lang = locale as "en" | "es";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-brand-linen/95 backdrop-blur-sm border-b border-brand-stone/10">
      <nav className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex flex-col leading-none">
            <span className="font-display text-2xl font-light tracking-wider text-brand-charcoal">
              Counter Cultures
            </span>
            <span className="font-mono text-[10px] tracking-[0.2em] text-brand-stone uppercase mt-0.5">
              The Connected System
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <div
                key={link.href}
                className="relative"
                onMouseEnter={() =>
                  "children" in link ? setActiveDropdown(link.href) : null
                }
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  href={link.href}
                  className="font-body text-sm font-medium text-brand-charcoal hover:text-brand-terracotta transition-colors duration-300 flex items-center gap-1 py-2"
                >
                  {link.label[lang]}
                  {"children" in link && (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </Link>

                {/* Dropdown */}
                {"children" in link && (
                  <AnimatePresence>
                    {activeDropdown === link.href && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 mt-0 bg-white shadow-lg rounded-sm border border-brand-stone/10 min-w-[200px] py-2"
                      >
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className="block px-5 py-2.5 text-sm text-brand-charcoal hover:text-brand-terracotta hover:bg-brand-linen/50 transition-colors duration-200"
                          >
                            {child.label[lang]}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            ))}
          </div>

          {/* Right side — WhatsApp + CTA + Mobile toggle */}
          <div className="flex items-center gap-3">
            {/* WhatsApp */}
            <a
              href={`https://wa.me/${SITE_CONFIG.showroom.whatsapp.replace(/\s+/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-[#25D366] hover:text-[#20BD5A] transition-colors"
              aria-label="WhatsApp"
            >
              <MessageCircle className="w-5 h-5" />
            </a>

            {/* Language toggle */}
            <Link
              href="/"
              className="font-mono text-[10px] tracking-wider text-brand-stone hover:text-brand-terracotta transition-colors uppercase"
            >
              {lang === "en" ? "ES" : "EN"}
            </Link>

            <Link
              href="/showroom"
              className="hidden md:inline-flex font-body text-sm font-medium px-5 py-2.5 bg-brand-terracotta text-white hover:bg-brand-copper transition-colors duration-300"
            >
              {lang === "en" ? "Visit Showroom" : "Visitar Showroom"}
            </Link>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-brand-charcoal cursor-pointer"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden bg-brand-linen border-t border-brand-stone/10 overflow-hidden"
          >
            <div className="px-6 py-6 space-y-1">
              {NAV_LINKS.map((link) => (
                <div key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block py-3 font-body text-base font-medium text-brand-charcoal hover:text-brand-terracotta transition-colors"
                  >
                    {link.label[lang]}
                  </Link>
                  {"children" in link && (
                    <div className="pl-4 space-y-1">
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setMobileOpen(false)}
                          className="block py-2 text-sm text-brand-stone hover:text-brand-terracotta transition-colors"
                        >
                          {child.label[lang]}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* WhatsApp in mobile */}
              <a
                href={`https://wa.me/${SITE_CONFIG.showroom.whatsapp.replace(/\s+/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 py-3 font-body text-base font-medium text-[#25D366]"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp
              </a>

              <Link
                href="/showroom"
                onClick={() => setMobileOpen(false)}
                className="block mt-4 text-center py-3 bg-brand-terracotta text-white font-body font-medium text-sm hover:bg-brand-copper transition-colors"
              >
                {lang === "en" ? "Visit Showroom" : "Visitar Showroom"}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export { Header };
