import { NextResponse, type NextRequest } from "next/server";
import { sendMessage } from "@/app/lib/gmail";
import { logEmailActivity } from "@/app/lib/email-activity";
import { getActiveStatus } from "@/app/lib/gmail-tokens";

export const POST = async (request: NextRequest) => {
  try {
    const { to, cc, bcc, subject, body } = await request.json();
    if (!to || !subject || !body) {
      return NextResponse.json(
        { error: "to, subject, and body are required" },
        { status: 400 }
      );
    }

    const result = await sendMessage({ to, cc, bcc, subject, body });

    const status = await getActiveStatus();
    await logEmailActivity({
      userEmail: status.gmailAddress || "",
      gmailMessageId: result.messageId,
      gmailThreadId: result.threadId,
      direction: "outbound",
      action: "sent",
      senderEmail: status.gmailAddress || "",
      recipientEmails: [to, cc, bcc].filter(Boolean) as string[],
      subject,
      snippet: body.slice(0, 200),
    }).catch((err) => console.error("[Gmail send] activity log failed:", err));

    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "send_failed";
    console.error("[Gmail send]", msg);
    const status = msg === "Gmail not connected" ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
};
