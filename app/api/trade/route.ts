import { NextResponse } from "next/server";
import { submitTradeApplication } from "@/app/lib/sheets";
import { sendTradeConfirmation, notifyRoger, notifyWhatsApp } from "@/app/lib/email";

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

    const name = `${firstName} ${lastName}`.trim();

    await submitTradeApplication({
      name,
      email,
      phone: phone || "",
      company,
      profession: profession || "",
      license: license || "",
      website: website || "",
      message: message || "",
    });

    Promise.all([
      sendTradeConfirmation(email, firstName, company).catch(() => {}),
      notifyRoger(
        `New Trade Application: ${company}`,
        `Name: ${name}\nCompany: ${company}\nProfession: ${profession || "—"}\nEmail: ${email}\nPhone: ${phone || "—"}\nWebsite: ${website || "—"}\nLicense: ${license || "—"}\nMessage: ${message || "—"}`
      ).catch(() => {}),
      notifyWhatsApp(`🏗️ New trade application: ${name} from ${company} (${email})`).catch(() => {}),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to submit" },
      { status: 500 }
    );
  }
};
