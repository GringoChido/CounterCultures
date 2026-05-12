"use client";

/**
 * Tiny finish-color chip rendered next to a line item.
 *
 * Customers come in for *finish* — unlacquered brass vs polished nickel
 * vs matte black. The cart should look like a finish library, not a list
 * of SKUs. We map the most common finish-name fragments to a hex chip;
 * unknown finishes fall back to a stone gray dot.
 *
 * Add new mappings here as new finishes show up in the catalog. Lowercase
 * the finish string before matching so we catch en/es variants.
 */

const FINISH_MAP: Array<{ match: RegExp; color: string; label?: string }> = [
  // Brass family
  { match: /unlacquered\s*brass|brass\s*natural|laton\s*natural/i, color: "#A37A4A" },
  { match: /polished\s*brass|brillante|bruñido/i, color: "#C09551" },
  { match: /antique\s*brass|antiguo|envejecido/i, color: "#7A5A2E" },
  { match: /satin\s*brass|brushed\s*brass|cepillado/i, color: "#A88B5A" },
  { match: /brass|laton/i, color: "#B5894C" },

  // Nickel / chrome
  { match: /polished\s*nickel|niquel\s*pulido/i, color: "#C8C8C8" },
  { match: /brushed\s*nickel|satin\s*nickel|niquel\s*satinado/i, color: "#A8A8A8" },
  { match: /chrome|cromo/i, color: "#D4D4D6" },
  { match: /nickel/i, color: "#B0B0B0" },

  // Bronze / copper
  { match: /oil[-\s]?rubbed\s*bronze|orb|bronce\s*aceitado/i, color: "#3E2B22" },
  { match: /antique\s*copper|cobre\s*antiguo/i, color: "#7A4A30" },
  { match: /copper|cobre/i, color: "#B87333" },
  { match: /bronze|bronce/i, color: "#5C4032" },

  // Black / matte
  { match: /matte\s*black|negro\s*mate/i, color: "#1F1F1F" },
  { match: /black|negro/i, color: "#0F0F0F" },

  // Stainless / steel
  { match: /stainless|acero\s*inox/i, color: "#9FA1A3" },
  { match: /gunmetal|grafito/i, color: "#4F555A" },

  // White / cream
  { match: /white|blanco/i, color: "#F2EDE5" },
  { match: /bone|cream|crema/i, color: "#E6DCC9" },

  // Stone / earth
  { match: /sand|arena|beige/i, color: "#D4C5A9" },
  { match: /clay|terracotta|barro/i, color: "#C4725A" },
];

const resolveColor = (finish?: string): string => {
  if (!finish) return "#C7BFB2";
  for (const entry of FINISH_MAP) {
    if (entry.match.test(finish)) return entry.color;
  }
  return "#C7BFB2";
};

interface FinishSwatchProps {
  finish?: string;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

export const FinishSwatch = ({
  finish,
  size = "sm",
  showLabel = false,
  className = "",
}: FinishSwatchProps) => {
  if (!finish) return null;
  const color = resolveColor(finish);
  const dim = size === "md" ? "w-3.5 h-3.5" : "w-2.5 h-2.5";

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        aria-hidden="true"
        className={`${dim} rounded-full ring-1 ring-inset ring-brand-charcoal/15 shrink-0`}
        style={{ backgroundColor: color }}
      />
      {showLabel && (
        <span className="font-body text-xs text-dash-text-secondary truncate">
          {finish}
        </span>
      )}
    </span>
  );
};
