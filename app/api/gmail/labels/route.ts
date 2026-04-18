import { NextResponse } from "next/server";
import { listLabels } from "@/app/lib/gmail";

export const GET = async () => {
  try {
    const labels = await listLabels();
    return NextResponse.json({ labels });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "labels_failed";
    console.error("[Gmail labels]", msg);
    const status = msg === "Gmail not connected" ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
};
