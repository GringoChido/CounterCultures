"use client";

import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { AnimatedSection } from "@/app/components/ui/animated-section";
import { Button } from "@/app/components/ui/button";
import { MapPin, Clock, Phone, Mail, MessageCircle } from "lucide-react";
import { SITE_CONFIG } from "@/app/lib/constants";

const ContactPage = () => (
  <>
    <Header />
    <main>
      {/* Hero */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-20 bg-brand-charcoal">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <AnimatedSection>
            <span className="font-mono text-xs tracking-[0.2em] text-brand-copper uppercase">
              Get in Touch
            </span>
            <h1 className="mt-4 font-display text-5xl md:text-7xl font-light text-white tracking-wide">
              Contact Us
            </h1>
            <p className="mt-6 font-body text-base text-white/60 max-w-xl leading-relaxed">
              Whether you&apos;re planning a renovation, specifying fixtures for
              a project, or just browsing — we&apos;d love to hear from you.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Form + Info */}
      <section className="py-20 md:py-28 bg-brand-linen">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-20">
            {/* Form — left, wider */}
            <div className="lg:col-span-3">
              <AnimatedSection>
                <h2 className="font-display text-3xl font-light tracking-wide text-brand-charcoal mb-8">
                  Send Us a Message
                </h2>
                <form className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <input
                      type="text"
                      placeholder="First name"
                      className="w-full px-4 py-3 bg-white border border-brand-stone/20 rounded-md font-body text-sm text-brand-charcoal placeholder:text-brand-stone/50 focus:outline-none focus:border-brand-terracotta transition-colors"
                    />
                    <input
                      type="text"
                      placeholder="Last name"
                      className="w-full px-4 py-3 bg-white border border-brand-stone/20 rounded-md font-body text-sm text-brand-charcoal placeholder:text-brand-stone/50 focus:outline-none focus:border-brand-terracotta transition-colors"
                    />
                  </div>
                  <input
                    type="email"
                    placeholder="Email address"
                    className="w-full px-4 py-3 bg-white border border-brand-stone/20 rounded-md font-body text-sm text-brand-charcoal placeholder:text-brand-stone/50 focus:outline-none focus:border-brand-terracotta transition-colors"
                  />
                  <input
                    type="tel"
                    placeholder="Phone / WhatsApp"
                    className="w-full px-4 py-3 bg-white border border-brand-stone/20 rounded-md font-body text-sm text-brand-charcoal placeholder:text-brand-stone/50 focus:outline-none focus:border-brand-terracotta transition-colors"
                  />
                  <select
                    className="w-full px-4 py-3 bg-white border border-brand-stone/20 rounded-md font-body text-sm text-brand-charcoal focus:outline-none focus:border-brand-terracotta transition-colors"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      What can we help with?
                    </option>
                    <option value="residential">Residential Project</option>
                    <option value="commercial">Commercial / Hospitality</option>
                    <option value="trade">Trade Program Inquiry</option>
                    <option value="artisanal">Custom / Artisanal Piece</option>
                    <option value="quote">Product Quote</option>
                    <option value="other">General Question</option>
                  </select>
                  <textarea
                    placeholder="Tell us about your project or question"
                    rows={5}
                    className="w-full px-4 py-3 bg-white border border-brand-stone/20 rounded-md font-body text-sm text-brand-charcoal placeholder:text-brand-stone/50 focus:outline-none focus:border-brand-terracotta transition-colors resize-none"
                  />
                  <Button variant="primary" className="w-full sm:w-auto">
                    Send Message
                  </Button>
                  <p className="font-body text-sm text-brand-stone">
                    We respond within 2 hours during business hours.
                  </p>
                </form>
              </AnimatedSection>
            </div>

            {/* Info — right */}
            <div className="lg:col-span-2">
              <AnimatedSection delay={0.2}>
                <h3 className="font-display text-2xl font-light tracking-wide text-brand-charcoal mb-6">
                  Showroom
                </h3>
                <div className="space-y-5">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-brand-terracotta mt-0.5 shrink-0" />
                    <div>
                      <p className="font-body text-base text-brand-charcoal font-medium">
                        {SITE_CONFIG.showroom.address}
                      </p>
                      <a
                        href="#"
                        className="font-body text-sm text-brand-terracotta hover:text-brand-copper transition-colors mt-1 inline-block"
                      >
                        Get Directions →
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-brand-terracotta mt-0.5 shrink-0" />
                    <p className="font-body text-base text-brand-charcoal">
                      {SITE_CONFIG.showroom.hours}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-brand-terracotta mt-0.5 shrink-0" />
                    <a
                      href={`tel:${SITE_CONFIG.showroom.phone}`}
                      className="font-body text-base text-brand-charcoal hover:text-brand-terracotta transition-colors"
                    >
                      {SITE_CONFIG.showroom.phone}
                    </a>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-brand-terracotta mt-0.5 shrink-0" />
                    <a
                      href={`mailto:${SITE_CONFIG.showroom.email}`}
                      className="font-body text-base text-brand-charcoal hover:text-brand-terracotta transition-colors"
                    >
                      {SITE_CONFIG.showroom.email}
                    </a>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-brand-stone/15">
                  <h4 className="font-body text-sm font-semibold text-brand-charcoal mb-3">
                    Prefer messaging?
                  </h4>
                  <Button
                    variant="whatsapp"
                    size="md"
                    href={`https://wa.me/${SITE_CONFIG.showroom.whatsapp.replace(/\s+/g, "")}`}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message on WhatsApp
                  </Button>
                </div>

                <div className="mt-8 pt-8 border-t border-brand-stone/15">
                  <h4 className="font-body text-sm font-semibold text-brand-charcoal mb-3">
                    For design professionals
                  </h4>
                  <p className="font-body text-sm text-brand-stone leading-relaxed">
                    Architects, designers, and builders — ask about our Trade
                    Program for dedicated pricing and specification support.
                  </p>
                  <Button variant="ghost" size="sm" href="/trade" className="mt-3">
                    Learn About Trade →
                  </Button>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>
    </main>
    <Footer />
  </>
);

export default ContactPage;
