import { NextResponse, type NextRequest } from "next/server";
import { listNotes, createNote, type EntityType } from "@/app/lib/notes";

const VALID_ENTITY_TYPES: EntityType[] = [
  "lead",
  "deal",
  "shipment",
  "trade_app",
  "blog_post",
  "whatsapp_thread",
];

const isValidType = (t: string): t is EntityType =>
  (VALID_ENTITY_TYPES as string[]).includes(t);

export const GET = async (request: NextRequest) => {
  const entityType = request.nextUrl.searchParams.get("entityType");
  const entityId = request.nextUrl.searchParams.get("entityId");

  if (!entityType || !entityId) {
    return NextResponse.json(
      { error: "entityType and entityId are required" },
      { status: 400 }
    );
  }
  if (!isValidType(entityType)) {
    return NextResponse.json(
      { error: `Invalid entityType: ${entityType}` },
      { status: 400 }
    );
  }

  try {
    const notes = await listNotes(entityType, entityId);
    return NextResponse.json({ notes });
  } catch (err) {
    console.error("[Notes API] GET error:", err);
    return NextResponse.json({ notes: [] });
  }
};

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { entityType, entityId, authorEmail, content } = body as {
      entityType?: string;
      entityId?: string;
      authorEmail?: string;
      content?: string;
    };

    if (!entityType || !entityId || !content?.trim()) {
      return NextResponse.json(
        { error: "entityType, entityId, and content are required" },
        { status: 400 }
      );
    }
    if (!isValidType(entityType)) {
      return NextResponse.json(
        { error: `Invalid entityType: ${entityType}` },
        { status: 400 }
      );
    }

    const note = await createNote({
      entityType,
      entityId,
      authorEmail: (authorEmail || "").trim() || "admin@countercultures.com.mx",
      content: content.trim(),
    });

    return NextResponse.json({ note });
  } catch (err) {
    console.error("[Notes API] POST error:", err);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
};
