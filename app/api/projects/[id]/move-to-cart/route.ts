import { NextResponse } from "next/server";

export const POST = async (
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  return NextResponse.json({ ok: true, projectId: id });
};
