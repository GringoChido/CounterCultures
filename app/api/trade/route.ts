import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { submitTradeApplication, submitLead } from "@/app/lib/sheets";
import { sendTradeConfirmation, notifyRoger, notifyWhatsApp } from "@/app/lib/email";
import { uploadFile, findOrCreateFolder } from "@/app/lib/google-drive";

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

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const POST = async (request: Request) => {
  try {
    const formData = await request.formData();

    const fields: Record<string, string> = {};
    for (const key of ["firstName", "lastName", "company", "profession", "email", "phone", "website", "license", "message"]) {
      const val = formData.get(key);
      if (typeof val === "string") fields[key] = val;
    }

    const result = schema.safeParse(fields);
    if (!result.success) {
      return NextResponse.json(
        { error: "Name, company, and a valid email are required" },
        { status: 400 }
      );
    }

    const { firstName, lastName, company, profession, email, phone, website, license, message } = result.data;
    const name = `${firstName} ${lastName}`.trim();

    // Upload constancia fiscal to Drive if provided
    let constanciaLink = "";
    const file = formData.get("constancia");
    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "File too large (max 10 MB)" },
          { status: 400 }
        );
      }
      try {
        const folder = await findOrCreateFolder("Trade Applications");
        const buf = Buffer.from(await file.arrayBuffer());
        const ext = file.name.split(".").pop() ?? "pdf";
        const driveFile = await uploadFile(
          `${company} — Constancia Fiscal.${ext}`,
          file.type || "application/pdf",
          buf,
          folder.id
        );
        constanciaLink = driveFile.webViewLink ?? "";
      } catch (err) {
        console.error("[Trade] Drive upload failed:", err);
      }
    }

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

    await submitLead({
      name,
      email,
      phone,
      source: "Trade Program",
      message: `${company}${profession ? ` · ${profession}` : ""}${website ? ` · ${website}` : ""}${license ? ` · License ${license}` : ""}${constanciaLink ? `\nConstancia: ${constanciaLink}` : ""}${message ? `\n\n${message}` : ""}`,
    }).catch((err) => {
      console.error("[Trade] Leads mirror failed:", err);
    });

    void Promise.all([
      sendTradeConfirmation(email, firstName, company).catch(() => {}),
      notifyRoger(
        `New Trade Application: ${company}`,
        `Name: ${name}\nCompany: ${company}\nProfession: ${profession || "—"}\nEmail: ${email}\nPhone: ${phone || "—"}\nWebsite: ${website || "—"}\nLicense: ${license || "—"}${constanciaLink ? `\nConstancia: ${constanciaLink}` : ""}\nMessage: ${message || "—"}`
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
