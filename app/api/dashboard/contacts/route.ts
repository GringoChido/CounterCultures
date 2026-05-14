import { NextRequest, NextResponse } from "next/server";
import {
  readSheet,
  findRowIndex,
  updateRowByHeader,
} from "@/app/lib/dashboard-sheets";
import { requireFeature, FeatureDeniedError } from "@/app/lib/auth";
import {
  parseClassifications,
  serializeClassifications,
  CONTACT_CLASSIFICATIONS,
  type ContactClassification,
} from "@/app/lib/contact-classifications";

type ContactRow = Record<string, string>;

interface ContactResult {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  type: string;
  tags: string;
  createdAt: string;
  notes: string;
  classifications: ContactClassification[];
}

const toResult = (r: ContactRow): ContactResult => ({
  id: r.id ?? "",
  name: r.name ?? "",
  email: r.email ?? "",
  phone: r.phone ?? "",
  company: r.company ?? "",
  type: r.type ?? "",
  tags: r.tags ?? "",
  createdAt: r.createdAt ?? "",
  notes: r.notes ?? "",
  classifications: parseClassifications(r.classifications),
});

export const GET = async (req: NextRequest): Promise<Response> => {
  try {
    await requireFeature("view_contacts");
    const rows = await readSheet<ContactRow>("Contacts");

    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.toLowerCase() ?? "";
    const classFilter = url.searchParams.get("classifications")?.split(",") ?? [];

    let contacts = rows.map(toResult);

    if (q) {
      contacts = contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.company.toLowerCase().includes(q)
      );
    }

    if (classFilter.length > 0 && classFilter[0] !== "") {
      contacts = contacts.filter((c) =>
        classFilter.some((f) => c.classifications.includes(f as ContactClassification))
      );
    }

    return NextResponse.json({ contacts, total: contacts.length });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json(
        { error: "Forbidden", feature: err.feature },
        { status: 403 }
      );
    }
    const msg = err instanceof Error ? err.message : "contacts_failed";
    console.error("[/api/dashboard/contacts]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
};

export const PATCH = async (req: NextRequest): Promise<Response> => {
  try {
    await requireFeature("view_contacts");
    const body = await req.json();
    const { id, classifications } = body as {
      id: string;
      classifications: string[];
    };

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const invalid = classifications?.filter(
      (c: string) => !CONTACT_CLASSIFICATIONS.includes(c as ContactClassification)
    );
    if (invalid?.length) {
      return NextResponse.json(
        { error: `Invalid classifications: ${invalid.join(", ")}` },
        { status: 400 }
      );
    }

    const rowIndex = await findRowIndex("Contacts", "id", id);
    if (rowIndex === null) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const serialized = serializeClassifications(
      (classifications ?? []) as ContactClassification[]
    );
    await updateRowByHeader("Contacts", rowIndex, { classifications: serialized });

    return NextResponse.json({ ok: true, classifications });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json(
        { error: "Forbidden", feature: err.feature },
        { status: 403 }
      );
    }
    const msg = err instanceof Error ? err.message : "contact_update_failed";
    console.error("[/api/dashboard/contacts PATCH]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
};
