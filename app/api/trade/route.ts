import { NextResponse } from "next/server";
import { submitTradeApplication } from "@/app/lib/sheets";

export const POST = async (request: Request) => {
  try {
    const body = await request.json();

    const { firstName, lastName, company, profession, email, phone, website, license, message } =
      body as {
        firstName: string;
        lastName: string;
        company: string;
        profession: string;
        email: string;
        phone: string;
        website: string;
        license: string;
        message: string;
      };

    if (!email || !firstName || !company) {
      return NextResponse.json(
        { error: "Name, company, and email are required" },
        { status: 400 }
      );
    }

    await submitTradeApplication({
      name: `${firstName} ${lastName}`.trim(),
      email,
      phone: phone || "",
      company,
      profession: profession || "",
      license: license || "",
      website: website || "",
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
