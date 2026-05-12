# Counter Cultures — Asset Migration Pipeline

End-to-end pipeline that pulls product images, descriptions, and spec sheets
from the legacy Squarespace site (`countercultures.com.mx`), the Odoo
catalog, partner manufacturer sites, and Claude Haiku, and merges everything
into the new Next.js site at `app/lib/product-content.json`.

## TL;DR

```bash
chmod +x scripts/scrape/run-all.sh
./scripts/scrape/run-all.sh
```

Walk away for ~5 hours. ~$15 in API spend. Returns when done. Safe to stop
and re-run; every script skips work it's already completed.

## Pipeline shape

```
                        ┌────────────────────┐
                        │ countercultures.   │  Squarespace storefront (live)
                        │   com.mx           │
                        └─────┬──────────────┘
                              │
                  ┌───────────┴───────────┐
                  │ 01 sitemap.xml        │ ← 633 product URLs
                  │ 02 product detail     │ ← Spanish copy, features, image URLs
                  │ 03 image downloads    │ ← 2500w gallery JPGs
                  │ 04 spec URL extract   │ ← 609 spec PDFs from Odoo desc field
                  │ partner-brizo-delta   │ ← URL-pattern fallback
                  └───────────┬───────────┘
                              │
                  ┌───────────┴───────────┐
                  │ 05  fuzzy match       │ ← Jaccard token overlap (~20% high-conf)
                  │ 05b LLM match (Haiku) │ ← Spanish→English semantic match
                  │ 09  variant collapse  │ ← group finish/handing variants → parent
                  └───────────┬───────────┘
                              │
                  ┌───────────┴───────────┐
                  │ 06 compose content    │ ← merge legacy + matches → product-content.json
                  │ 10 LLM fill gaps      │ ← bilingual descriptions for parents w/o one
                  │ 11 merge partner data │ ← (when partner scrapers run)
                  │ 12 final audit        │ ← coverage report + photography shot list
                  └───────────────────────┘
```

## Coverage targets (after `run-all.sh` completes)

| Asset | Initial (today) | After full run | How |
| --- | ---: | ---: | --- |
| Thumbnail | 100% | 100% | Already on disk |
| Spanish description | ~10% | **~98%** | Legacy scrape (633) + LLM fill (~3,500) |
| English description | ~9% | **~98%** | Partner scrape + LLM fill |
| Feature bullets | <1% | **~95%** | Legacy + LLM |
| Spec sheet PDF | 1.6% | **~60-70%** | Legacy extraction + partner scrape + Brizo/Delta URL pattern |
| Gallery (3+ images) | 0.1% | **~50%** | Legacy 633 + partner scrape |
| Variant linkage | 0% | **~30%** (~100 families) | SKU-root collapse |

The ~200 parent products that come up imageless after the full run are
flagged in `docs/audit/CC-Needs-Photography.xlsx` as a concrete shot list
for your photographer.

## What's already in the repo

- `app/lib/product-content.ts` + `product-content.json` — the sidecar the
  site reads. `getProductContent(odooId)` returns descriptions, features,
  gallery, spec sheet URL, etc.
- `app/lib/products-full.ts` — extended `ProductFull` with the new fields.
  `toQuoteProduct` merges side-car content so PDP pages render rich content
  automatically as it lands.
- `app/lib/product-families.json` — variant collapse output. Children
  inherit content from their parent at audit/render time.
- `docs/audit/CC-Asset-Gap-Audit.xlsx` — auto-refreshed by step 12.
- `docs/audit/CC-Needs-Photography.xlsx` — auto-refreshed by step 12.

## Running individual stages

Each script is self-contained, idempotent, and resumable:

```bash
# Discover
npx tsx scripts/scrape/01-cc-mx-sitemap.ts

# Scrape (resumable — skips any slug with an existing .json)
npx tsx scripts/scrape/02-cc-mx-products.ts                 # full
npx tsx scripts/scrape/02-cc-mx-products.ts --limit 25      # smoke
npx tsx scripts/scrape/02-cc-mx-products.ts --concurrency 8 # default 4

# Images / PDFs (resumable — skips files already on disk)
npx tsx scripts/scrape/03-cc-mx-images.ts
npx tsx scripts/scrape/04-extract-spec-urls.ts
npx tsx scripts/scrape/partner-brizo-delta.ts

# Match
npx tsx scripts/scrape/05-match-to-odoo.ts
npx tsx scripts/scrape/05b-llm-match.ts                     # ~$0.50, ~5 min
npx tsx scripts/scrape/09-collapse-variants.ts

# Partner scrape — one per brand, copy partner-_template.ts to add more
npx tsx scripts/scrape/partner-california-faucets.ts
npx tsx scripts/scrape/partner-emtek.ts

# Compose + fill
npx tsx scripts/scrape/06-build-product-content.ts --copy-gallery --rebuild-manifest
npx tsx scripts/scrape/10-llm-fill-descriptions.ts          # ~$11, ~30 min
npx tsx scripts/scrape/11-merge-partner-content.ts

# Audit
npx tsx scripts/scrape/12-final-audit.ts
```

## Cost breakdown

Claude Haiku 4.5 pricing (May 2026): ~$1/M input + $5/M output tokens.

- Step 05b (LLM matcher): ~500 rows × 800 in + 80 out tokens ≈ **$0.60**
- Step 10 (description generator): ~3,500 rows × 600 in + 350 out tokens ≈ **$13**
- Total ≈ **$14**

## Adding partner scrapers

```bash
cp scripts/scrape/partner-_template.ts scripts/scrape/partner-<brand>.ts
```

Edit three sections marked `CUSTOMIZE THESE`:
1. `BRAND_FILTER` — exact string from Odoo CSV
2. `productUrl(sku)` — URL pattern(s) for the manufacturer's product page
3. `parseProduct(html)` — extract description, features, images, spec PDF

Add it to `run-all.sh` between the existing partner lines.

## Safety / politeness defaults

- All HTTP calls go through `_lib.ts` with: 30s timeout, 3 retries with
  exponential backoff + jitter, custom UA, atomic file writes
- Concurrency capped at 3-8 per script
- API rate-limit errors → automatic backoff, never busy-loops
- Anthropic SDK uses the standard retry-with-backoff baked in

## State on disk

```
staging/cc-mx/sitemap.json            # 633 URLs
staging/cc-mx/products/<slug>.json    # per-product scraped data
staging/cc-mx/images/<slug>/N.jpg     # staged images before copy
staging/cc-mx/match-map.json          # slug↔Odoo id pairings
staging/cc-mx/match-llm.json          # LLM reasoning per pick
staging/spec-urls.json                # spec PDFs found in Odoo desc
staging/partner/<brand>/<id>.json     # partner-scraped data

public/products/odoo/<id>.jpg         # canonical thumbnail (existing)
public/products/odoo-gallery/<id>/    # gallery images keyed by Odoo id
public/specs/odoo/<id>.pdf            # locally mirrored spec sheets

app/lib/product-content.json          # ← what the new site reads
app/lib/product-families.json         # ← parent/variant mapping
app/lib/product-image-manifest.json   # ← regenerated by step 06
```

The `staging/` folder is gitignored — only the curated outputs in `app/lib/`
and `public/products/` are checked in.
