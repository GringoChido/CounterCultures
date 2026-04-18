import { NextResponse, type NextRequest } from "next/server";
import { getThread, markThreadRead } from "@/app/lib/gmail";

export const GET = async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  try {
    const thread = await getThread(id);
    return NextResponse.json(thread);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "thread_failed";
    console.error("[Gmail thread]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
};

export const PATCH = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  try {
    const body = await request.json();
    if (body.action === "mark_read") {
      await markThreadRead(id);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "unknown_action" }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "action_failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
};
