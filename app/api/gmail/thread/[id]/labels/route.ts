import { NextResponse, type NextRequest } from "next/server";
import { modifyThreadLabels } from "@/app/lib/gmail";

export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  try {
    const { add, remove } = (await request.json()) as {
      add?: string[];
      remove?: string[];
    };
    if (
      (!Array.isArray(add) || add.length === 0) &&
      (!Array.isArray(remove) || remove.length === 0)
    ) {
      return NextResponse.json(
        { error: "Provide at least one of: add[], remove[]" },
        { status: 400 }
      );
    }
    const labelIds = await modifyThreadLabels(id, { add, remove });
    return NextResponse.json({ labelIds });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "labels_modify_failed";
    console.error("[Gmail thread labels]", msg);
    const status = msg === "Gmail not connected" ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
};
