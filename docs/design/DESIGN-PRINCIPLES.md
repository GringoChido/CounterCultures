# Counter Cultures — Design Principles

> The shared visual contract for every customer-facing surface.
> Written during Phase 1 (homepage hub). Follow-on sessions (catalog, PDP, brand pages) apply these same rules.

## Core idea

Premium, warm, layered. The site should feel like walking into the showroom — polished surfaces, natural materials, intentional lighting. Every visual choice supports the luxury-meets-artisan positioning.

## Type scale

Use the existing `--font-display` (Cormorant Garamond) and `--font-body` (DM Sans) families. Never mix in other typefaces.

| Token              | Size     | Usage                                              |
|---------------------|----------|-----------------------------------------------------|
| `--text-display-xl` | 2.5rem   | Hero headline, hero-scale numbers                   |
| `--text-display-lg` | 1.875rem | Section headlines                                    |
| `--text-body-lg`    | 1rem     | Body copy, subheads                                 |
| `--text-body`       | 0.875rem | Cards, descriptions, form labels                    |
| `--text-label`      | 0.75rem  | Eyebrows, metadata, tag text                        |
| `--text-micro`      | 0.6875rem| Footnotes, fine print                               |

**Rules:**
- Eyebrows: `font-body`, `font-semibold`, `text-[11px]`, `tracking-[0.25em]`, `uppercase`, colored `text-brand-copper` or `text-brand-terracotta`.
- Section headlines: `font-display`, `font-light`, `tracking-wide`. Never bold display type.
- Body copy: `font-body`, `text-dash-text-secondary`, `leading-relaxed`.

## Spacing rhythm

Vertical section padding uses a consistent scale. Never invent ad-hoc padding values.

| Token         | Value | Usage                                         |
|---------------|-------|------------------------------------------------|
| `--space-section-sm` | 56px (3.5rem)  | Compact bands (newsletter strip, thin CTAs) |
| `--space-section`    | 96px (6rem)    | Standard section padding (mobile: 56px)     |
| `--space-section-lg` | 128px (8rem)   | Hero-adjacent or emphasis sections (mobile: 80px) |

**Rules:**
- Desktop sections: `py-[var(--space-section)]` or the Tailwind equivalent `py-24`.
- Mobile sections: scale down one step (e.g., `py-14` on mobile for standard sections).
- Internal spacing within sections: use the existing `--space-*` scale (4/8/12/16/24/32px).
- Between eyebrow and headline: `mb-3`. Between headline and body: `mt-3` to `mt-4`. Between body and CTA: `mt-6` to `mt-8`.

## Elevation & shadow

Three named elevation levels create layered depth. Defined as CSS custom properties and used as Tailwind utilities via `cc-lift-*`.

| Token               | Treatment                                          | Usage                                    |
|-----------------------|-----------------------------------------------------|-------------------------------------------|
| `cc-lift-subtle`    | Soft ambient — barely visible, lifts off surface    | Hub cards at rest, section images          |
| `cc-lift-card`      | Medium lift — clear but gentle                      | Hub cards on hover, brand cards            |
| `cc-lift-elevated`  | Strong float — hero panels, modals                  | Overlays, floating panels                  |

**Rules:**
- Cards at rest use `cc-lift-subtle`. On hover, transition to `cc-lift-card`.
- Never use Tailwind's generic `shadow-sm`/`shadow-md` — use the token shadows.
- Shadows are always warm-tinted (use brand-charcoal or brand-copper alpha, never pure black).

## Border treatment

| Class / token              | Treatment                                     | Usage                                |
|----------------------------|------------------------------------------------|---------------------------------------|
| `cc-card`                  | Stone border at rest, copper on hover + shadow lift | Interactive cards (hub tiles)    |
| `cc-image-card`            | No border, shadow lift on hover                | Image-led tiles (rooms, hotels)       |
| `border-dash-border`       | `1px solid` with existing dash-border token    | Static panels (contact form)          |
| `border-brand-stone/15`    | `1px solid` at 15% opacity                     | Between-section dividers              |

**Rules:**
- Interactive cards use `cc-card` for the full rest+hover pattern (border + shadow transition built in).
- Image tiles use `cc-image-card` for borderless shadow lift.
- Horizontal rules within panels: use the existing `cc-rule-copper` or `cc-rule-stone` classes.

## Section backgrounds

Alternate between the existing background tokens to create visual rhythm:

| Surface               | Token / class                  | When to use                          |
|------------------------|--------------------------------|---------------------------------------|
| Default warm white     | `bg-background` (#FAF7F2)     | Default page ground                   |
| Linen band             | `bg-brand-linen` (#F5F0EB)    | Alternating sections, catalog band    |
| Sand band              | `bg-brand-sand/40`            | Accent sections (founder story)       |
| Charcoal band          | `bg-brand-charcoal`           | Dark contrast (brands, testimonial)   |
| Surface card           | `bg-dash-surface` (#FEFCF9)   | Cards, elevated panels                |

**Rules:**
- Never stack two same-background sections adjacent. Alternate to create rhythm.
- Dark sections (`bg-brand-charcoal`) use `text-white`, copper accents, and `border-white/10`.
- The existing `cc-paper` class provides the textured linen ground for checkout — don't use it on the homepage.

## Icon usage

- **Primary set:** Lucide React (already in the project).
- Icon size: `w-5 h-5` for inline/body, `w-4 h-4` for small/label context.
- Icon color: match the eyebrow/accent color of the section (`text-brand-copper` on light, `text-brand-terracotta` on emphasis, `text-white` on dark).
- Hub tile icons: rendered inside a `w-11 h-11` (or `w-[46px] h-[46px]` md) copper circle (`bg-brand-copper`, `text-white`).
- Never introduce a second icon library unless Lucide lacks the glyph.

## Card pattern (buyer hub reference)

The buyer-hub tiles are the canonical card pattern for the homepage:

```
bg-dash-surface
rounded-lg
cc-card          (border + shadow rest/hover built in)
p-6 md:p-7
cursor-pointer
```

All six hub tiles and future homepage cards use this pattern. The key upgrade from the flat design: **cards float above the section ground** via subtle warm shadow + stone border, and **lift on hover** via deeper shadow + copper border transition.

## What NOT to do

- No raw hex values — always reference a token or existing Tailwind class.
- No `shadow-sm`, `shadow-md`, `shadow-lg` — use the `--shadow-*` tokens.
- No custom border colors — use `--border-card` / `--border-card-hover` / `--border-section`.
- No behavior changes disguised as visual fixes.
- No new typefaces, no font-weight heavier than `semibold` on body text.
- No animation changes to existing Framer Motion transitions.
