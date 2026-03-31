import { NextResponse } from "next/server";
import { getFacebookPosts, getInstagramPosts } from "@/app/lib/social/meta-api";
import { samplePosts } from "@/app/lib/social/sample-data";

export async function GET() {
  // Try live API first
  const [fbResult, igResult] = await Promise.all([
    getFacebookPosts(),
    getInstagramPosts(),
  ]);

  if (fbResult.success && igResult.success) {
    const allPosts = [...(fbResult.data || []), ...(igResult.data || [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return NextResponse.json({ posts: allPosts, source: "live" });
  }

  // Fall back to sample data
  return NextResponse.json({ posts: samplePosts, source: "sample" });
}
