"use client";

import { useState, type FormEvent } from "react";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { CategoryHero } from "@/app/components/sections/category-hero";
import { AnimatedSection } from "@/app/components/ui/animated-section";
import { Button } from "@/app/components/ui/button";
import {
  Check,
  DollarSign,
  Clock,
  FileText,
  HeadphonesIcon,
  Users,
} from "lucide-react";
import { useLocale } from "next-intl";

const benefits = [
  {
    icon: DollarSign,
    title: "Trade Pricing",
    description:
      "Dedicated pricing on all brands — Kohler, TOTO, Brizo, BLANCO, Sun Valley Bronze, and more.",
  },
  {
    icon: FileText,
    title: "Specification Support",
    description:
      "We help you spec the right products for your project — dimensions, finishes, compatibility, lead times.",
  },
  {
    icon: Clock,
    title: "Priority Fulfillment",
    description:
      "Trade orders get priority processing and expedited shipping coordination.",
  },
  {
    icon: HeadphonesIcon,
    title: "Dedicated Account Manager",
    description:
      "A single point of contact who knows your projects, your preferences, and your timeline.",
  },
  {
    icon: Users,
    title: "Client Presentations",
    description:
      "Bring clients to the showroom for guided presentations. We make your specifications tangible.",
  },
];

const steps = [
  {
    number: "01",
    title: "Apply",
    description: "Fill out the trade application below. Takes about 2 minutes.",
  },
  {
    number: "02",
    title: "Review",
    description:
      "Our team reviews your application and verifies your credentials within 48 hours.",
  },
  {
    number: "03",
    title: "Welcome",
    description:
      "Once approved, you'll receive your trade account with dedicated pricing and a personal account manager.",
  },
];

