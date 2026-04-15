import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { submitLead } from "@/app/lib/sheets";
import { sendContactConfirmation, notifyRoger, notifyWhatsApp } from "@/app/lib/email";

const schema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).optional().default(""),
  email: z.email(),
  phone: z.string().max(30).optional().default(""),
  type: z.string().max(50).optional().default("general"),
  message: z.string().max(5000).optional().default(""),
});

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Name and a valid email are required" },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, phone, type, message } = result.data;
    const name = `${firstName} ${lastName}`.trim();

    await submitLead({
      name,
      email,
      phone,
      source: `contact-form:${type}`,
      message,
    });

    // Fire-and-forget: confirmation email + internal notifications
    void Promise.all([
      sendContactConfirmation(email, firstName).catch(() => {}),
      notifyRoger(
        `New Contact: ${name}`,
        `Name: ${name}\nEmail: ${email}\nPhone: ${phone || "—"}\nType: ${type}\nMessage: ${message || "—"}`
      ).catch(() => {}),
      notifyWhatsApp(`New contact form: ${name} (${email}) — ${type}`).catch(() => {}),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to submit" },
      { status: 500 }
    );
  }
};
