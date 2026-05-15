import { NextRequest, NextResponse } from "next/server";
import { requireFeature, FeatureDeniedError, getCurrentUser } from "@/app/lib/auth";
import {
  listActiveTaxRates,
  listTaxRates,
  createTaxRate,
  updateTaxRate,
  VALID_KINDS,
  VALID_APPLIES,
  type TaxKind,
  type TaxAppliesTo,
} from "@/app/lib/tax-rates";

export const GET = async (req: NextRequest): Promise<Response> => {
  try {
    await requireFeature("view_ap");
    const includeInactive = req.nextUrl.searchParams.get("all") === "true";
    const rates = includeInactive ? await listTaxRates() : await listActiveTaxRates();
    return NextResponse.json({ rates });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to fetch tax rates" }, { status: 500 });
  }
};

export const POST = async (req: NextRequest): Promise<Response> => {
  try {
    await requireFeature("view_ap");
    const user = await getCurrentUser();
    const body = await req.json();
    const { name, kind, rate, appliesTo } = body as {
      name: string;
      kind: string;
      rate: number;
      appliesTo: string;
    };

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!VALID_KINDS.includes(kind as TaxKind)) {
      return NextResponse.json({ error: `Invalid kind: ${kind}` }, { status: 400 });
    }
    if (typeof rate !== "number" || rate < 0 || rate > 100) {
      return NextResponse.json({ error: "Rate must be 0-100" }, { status: 400 });
    }
    if (!VALID_APPLIES.includes(appliesTo as TaxAppliesTo)) {
      return NextResponse.json({ error: `Invalid appliesTo: ${appliesTo}` }, { status: 400 });
    }

    const created = await createTaxRate(
      { name: name.trim(), kind: kind as TaxKind, rate, appliesTo: appliesTo as TaxAppliesTo },
      user?.email ?? "system"
    );
    return NextResponse.json({ rate: created }, { status: 201 });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to create tax rate" }, { status: 500 });
  }
};

export const PATCH = async (req: NextRequest): Promise<Response> => {
  try {
    await requireFeature("view_ap");
    const body = await req.json();
    const { id, ...updates } = body as {
      id: string;
      name?: string;
      kind?: string;
      rate?: number;
      appliesTo?: string;
      active?: boolean;
    };

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    if (updates.kind && !VALID_KINDS.includes(updates.kind as TaxKind)) {
      return NextResponse.json({ error: `Invalid kind: ${updates.kind}` }, { status: 400 });
    }
    if (updates.appliesTo && !VALID_APPLIES.includes(updates.appliesTo as TaxAppliesTo)) {
      return NextResponse.json({ error: `Invalid appliesTo: ${updates.appliesTo}` }, { status: 400 });
    }

    const ok = await updateTaxRate(id, {
      name: updates.name,
      kind: updates.kind as TaxKind | undefined,
      rate: updates.rate,
      appliesTo: updates.appliesTo as TaxAppliesTo | undefined,
      active: updates.active,
    });

    if (!ok) {
      return NextResponse.json({ error: "Tax rate not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to update tax rate" }, { status: 500 });
  }
};
