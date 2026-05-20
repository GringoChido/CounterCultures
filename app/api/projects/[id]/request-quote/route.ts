import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { submitLead } from "@/app/lib/sheets";
import { notifyRoger, notifyWhatsApp } from "@/app/lib/email";

const schema = z.object({
  email: z.email(),
  name: z.string().min(1).max(200),
  notes: z.string().max(5000).optional().default(""),
});

export const POST = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  try {
    const body = await req.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Name and a valid email are required" }, { status: 400 });
    }

    const { email, name, notes } = result.data;

    await submitLead({
      name,
      email,
      phone: "",
      source: `project-quote:${id}`,
      message: notes || `Quote request for project ${id}`,
    });

    void Promise.all([
      notifyRoger(
        `Quote Request: ${name} — Project ${id}`,
        `Name: ${name}\nEmail: ${email}\nProject: ${id}\nNotes: ${notes || "—"}`
      ).catch(() => {}),
      notifyWhatsApp(`New quote request: ${name} (${email}) — Project ${id}`).catch(() => {}),
    ]);

    return NextResponse.json({ ok: true, projectId: id });
  } catch {
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
};
