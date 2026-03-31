import { NextRequest, NextResponse } from "next/server";
import { publishToFacebook, publishToInstagram } from "@/app/lib/social/meta-api";
import type { CreatePostPayload } from "@/app/lib/social/types";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CreatePostPayload;

  if (!body.message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const results: Record<string, { success: boolean; error?: string }> = {};

  for (const platform of body.platforms) {
    if (platform === "facebook") {
      const result = await publishToFacebook(body.message, body.mediaUrl);
      results.facebook = { success: result.success, error: result.error };
    }

    if (platform === "instagram") {
      if (!body.mediaUrl) {
        results.instagram = {
          success: false,
          error: "Instagram requires an image or video",
        };
        continue;
      }
      const result = await publishToInstagram(
        body.message,
        body.mediaUrl,
        body.mediaType || "IMAGE"
      );
      results.instagram = { success: result.success, error: result.error };
    }
  }

  const anySuccess = Object.values(results).some((r) => r.success);
  return NextResponse.json({ results, anySuccess }, { status: anySuccess ? 200 : 502 });
}
