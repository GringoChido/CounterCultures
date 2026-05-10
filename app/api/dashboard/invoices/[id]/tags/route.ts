/**
 * GET  /api/dashboard/invoices/[id]/tags — get all tags for an invoice
 * PATCH /api/dashboard/invoices/[id]/tags — set a tag (shipping_scenario, etc.)
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/app/lib/auth";
import { getInvoiceTags, setInvoiceTag } from "@/app/lib/invoice-tags";

export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> => {
  try {
    const { id } = await params;
    const tags = await getInvoiceTags(id);
    return NextResponse.json({ tags });
  } catch (err) {
    console.error("[invoices/tags] GET error:", err);
    return NextResponse.json({ error: "Failed to load tags" }, { status: 500 });
  }
};

const PatchBody = z.object({
  tagType: z.string().min(1).max(50),
  tagValue: z.string().max(100),
});

export const PATCH = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = PatchBody.parse(await req.json());

    await setInvoiceTag(id, body.tagType, body.tagValue, user.email);

    return NextResponse.json({ ok: true, tagType: body.tagType, tagValue: body.tagValue });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid body", issues: err.issues }, { status: 400 });
    }
    console.error("[invoices/tags] PATCH error:", err);
    return NextResponse.json({ error: "Failed to set tag" }, { status: 500 });
  }
};
