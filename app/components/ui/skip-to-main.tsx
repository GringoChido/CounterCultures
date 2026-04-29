import { focusRing } from "./focus-ring";

interface SkipToMainProps {
  /** id of the page's <main id="main" tabIndex={-1}>; default "main" */
  targetId?: string;
  label?: string;
}

const SkipToMain = ({ targetId = "main", label = "Skip to main content" }: SkipToMainProps) => (
  <a
    href={`#${targetId}`}
    className={`sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:bg-dash-surface focus:text-brand-charcoal focus:border focus:border-dash-border-strong focus:rounded-md focus:font-medium ${focusRing}`}
  >
    {label}
  </a>
);

export { SkipToMain };
