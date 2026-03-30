import { NextResponse } from "next/server";
import { submitLead } from "@/app/lib/sheets";

export const POST = async (request: Request) => {
  try {
    const body = await request.json();

    const { firstName, lastName, email, phone, type, message } = body as {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      type: string;
      message: string;
    };

    if (!email || !firstName) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    await submitLead({
      name: `${firstName} ${lastName}`.trim(),
      email,
      phone: phone || "",
      source: `contact-form:${type || "general"}`,
      message: message || "",
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to submit" },
      { status: 500 }
    );
  }
};
