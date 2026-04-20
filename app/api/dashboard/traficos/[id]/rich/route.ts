import { NextResponse, type NextRequest } from "next/server";
import { hydrateTrafico } from "@/app/lib/trafico-hydrator";

export const GET = async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  try {
    const hydrated = await hydrateTrafico(id);
    if (!hydrated) {
      return NextResponse.json({ error: "Trafico not found" }, { status: 404 });
    }
    return NextResponse.json(hydrated);
  } catch (err) {
    console.error("[Trafico Rich API] GET error:", err);
    return NextResponse.json({ error: "Failed to hydrate trafico" }, { status: 500 });
  }
};
