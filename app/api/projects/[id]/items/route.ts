import { NextResponse } from "next/server";

export const POST = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  try {
    const item = await req.json();
    if (!item.productId) {
      return NextResponse.json(
        { error: "productId required" },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: true, projectId: id });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
};

export const DELETE = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  try {
    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json(
        { error: "productId required" },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: true, projectId: id, removed: productId });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
};
