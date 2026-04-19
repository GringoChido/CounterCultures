/**
 * Unit test for app/lib/search.ts pure logic — score() ranking, rankResults()
 * dedupe, searchAllEntities() input guards.
 *
 * Run: npx tsx scripts/_test-search.ts
 *
 * NOTE: this does NOT exercise the per-entity API fetchers — those need
 * browser cookies for auth and are verified via browser preview in T2.
 * The score function is the load-bearing piece; if it ranks correctly,
 * the live integration is just a wiring exercise.
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

const main = async () => {
  const { score, rankResults, searchAllEntities } = await import("../app/lib/search");

  console.log("→ score() — empty query returns 0");
  if (score("", "kohler") !== 0) throw new Error("empty query should score 0");
  if (score("   ", "kohler") !== 0) throw new Error("whitespace query should score 0");

  console.log("→ score() — no fields returns 0");
  if (score("kohler") !== 0) throw new Error("no fields should score 0");

  console.log("→ score() — exact match outranks prefix outranks substring");
  const exact = score("kohler", "kohler");
  const prefix = score("kohler", "kohler kitchen");
  const substring = score("kohler", "premium kohler hardware");
  console.log(`  exact=${exact}  prefix=${prefix}  substring=${substring}`);
  if (!(exact > prefix && prefix > substring))
    throw new Error(`ranking broken: exact=${exact} prefix=${prefix} substring=${substring}`);

  console.log("→ score() — earlier-position fields outweigh later");
  const earlyHit = score("kohler", "kohler", "other");
  const lateHit = score("kohler", "other", "kohler");
  console.log(`  earlyHit=${earlyHit}  lateHit=${lateHit}`);
  if (earlyHit <= lateHit)
    throw new Error(`field-position weight broken: early=${earlyHit} late=${lateHit}`);

  console.log("→ score() — case-insensitive");
  if (score("KOHLER", "kohler") !== score("kohler", "kohler"))
    throw new Error("case-insensitive match broken");

  console.log("→ score() — undefined fields skipped without crashing");
  const undef = score("kohler", undefined, "kohler", undefined);
  if (undef === 0) throw new Error("undefined fields should be skipped, not zeroed");

  console.log("→ score() — no match returns 0");
  if (score("zzz_unmatched", "kohler", "dornbracht") !== 0)
    throw new Error("unmatched query should return 0");

  console.log("→ rankResults() — sorts by score desc");
  const ranked = rankResults([
    { id: "a", type: "lead", title: "A", subtitle: "", href: "/a", score: 5 },
    { id: "b", type: "deal", title: "B", subtitle: "", href: "/b", score: 20 },
    { id: "c", type: "brand", title: "C", subtitle: "", href: "/c", score: 12 },
  ]);
  if (ranked.map((r) => r.id).join(",") !== "b,c,a")
    throw new Error(`rank order wrong: ${ranked.map((r) => r.id).join(",")}`);

  console.log("→ rankResults() — dedupes by id");
  const deduped = rankResults([
    { id: "x", type: "lead", title: "X1", subtitle: "", href: "/x", score: 10 },
    { id: "x", type: "lead", title: "X2", subtitle: "", href: "/x", score: 5 },
    { id: "y", type: "deal", title: "Y", subtitle: "", href: "/y", score: 7 },
  ]);
  if (deduped.length !== 2) throw new Error(`dedupe failed: got ${deduped.length} expected 2`);
  if (deduped.find((r) => r.id === "x")?.title !== "X1")
    throw new Error("first occurrence should win on dedupe");

  console.log("→ rankResults() — caps at 50 results");
  const many = Array.from({ length: 80 }, (_, i) => ({
    id: `r-${i}`,
    type: "lead" as const,
    title: `r${i}`,
    subtitle: "",
    href: "/",
    score: 100 - i,
  }));
  if (rankResults(many).length !== 50) throw new Error("cap-at-50 broken");

  console.log("→ searchAllEntities() — empty query returns []");
  const empty = await searchAllEntities("");
  if (empty.length !== 0) throw new Error(`empty query should return [], got ${empty.length}`);

  console.log("→ searchAllEntities() — single-char query returns []");
  const short = await searchAllEntities("a");
  if (short.length !== 0) throw new Error(`single-char query should return [], got ${short.length}`);

  console.log("→ searchAllEntities() — never throws on fetch failure (Node has no cookies)");
  const longQuery = await searchAllEntities("kohler");
  if (!Array.isArray(longQuery))
    throw new Error("searchAllEntities should always return an array");
  console.log(
    `  got ${longQuery.length} results (0 expected in Node — fetches 401 silently); blog matches still work`
  );

  console.log("\n✅ search.ts unit logic OK (live integration verified via browser preview in T2)");
};

main().catch((e) => {
  console.error("\n❌ FAILED:", e?.message || e);
  process.exit(1);
});
