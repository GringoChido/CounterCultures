/**
 * Notes helpers — single source of truth for reads/writes against the
 * `Notes` tab of the CRM Sheet.
 *
 * One data model for every entity type: lead / deal / shipment / trade_app /
 * blog_post / whatsapp_thread / etc. Powered by <NotesPanel /> in the portal.
 *
 * Schema (6 cols):
 *   note_id · entity_type · entity_id · author_email · timestamp · content
 */

import { readSheet, appendRow } from "./dashboard-sheets";

export type EntityType =
  | "lead"
  | "deal"
  | "shipment"
  | "trade_app"
  | "blog_post"
  | "whatsapp_thread";

export interface Note {
  noteId: string;
  entityType: EntityType;
  entityId: string;
  authorEmail: string;
  timestamp: string; // ISO 8601
  content: string;
}

interface NoteRow extends Record<string, string> {
  note_id: string;
  entity_type: string;
  entity_id: string;
  author_email: string;
  timestamp: string;
  content: string;
}

const rowToNote = (r: NoteRow): Note => ({
  noteId: r.note_id,
  entityType: (r.entity_type || "lead") as EntityType,
  entityId: r.entity_id,
  authorEmail: r.author_email,
  timestamp: r.timestamp,
  content: r.content,
});

export const listNotes = async (
  entityType: EntityType,
  entityId: string
): Promise<Note[]> => {
  const rows = await readSheet<NoteRow>("Notes");
  return rows
    .filter((r) => r.entity_type === entityType && r.entity_id === entityId)
    .map(rowToNote)
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
};

export const createNote = async (input: {
  entityType: EntityType;
  entityId: string;
  authorEmail: string;
  content: string;
}): Promise<Note> => {
  const noteId = `NOTE-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const timestamp = new Date().toISOString();

  await appendRow("Notes", [
    noteId,
    input.entityType,
    input.entityId,
    input.authorEmail,
    timestamp,
    input.content,
  ]);

  return {
    noteId,
    entityType: input.entityType,
    entityId: input.entityId,
    authorEmail: input.authorEmail,
    timestamp,
    content: input.content,
  };
};
