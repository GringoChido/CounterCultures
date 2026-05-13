import { NextResponse } from "next/server";

export const GET = async () => {
  return NextResponse.json({ projects: [] });
};

export const POST = async (req: Request) => {
  try {
    const { name } = await req.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "name required" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
};
