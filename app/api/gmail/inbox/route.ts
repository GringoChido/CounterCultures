import { NextResponse, type NextRequest } from "next/server";
import { listInbox } from "@/app/lib/gmail";

export const GET = async (request: NextRequest) => {
  const q = request.nextUrl.searchParams.get("q") || undefined;
  const pageToken = request.nextUrl.searchParams.get("pageToken") || undefined;
  const labelParam = request.nextUrl.searchParams.get("labels");
  const labelIds = labelParam ? labelParam.split(",") : undefined;
  const maxResults = Number(request.nextUrl.searchParams.get("maxResults") || 50);
  const noCache = request.nextUrl.searchParams.get("noCache") === "1";

  try {
    const result = await listInbox({ q, pageToken, labelIds, maxResults, noCache });
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "inbox_failed";
    console.error("[Gmail inbox]", msg);
    const status = msg === "Gmail not connected" ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
};
