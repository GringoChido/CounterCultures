import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const ARBITRARY_HEX_PATTERN =
  "\\b(?:bg|text|border|from|to|via|ring|outline|divide|decoration|caret|accent)-\\[#";

const OFF_SYSTEM_PALETTE_PATTERN =
  "\\b(?:bg|text|border|from|to|via|ring|outline|divide|decoration|caret|accent)-(?:red|green|blue|yellow|gray|slate|zinc|neutral|stone|purple|pink|indigo|cyan|teal|lime|emerald|amber|orange|rose|violet|fuchsia|sky)-\\d";

const ARBITRARY_HEX_MESSAGE =
  "Use design tokens, not arbitrary hex colors. See app/globals.css for brand-* and dash-* tokens. Allow-list third-party brand colors with `// eslint-disable-next-line no-restricted-syntax`.";

const OFF_SYSTEM_PALETTE_MESSAGE =
  "Use brand-* or dash-* semantic tokens (dash-success, dash-warn, dash-danger, dash-info) instead of off-system Tailwind palette colors. See app/globals.css.";

// Phase 2 theming sweep cleared all existing violations, so this is now "error":
// any new arbitrary hex or off-system Tailwind palette in JSX/TS will fail lint.
// To use a third-party brand color, define a `vendor-*` token in app/globals.css
// and reference it with bg-vendor-foo / text-vendor-foo.
const COLOR_GUARDRAILS = [
  "error",
  {
    selector: `Literal[value=/${ARBITRARY_HEX_PATTERN}/]`,
    message: ARBITRARY_HEX_MESSAGE,
  },
  {
    selector: `TemplateElement[value.raw=/${ARBITRARY_HEX_PATTERN}/]`,
    message: ARBITRARY_HEX_MESSAGE,
  },
  {
    selector: `Literal[value=/${OFF_SYSTEM_PALETTE_PATTERN}/]`,
    message: OFF_SYSTEM_PALETTE_MESSAGE,
  },
  {
    selector: `TemplateElement[value.raw=/${OFF_SYSTEM_PALETTE_PATTERN}/]`,
    message: OFF_SYSTEM_PALETTE_MESSAGE,
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "no-restricted-syntax": COLOR_GUARDRAILS,
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-old/**",
    ".netlify/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
