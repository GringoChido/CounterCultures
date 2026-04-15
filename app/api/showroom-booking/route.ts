import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { submitShowroomBooking } from "@/app/lib/sheets";
import { sendBookingConfirmation, notifyRoger, notifyWhatsApp } from "@/app/lib/email";

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.email(),
  phone: z.string().max(30).optional().default(""),
  date: z.string().max(20).optional().default(""),
  time: z.string().max(20).optional().default(""),
  notes: z.string().max(2000).optional().default(""),
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

    const { name, email, phone, date, time, notes } = result.data;

    await submitShowroomBooking({ name, email, phone, date, time, notes });

    void Promise.all([
      sendBookingConfirmation(email, name, date || "TBD", time || "TBD").catch(() => {}),
      notifyRoger(
        `New Showroom Booking: ${name}`,
        `Name: ${name}\nEmail: ${email}\nPhone: ${phone || "—"}\nDate: ${date || "—"}\nTime: ${time || "—"}\nNotes: ${notes || "—"}`
      ).catch(() => {}),
      notifyWhatsApp(`New showroom booking: ${name} (${email}) — ${date || "TBD"} at ${time || "TBD"}`).catch(() => {}),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to submit" },
      { status: 500 }
    );
  }
};
