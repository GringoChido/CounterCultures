# [P2] Brand Kit Spanglish Cleanup (22 Brands)

> **Status:** PENDING · **Priority:** P2 · **Effort:** 4 hrs · **Branch:** `claude/fix-brand-kit-spanglish`
> **Last updated:** 2026-05-12

## Why this matters
22 brands in the Brand Kit sheet are currently shipping AI-mid-translation Spanglish to Mexican customers — e.g., pfister reads "Ofrece a broad range of elegante and affordable grifería." This is the kind of copy that, when seen by a Mexican buyer, instantly destroys trust in a premium importer. It's a brand-credibility tax on every visit to those brand pages.

## The problem (evidence)
- Filter `CC_Brand_Kit` by `updated_by = "claude (brands-151 batch)"` and `updated_at = 2026-05-05` returns 22 rows.
- Visual sample: pfister, kohler, moen, hansgrohe, grohe, delta, american-standard (and 15 more) all show mixed-language `tagline_es` / `description_es`.
- No QA gate caught it — batch was auto-pushed to prod sheets.

## Scope
**In scope:**
- Identify all 22 affected rows.
- Regenerate `tagline_es` and `description_es` with proper Mexican Spanish via a structured Claude prompt.
- QA review (Joshua or Antonia eyes-on each one).
- Push corrections back to `CC_Brand_Kit`.
- Update `updated_by` to `claude (brands-151 re-translation 2026-05)` so we can audit again later.

**Out of scope:**
- Re-running the broader 151-batch (only the 22 Spanglish ones).
- Adding a build-time language detector (separate ticket).

## Files to touch
- `scripts/fix-brand-kit-spanglish.ts` (new — read affected rows, generate, write back)
- `scripts/brand-spanglish-qa.md` (new — table of before/after for human review)
- Direct sheet: `CC_Brand_Kit` tab (22 row update)

## The fix (step by step)
1. Write `scripts/fix-brand-kit-spanglish.ts` that filters rows where `updated_by = "claude (brands-151 batch)"`.
2. For each row, call Claude with a structured prompt: *"Translate this brand description to natural Mexican Spanish, preserving brand voice. Output only the translation, no commentary. Source: <english_text>"*. Apply to both `tagline` and `description` source English fields.
3. Write proposed translations into `brand-spanglish-qa.md` as a Markdown table (brand, before_es, proposed_es).
4. Joshua + Antonia review the doc, mark approvals inline.
5. Re-run the script in `--apply` mode to push approved translations back, setting `updated_by` and `updated_at`.
6. Spot-check three random brand pages on staging.

## Acceptance criteria
- [ ] All 22 affected rows identified and listed in QA doc.
- [ ] Each row has a clean Mexican Spanish translation in `tagline_es` + `description_es`.
- [ ] Human QA approval logged before write-back.
- [ ] `updated_by` reflects the re-translation pass.
- [ ] Pfister page reads as natural Spanish on staging.

## Verification
```bash
npm run script -- scripts/fix-brand-kit-spanglish.ts --dry-run
```
Expected: prints 22 rows with proposed translations, writes nothing.

## Dependencies
**Requires:** none.
**Blocks:** none.

## Notes
See `AGENTS.md` for brand-voice norms in Spanish (informal Mexican `tú`, no Iberian `vosotros`). If a brand has a known Mexican-market tagline (kohler, grohe), prefer that over a fresh translation.
