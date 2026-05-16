# i18n Post-fix — Verification Results

All verification scripts pass after the `fix/i18n-locale-toggle-permanent` changes.

## Script results

```
1. Hardcoded locale-stripping hrefs:  PASS (0 raw internal links via next/link)
2. No raw next/link in Header/Footer: PASS (NextLink kept only for /account, /dashboard bypasses)
3. JSON key parity en.json/es.json:   PASS (127 keys in sync)
4. Toggle no <a href> reload:         PASS (uses useRouter().replace with locale option)
5. useLocale / no locale prop:        PASS (Header + Footer use useLocale(), no locale prop)
6. Build:                             PASS (npm run build succeeds, zero new errors)
```

## What changed

- **Header**: `useLocale()` + `useTranslations("nav")` + i18n `Link` from `@/app/i18n/navigation`.
  Language toggle replaced with `LanguageToggle` component using `useRouter().replace(href, { locale, scroll: false })`.
  Preserves path, query string, and hash. No full-page reload.
- **Footer**: Converted to `"use client"`, uses `useLocale()` + `useTranslations("footer")` + i18n `Link`.
  Removed manual `/${lang}` href prefixes.
- **Section components** (7 files): Swapped `next/link` imports to i18n `Link`, stripped manual `/${locale}` prefixes.
- **Message files**: Added 13 new keys (6 nav, 7 footer) to both `en.json` and `es.json`.
- **Call sites**: Removed `locale` prop from 54 Header/Footer usages across 26 page files.

## Manual test matrix

To be verified in browser:
- [ ] `/` -> toggle ES -> click each top nav item -> URL stays `/es/...`
- [ ] `/es/shop/bathroom?brand=kohler#specs` -> toggle EN -> URL is `/en/shop/bathroom?brand=kohler#specs`
- [ ] `/en/shop/bathroom/p/some-slug` -> toggle ES -> same product slug, `/es/...`
- [ ] Reload `/es/contact` directly -> page renders in Spanish, no flash of English
- [ ] Incognito with `Accept-Language: es-MX` -> first hit `/` -> redirects to `/es/`; then explicit `/en/shop` stays `/en/shop`
- [ ] Mobile menu toggle -> tap ES -> menu closes, URL updates, no double-render
