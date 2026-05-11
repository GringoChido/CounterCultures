import { NextResponse } from "next/server";
import { listMessagesForDeal } from "@/app/lib/conversation-log";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing deal ID" }, { status: 400 });
  }

  try {
    const messages = await listMessagesForDeal(id);
    return NextResponse.json({ messages });
  } catch (err) {
    console.error(`[deals/${id}/messages]`, err);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}
