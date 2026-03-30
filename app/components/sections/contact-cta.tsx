"use client";

import { AnimatedSection } from "@/app/components/ui/animated-section";
import { Button } from "@/app/components/ui/button";
import { MapPin, Clock, Phone, MessageCircle } from "lucide-react";
import { SITE_CONFIG } from "@/app/lib/constants";

const ContactCTA = () => (
  <section className="py-24 md:py-32 bg-brand-linen">
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Showroom info — left */}
        <AnimatedSection>
          <h2 className="font-display text-4xl md:text-5xl font-normal tracking-wide text-brand-charcoal">
            Visit the Showroom
          </h2>
          <div className="mt-8 space-y-5">
            <div className="flex items-start gap-4">
              <MapPin className="w-5 h-5 text-brand-terracotta mt-0.5 shrink-0" />
              <div>
                <p className="font-body text-base text-brand-charcoal font-medium">
                  {SITE_CONFIG.showroom.address}
                </p>
                <a href="#" className="font-body text-sm text-brand-terracotta hover:text-brand-copper transition-colors mt-1 inline-block">
                  Get Directions →
                </a>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Clock className="w-5 h-5 text-brand-terracotta mt-0.5 shrink-0" />
              <p className="font-body text-base text-brand-charcoal">
                {SITE_CONFIG.showroom.hours}
              </p>
            </div>
            <div className="flex items-start gap-4">
              <Phone className="w-5 h-5 text-brand-terracotta mt-0.5 shrink-0" />
              <a
                href={`tel:${SITE_CONFIG.showroom.phone}`}
                className="font-body text-base text-brand-charcoal hover:text-brand-terracotta transition-colors"
              >
                {SITE_CONFIG.showroom.phone}
              </a>
            </div>
          </div>
          <div className="mt-8">
            <Button variant="whatsapp" href={`https://wa.me/${SITE_CONFIG.showroom.whatsapp.replace(/\s+/g, "")}`}>
              <MessageCircle className="w-4 h-4 mr-2" />
              Message on WhatsApp
            </Button>
          </div>
        </AnimatedSection>

        {/* Quick contact form — right */}
        <AnimatedSection delay={0.2}>
          <h3 className="font-display text-3xl font-normal tracking-wide text-brand-charcoal mb-6">
            Start Your Project
          </h3>
          <form className="space-y-4">
            <input
              type="text"
              placeholder="Your name"
              className="w-full px-4 py-3 bg-white border border-brand-stone/20 rounded-md font-body text-sm text-brand-charcoal placeholder:text-brand-stone/50 focus:outline-none focus:border-brand-terracotta transition-colors"
            />
            <input
              type="email"
              placeholder="Email address"
              className="w-full px-4 py-3 bg-white border border-brand-stone/20 rounded-md font-body text-sm text-brand-charcoal placeholder:text-brand-stone/50 focus:outline-none focus:border-brand-terracotta transition-colors"
            />
            <input
              type="tel"
              placeholder="Phone number"
              className="w-full px-4 py-3 bg-white border border-brand-stone/20 rounded-md font-body text-sm text-brand-charcoal placeholder:text-brand-stone/50 focus:outline-none focus:border-brand-terracotta transition-colors"
            />
            <select
              className="w-full px-4 py-3 bg-white border border-brand-stone/20 rounded-md font-body text-sm text-brand-charcoal focus:outline-none focus:border-brand-terracotta transition-colors"
              defaultValue=""
            >
              <option value="" disabled>Project type</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="trade">Trade / Professional</option>
            </select>
            <textarea
              placeholder="Tell us about your project"
              rows={3}
              className="w-full px-4 py-3 bg-white border border-brand-stone/20 rounded-md font-body text-sm text-brand-charcoal placeholder:text-brand-stone/50 focus:outline-none focus:border-brand-terracotta transition-colors resize-none"
            />
            <Button variant="primary" className="w-full">
              Send Message
            </Button>
            <p className="font-body text-sm text-brand-stone text-center">
              We respond within 2 hours during business hours.
            </p>
          </form>
        </AnimatedSection>
      </div>
    </div>
  </section>
);

export { ContactCTA };
