"use client";

export const CartWatermark = () => (
  <div
    className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden"
    aria-hidden="true"
  >
    <svg
      viewBox="0 0 400 60"
      className="w-[80vw] max-w-[600px] opacity-[0.06]"
      fill="currentColor"
      color="#1A1A1A"
    >
      <text
        x="200"
        y="45"
        textAnchor="middle"
        fontFamily="'DM Serif Display', Georgia, serif"
        fontSize="48"
        fontWeight="400"
        letterSpacing="4"
      >
        Counter Cultures
      </text>
    </svg>
  </div>
);

export const CartWordmark = () => (
  <div className="flex flex-col leading-none mb-6">
    <span className="font-display text-lg font-light tracking-wider text-brand-charcoal">
      Counter Cultures
    </span>
    <span className="font-body text-[9px] tracking-[0.2em] text-brand-copper uppercase mt-0.5">
      San Miguel de Allende, MX
    </span>
  </div>
);
