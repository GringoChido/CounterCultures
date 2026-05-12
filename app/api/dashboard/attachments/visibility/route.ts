import { NextRequest, NextResponse } from "next/server";
import { requireFeature, FeatureDeniedError } from "@/app/lib/auth";
import { getOverridesFor, setOverride, hashFilename } from "@/app/lib/attachment-overrides-sheet";
import { appendRow } from "@/app/lib/dashboard-sheets";

export const GET = async (req: NextRequest): Promise<Response> => {
  try {
    await requireFeature("view_invoices");
    const resModel = req.nextUrl.searchParams.get("resModel");
    const resId = req.nextUrl.searchParams.get("resId");
    if (!resModel || !resId) {
      return NextResponse.json(
        { error: "resModel and resId are required" },
        { status: 400 }
      );
    }
    const map = await getOverridesFor(resModel, resId);
    const overrides: Record<string, "user-show" | "user-hide"> = {};
    for (const [k, v] of map) overrides[k] = v;
    return NextResponse.json({ overrides });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("[attachments/visibility] GET error:", err);
    return NextResponse.json({ error: "Failed to fetch overrides" }, { status: 500 });
  }
};

export const POST = async (req: NextRequest): Promise<Response> => {
  try {
    const user = await requireFeature("view_invoices");
    const body = await req.json();
    const { resModel, resId, filename, visibility } = body as {
      resModel?: string;
      resId?: string;
      filename?: string;
      visibility?: string;
    };
    if (!resModel || !resId || !filename || !visibility) {
      return NextResponse.json(
        { error: "resModel, resId, filename, and visibility are required" },
        { status: 400 }
      );
    }
    if (visibility !== "user-show" && visibility !== "user-hide") {
      return NextResponse.json(
        { error: "visibility must be user-show or user-hide" },
        { status: 400 }
      );
    }
    await setOverride(resModel, resId, filename, visibility, user.email);

    const logId = `EA-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    appendRow("Activity_Log", [
      logId,
      new Date().toISOString(),
      user.email,
      "attachment.visibility.toggle",
      resModel,
      resId,
      JSON.stringify({ filename, filename_hash: hashFilename(filename), visibility }),
    ]).catch((err) => console.error("[attachments/visibility] Activity_Log append failed:", err));

    return NextResponse.json({ ok: true, filename_hash: hashFilename(filename), visibility });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("[attachments/visibility] POST error:", err);
    return NextResponse.json({ error: "Failed to save override" }, { status: 500 });
  }
};
