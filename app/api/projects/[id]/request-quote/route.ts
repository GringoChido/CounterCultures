import { NextResponse } from "next/server";

export const POST = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  try {
    const { email, name, notes } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "email required" }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      projectId: id,
      email,
      name,
      notes,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
};
