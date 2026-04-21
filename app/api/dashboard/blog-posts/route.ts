import { NextResponse } from "next/server";
import { getAllArticlesWithStatus } from "@/app/lib/posts-sheet";

export const GET = async () => {
  try {
    const posts = await getAllArticlesWithStatus();
    return NextResponse.json({ posts });
  } catch (err) {
    console.error("[blog-posts] error:", err);
    return NextResponse.json(
      { error: "Failed to load posts" },
      { status: 500 }
    );
  }
};
