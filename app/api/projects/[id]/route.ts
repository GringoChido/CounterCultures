import { NextResponse } from "next/server";

export const GET = async (
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  return NextResponse.json({ id, items: [] });
};

export const PATCH = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  try {
    const body = await req.json();
    return NextResponse.json({ ok: true, id, ...body });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
};

export const DELETE = async (
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  return NextResponse.json({ ok: true, id });
};
