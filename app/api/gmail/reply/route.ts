import { NextResponse, type NextRequest } from "next/server";
import { replyToThread } from "@/app/lib/gmail";
import { logEmailActivity } from "@/app/lib/email-activity";
import { getActiveStatus } from "@/app/lib/gmail-tokens";

export const POST = async (request: NextRequest) => {
  try {
    const { threadId, body, cc } = await request.json();
    if (!threadId || !body) {
      return NextResponse.json(
        { error: "threadId and body are required" },
        { status: 400 }
      );
    }

    const result = await replyToThread({ threadId, body, cc });

    const status = await getActiveStatus();
    await logEmailActivity({
      userEmail: status.gmailAddress || "",
      gmailMessageId: result.messageId,
      gmailThreadId: result.threadId,
      direction: "outbound",
      action: "replied",
      senderEmail: status.gmailAddress || "",
      subject: "",
      snippet: body.slice(0, 200),
    }).catch((err) => console.error("[Gmail reply] activity log failed:", err));

    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "reply_failed";
    console.error("[Gmail reply]", msg);
    const status = msg === "Gmail not connected" ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
};
