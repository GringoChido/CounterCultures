import { NextRequest, NextResponse } from "next/server";
import { getPostComments, replyToComment } from "@/app/lib/social/meta-api";
import { sampleComments } from "@/app/lib/social/sample-data";

export async function GET() {
  // In demo mode, return sample comments
  // In production, you'd iterate posts and fetch comments from the API
  return NextResponse.json({ comments: sampleComments, source: "sample" });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.commentId || !body.message) {
    return NextResponse.json(
      { error: "commentId and message are required" },
      { status: 400 }
    );
  }

  const result = await replyToComment({
    commentId: body.commentId,
    message: body.message,
  });

  if (!result.success) {
    // In demo mode, simulate success
    if (result.error === "Meta API not configured") {
      return NextResponse.json({
        success: true,
        data: { id: `reply-${Date.now()}` },
        source: "sample",
      });
    }
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ success: true, data: result.data });
}
