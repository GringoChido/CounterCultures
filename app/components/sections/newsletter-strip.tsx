"use client";

import { AnimatedSection } from "@/app/components/ui/animated-section";

const NewsletterStrip = () => (
  <section className="bg-brand-terracotta py-12">
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <AnimatedSection>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="font-display text-xl md:text-2xl text-white">
              Design Inspiration, Delivered
            </h2>
            <p className="font-body text-sm text-white/80 mt-1">
              Trends, new arrivals, and artisan spotlights. Monthly, never spammy.
            </p>
          </div>
          <form className="flex w-full md:w-auto gap-3">
            <input
              type="email"
              placeholder="Your email"
              className="w-full md:w-72 px-4 py-3 bg-white/10 border border-white/30 rounded-md text-white placeholder:text-white/50 font-body text-sm focus:outline-none focus:border-white transition-colors"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-white text-brand-terracotta font-body text-sm font-semibold rounded-md hover:bg-white/90 transition-colors shrink-0 cursor-pointer"
            >
              Subscribe
            </button>
          </form>
        </div>
      </AnimatedSection>
    </div>
  </section>
);

export { NewsletterStrip };
