import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { submitNewsletter } from "@/app/lib/sheets";
import { sendNewsletterWelcome } from "@/app/lib/email";

const schema = z.object({
  email: z.email(),
});

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    const { email } = result.data;

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
