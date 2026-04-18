import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { submitTradeApplication, submitLead } from "@/app/lib/sheets";
import { sendTradeConfirmation, notifyRoger, notifyWhatsApp } from "@/app/lib/email";

const schema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).optional().default(""),
  company: z.string().min(1).max(200),
  profession: z.string().max(100).optional().default(""),
  email: z.email(),
  phone: z.string().max(30).optional().default(""),
  website: z.string().max(200).optional().default(""),
  license: z.string().max(100).optional().default(""),
  message: z.string().max(5000).optional().default(""),
});

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Name, company, and a valid email are required" },
        { status: 400 }
      );
    }

    const { firstName, lastName, company, profession, email, phone, website, license, message } = result.data;
    const name = `${firstName} ${lastName}`.trim();

    await submitTradeApplication({
      name,
      email,
      phone,
      company,
      profession,
      license,
      website,
      message,
    });

    // Mirror into Leads so Roger checks one inbox, not three
    await submitLead({
      name,
      email,
      phone,
      source: "Trade Program",
      message: `${company}${profession ? ` · ${profession}` : ""}${website ? ` · ${website}` : ""}${license ? ` · License ${license}` : ""}${message ? `\n\n${message}` : ""}`,
    }).catch((err) => {
      console.error("[Trade] Leads mirror failed:", err);
    });

    void Promise.all([
      sendTradeConfirmation(email, firstName, company).catch(() => {}),
      notifyRoger(
        `New Trade Application: ${company}`,
        `Name: ${name}\nCompany: ${company}\nProfession: ${profession || "—"}\nEmail: ${email}\nPhone: ${phone || "—"}\nWebsite: ${website || "—"}\nLicense: ${license || "—"}\nMessage: ${message || "—"}`
      ).catch(() => {}),
      notifyWhatsApp(`New trade application: ${name} from ${company} (${email})`).catch(() => {}),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to submit" },
      { status: 500 }
    );
  }
};
