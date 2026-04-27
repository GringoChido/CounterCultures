import { NextResponse } from "next/server";
import { buildSearchIndex } from "@/app/lib/search-index";

/**
 * Public search index endpoint.
 *
 * Client SearchPalette fetches this once on first open, then runs all queries
 * in-memory via MiniSearch — no server roundtrip per keystroke. Cached at the
 * edge for 5 minutes so Brand Kit / posts-sheet edits surface within one
 * cache cycle.
 */
export const revalidate = 300;

export const GET = async () => {
  try {
    const payload = await buildSearchIndex();
    return NextResponse.json(payload, {
      headers: {
        "cache-control": "public, max-age=300, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    console.error("[/api/search-index] build failed", err);
    return NextResponse.json(
      { generatedAt: new Date().toISOString(), documents: [] },
      { status: 500 },
    );
  }
};