const TradePage = () => {
  const locale = useLocale() as "en" | "es";
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");
    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: data.get("firstName"),
          lastName: data.get("lastName"),
          company: data.get("company"),
          profession: data.get("profession"),
          email: data.get("email"),
          phone: data.get("phone"),
          website: data.get("website"),
          license: data.get("license"),
          message: data.get("message"),
        }),
      });

      if (!res.ok) throw new Error();
      setStatus("sent");
      form.reset();
    } catch {
      setStatus("error");
    }
  };

  return (
  <>
    <Header locale={locale} />
    <main>
      <CategoryHero
        eyebrow="For Design Professionals"
        title="Trade Program"
        description="Dedicated pricing, specification support, and priority fulfillment for architects, designers, and builders."
        imageSrc="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80"
        ctaLabel="Apply Now"
        ctaHref="#apply"
      />

      {/* Benefits */}
      <section className="py-20 md:py-28 bg-brand-linen">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <AnimatedSection>
            <span className="font-mono text-xs tracking-[0.2em] text-brand-copper uppercase">
              Why Join
            </span>
            <h2 className="mt-4 font-display text-4xl md:text-5xl font-light tracking-wide text-brand-charcoal">
              Trade Benefits
            </h2>
          </AnimatedSection>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit) => (
              <AnimatedSection key={benefit.title}>
                <div className="p-6 bg-white rounded-lg border border-brand-stone/10">
                  <benefit.icon className="w-6 h-6 text-brand-terracotta mb-4" />
                  <h3 className="font-display text-xl text-brand-charcoal">
                    {benefit.title}
                  </h3>
                  <p className="mt-2 font-body text-sm text-brand-stone leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-28 bg-brand-charcoal">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <AnimatedSection>
            <span className="font-mono text-xs tracking-[0.2em] text-brand-copper uppercase">
              Getting Started
            </span>
            <h2 className="mt-4 font-display text-4xl md:text-5xl font-light tracking-wide text-white">
              What Happens Next
            </h2>
          </AnimatedSection>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <AnimatedSection key={step.number}>
                <div className="py-8 border-t border-white/10">
                  <span className="font-mono text-3xl text-brand-copper font-medium">
                    {step.number}
                  </span>
                  <h3 className="mt-4 font-display text-2xl text-white font-light">
                    {step.title}
                  </h3>
                  <p className="mt-2 font-body text-sm text-white/60 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Brands We Carry */}
      <section className="py-16 bg-brand-sand/30 border-b border-brand-stone/10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <AnimatedSection>
            <h3 className="font-display text-2xl text-brand-charcoal font-light text-center mb-8">
              Brands Available Through Trade
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
              {[
                "Kohler",
                "TOTO",
                "Brizo",
                "BLANCO",
                "California Faucets",
                "Sun Valley Bronze",
                "Emtek",
                "Badeloft",
                "Villeroy & Boch",
              ].map((brand) => (
                <span
                  key={brand}
                  className="font-body text-sm text-brand-stone tracking-wider"
                >
                  {brand}
                </span>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Application Form */}
      <section id="apply" className="py-20 md:py-28 bg-brand-linen">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <AnimatedSection>
            <span className="font-mono text-xs tracking-[0.2em] text-brand-copper uppercase">
              Trade Application
            </span>
            <h2 className="mt-4 font-display text-4xl md:text-5xl font-light tracking-wide text-brand-charcoal">
              Apply for Access
            </h2>
            <p className="mt-4 font-body text-base text-brand-stone leading-relaxed">
              Open to licensed architects, interior designers, contractors, and
              hospitality developers. Approval typically takes 48 hours.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <form className="mt-10 space-y-5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <input
                  type="text"
                  name="firstName"
                  required
                  placeholder="First name"
                  className="w-full px-4 py-3 bg-white border border-brand-stone/20 rounded-md font-body text-sm text-brand-charcoal placeholder:text-brand-stone/50 focus:outline-none focus:border-brand-terracotta transition-colors"
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last name"
                  className="w-full px-4 py-3 bg-white border border-brand-stone/20 rounded-md font-body text-sm text-brand-charcoal placeholder:text-brand-stone/50 focus:outline-none focus:border-brand-terracotta transition-colors"
                />
              </div>
              <input
                type="text"
                name="company"
                required
                placeholder="Company / Studio name"
                className="w-full px-4 py-3 bg-white border border-brand-stone/20 rounded-md font-body text-sm text-brand-charcoal placeholder:text-brand-stone/50 focus:outline-none focus:border-brand-terracotta transition-colors"
              />
              <select
                name="profession"
                className="w-full px-4 py-3 bg-white border border-brand-stone/20 rounded-md font-body text-sm text-brand-charcoal focus:outline-none focus:border-brand-terracotta transition-colors"
                defaultValue=""
              >
                <option value="" disabled>
                  Profession
                </option>
                <option value="architect">Architect</option>
                <option value="interior-designer">Interior Designer</option>
                <option value="contractor">General Contractor / Builder</option>
                <option value="developer">
                  Developer / Hospitality Group
                </option>
                <option value="other">Other</option>
              </select>
              <input
                type="email"
                name="email"
                required
                placeholder="Email address"
                className="w-full px-4 py-3 bg-white border border-brand-stone/20 rounded-md font-body text-sm text-brand-charcoal placeholder:text-brand-stone/50 focus:outline-none focus:border-brand-terracotta transition-colors"
              />
              <input
                type="tel"
                name="phone"
                placeholder="Phone / WhatsApp"
                className="w-full px-4 py-3 bg-white border border-brand-stone/20 rounded-md font-body text-sm text-brand-charcoal placeholder:text-brand-stone/50 focus:outline-none focus:border-brand-terracotta transition-colors"
              />
              <input
                type="url"
                name="website"
                placeholder="Website or portfolio URL (optional)"
                className="w-full px-4 py-3 bg-white border border-brand-stone/20 rounded-md font-body text-sm text-brand-charcoal placeholder:text-brand-stone/50 focus:outline-none focus:border-brand-terracotta transition-colors"
              />
              <input
                type="text"
                name="license"
                placeholder="License / Tax ID (RFC)"
                className="w-full px-4 py-3 bg-white border border-brand-stone/20 rounded-md font-body text-sm text-brand-charcoal placeholder:text-brand-stone/50 focus:outline-none focus:border-brand-terracotta transition-colors"
              />
              <textarea
                name="message"
                placeholder="Tell us about your typical projects and how you'd use the trade program"
                rows={4}
                className="w-full px-4 py-3 bg-white border border-brand-stone/20 rounded-md font-body text-sm text-brand-charcoal placeholder:text-brand-stone/50 focus:outline-none focus:border-brand-terracotta transition-colors resize-none"
              />

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  className="mt-1 accent-brand-terracotta"
                />
                <label
                  htmlFor="terms"
                  className="font-body text-sm text-brand-stone"
                >
                  I agree to the Counter Cultures Trade Program terms and
                  conditions. Trade pricing is confidential and not for resale.
                </label>
              </div>

              <Button variant="primary" className="w-full" disabled={status === "sending"}>
                {status === "sending" ? "Submitting..." : status === "sent" ? "Application Sent!" : "Submit Application"}
              </Button>

              {status === "sent" && (
                <p className="font-body text-sm text-brand-sage text-center">
                  Thank you! We&apos;ll review your application within 48 hours.
                </p>
              )}
              {status === "error" && (
                <p className="font-body text-sm text-red-600 text-center">
                  Something went wrong. Please try again or contact us directly.
                </p>
              )}
              {status === "idle" && (
                <div className="flex items-center gap-2 justify-center">
                  <Check className="w-4 h-4 text-brand-sage" />
                  <p className="font-body text-sm text-brand-stone">
                    Applications reviewed within 48 hours
                  </p>
                </div>
              )}
            </form>
          </AnimatedSection>
        </div>
      </section>
    </main>
    <Footer locale={locale} />
  </>
  );
};

export default TradePage;
