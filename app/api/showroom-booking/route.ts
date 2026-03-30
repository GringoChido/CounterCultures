import { NextResponse } from "next/server";
import { submitShowroomBooking } from "@/app/lib/sheets";

export const POST = async (request: Request) => {
  try {
    const body = await request.json();

    const { name, email, phone, date, time, notes } = body as {
      name: string;
      email: string;
      phone: string;
      date: string;
      time: string;
      notes: string;
    };

    if (!email || !name) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    await submitShowroomBooking({
      name,
      email,
      phone: phone || "",
      date: date || "",
      time: time || "",
      notes: notes || "",
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to submit" },
      { status: 500 }
    );
  }
};
