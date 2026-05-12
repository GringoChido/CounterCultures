#!/usr/bin/env bash
# Verify all search fixes are correctly applied.
# Exit non-zero if any anti-pattern survives.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ERRORS=0

check_zero() {
  local label="$1" pattern="$2" file="$3"
  local count
  count=$(grep -c "$pattern" "$file" 2>/dev/null | tail -1 || echo 0)
  count=${count:-0}
  if [ "$count" -ne 0 ]; then
    echo "FAIL [$label]: found $count occurrence(s) of '$pattern' in $file"
    ERRORS=$((ERRORS + 1))
  else
    echo "  OK [$label]"
  fi
}

check_exists() {
  local label="$1" pattern="$2" file="$3"
  local count
  count=$(grep -c "$pattern" "$file" 2>/dev/null || echo 0)
  if [ "$count" -eq 0 ]; then
    echo "FAIL [$label]: expected '$pattern' in $file but not found"
    ERRORS=$((ERRORS + 1))
  else
    echo "  OK [$label]"
  fi
}

SEARCH="$ROOT/app/lib/search.ts"
CATALOG="$ROOT/app/[locale]/shop/catalog/catalog-view.tsx"
PALETTE="$ROOT/app/components/search/search-palette.tsx"
CMD_PAL="$ROOT/app/(dashboard)/components/command-palette.tsx"
PRODS="$ROOT/app/lib/products-full.ts"
SAT="$ROOT/app/lib/sat-codes.ts"
COMBO="$ROOT/app/(dashboard)/components/customer-combobox.tsx"

echo "=== FIX-001: Full catalog endpoint ==="
check_zero "old-endpoint" "/api/dashboard/products?q=" "$SEARCH"
check_exists "new-endpoint" "/api/dashboard/products/search?q=" "$SEARCH"

echo "=== FIX-002: No silent swallowing ==="
check_zero "swallowed-catch" "} catch { return \[\]; }" "$SEARCH"
check_exists "SearchAllResult" "SearchAllResult" "$SEARCH"

echo "=== FIX-003: No hard-coded score 100 ==="
check_zero "score-100" "score: 100" "$SEARCH"

echo "=== FIX-004: inStockOnly in URL-sync deps ==="
check_exists "url-sync-deps" "inStockOnly, router, pathname" "$CATALOG"

echo "=== FIX-005: inStockOnly in offset-reset deps ==="
check_exists "offset-reset-deps" "query, brand, category, sortKey, inStockOnly" "$CATALOG"

echo "=== FIX-006: Race guard in catalog ==="
check_exists "reqIdRef" "reqIdRef" "$CATALOG"

echo "=== FIX-007: Error band in catalog ==="
check_exists "fetchError" "fetchError" "$CATALOG"

echo "=== FIX-008: No score:0 in public palette ==="
check_zero "score-zero" "score: 0," "$PALETTE"

echo "=== FIX-009: Index error surfaced ==="
check_exists "indexError" "indexError" "$PALETTE"

echo "=== FIX-010: URL-keyed cachedFetch ==="
check_exists "search-utils-import" 'from "./search-utils"' "$SEARCH"
check_zero "local-cache-def" "const cache: Record<string, CacheEntry<unknown>>" "$SEARCH"

echo "=== FIX-011: scoreTokens replaces score ==="
check_zero "old-score-fn" "export const score = " "$SEARCH"
check_exists "scoreTokens-usage" "scoreTokens(" "$SEARCH"

echo "=== FIX-012: Tokenized scoreRow ==="
check_exists "products-search-utils" 'from "./search-utils"' "$PRODS"
check_zero "old-scoreRow" "if (p._sku === q) return 100" "$PRODS"
check_exists "new-scoreRow" "scoreTokens(q" "$PRODS"

echo "=== FIX-013: Tiered SAT search ==="
check_exists "sat-scoreTokens" "scoreTokens(query" "$SAT"

echo "=== FIX-014: Locale-aware boosts ==="
check_exists "locale-param" "buildMiniSearch(payload.documents, locale)" "$PALETTE"
check_exists "fuzzy-015" "fuzzy: 0.15" "$PALETTE"

echo "=== FIX-015: Clamp selectedIndex ==="
check_exists "clamp" "selectedIndex >= flatList.length" "$CMD_PAL"

echo "=== FIX-016: useDebouncedFetch in combobox ==="
check_exists "debounced-import" "useDebouncedFetch" "$COMBO"
check_exists "debounced-hook-file" "useDebouncedFetch" "$ROOT/app/lib/use-debounced-fetch.ts"
check_zero "old-setHits" "setHits" "$COMBO"

echo ""
if [ "$ERRORS" -gt 0 ]; then
  echo "FAILED: $ERRORS check(s) did not pass."
  exit 1
else
  echo "ALL CHECKS PASSED."
  exit 0
fi
