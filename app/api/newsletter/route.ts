import { NextResponse } from "next/server";
import { submitNewsletter } from "@/app/lib/sheets";
import { sendNewsletterWelcome } from "@/app/lib/email";

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const { email } = body as { email: string };

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    await submitNewsletter(email);

    sendNewsletterWelcome(email).catch(() => {});

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to subscribe" },
      { status: 500 }
    );
  }
};
