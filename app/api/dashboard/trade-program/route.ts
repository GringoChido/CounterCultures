import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  readSheet,
  appendRow,
  findRowIndex,
  updateRowByHeader,
  appendRowByHeader,
} from "@/app/lib/dashboard-sheets";
import { requireFeature, FeatureDeniedError } from "@/app/lib/auth";
import { setCustomerTrade, getAllCustomers } from "@/app/lib/customer-sheet";
import {
  sendTradeWelcomeEmail,
  sendTradeDeclineEmail,
} from "@/app/lib/email";

interface TradeAppRow extends Record<string, string> {
  id: string;
  company: string;
  contact_name: string;
  email: string;
  phone: string;
  license_number: string;
  status: string;
  created_at: string;
  business_type: string;
  website: string;
  expected_annual_volume: string;
  decided_at: string;
  decided_by: string;
  notes: string;
}

const PatchBody = z.object({
  id: z.string().min(1),
  action: z.enum(["approve", "reject"]),
  notes: z.string().optional(),
});

const generateWelcomeCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "CC-";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

export const GET = async () => {
  try {
    await requireFeature("view_trade");

    const [applications, customers] = await Promise.all([
      readSheet<TradeAppRow>("Trade_Applications"),
      getAllCustomers(),
    ]);

    const activeMembers = customers.filter(
      (c) => c.is_trade?.toUpperCase() === "TRUE"
    );
    const pendingApps = applications.filter(
      (a) => a.status === "pending" || !a.status
    );

    return NextResponse.json({
      applications,
      members: activeMembers.map((c) => ({
        email: c.email,
        name: c.name,
        company: "",
        tier: c.trade_tier || "default",
        joinedAt: c.created_at,
      })),
      kpis: {
        activeMembers: activeMembers.length,
        pendingApps: pendingApps.length,
      },
    });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("[Trade Program API] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch trade program data" },
      { status: 500 }
    );
  }
};

export const PATCH = async (request: NextRequest) => {
  try {
    const user = await requireFeature("view_trade");
    const body = PatchBody.parse(await request.json());

    const rowIdx = await findRowIndex("Trade_Applications", "id", body.id);
    if (rowIdx === null) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    const allApps = await readSheet<TradeAppRow>("Trade_Applications");
    const app = allApps[rowIdx];
    if (!app) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    if (body.action === "approve") {
      // 1. Update application status
      await updateRowByHeader("Trade_Applications", rowIdx, {
        status: "approved",
        decided_at: now,
        decided_by: user.email,
        ...(body.notes ? { notes: body.notes } : {}),
      });

      // 2. Set customer as trade member (upserts if customer doesn't exist)
      await setCustomerTrade(app.email, {
        isTrade: true,
        tier: "default",
      });

      // 3. Mint welcome code → Promo_Codes
      const welcomeCode = generateWelcomeCode();
      try {
        await appendRowByHeader("Promo_Codes", {
          code: welcomeCode,
          type: "f&f",
          discount_pct: "10",
          max_uses: "1",
          used_count: "0",
          issued_to: app.email,
          issued_at: now,
          expires_at: "",
          active: "TRUE",
          notes: `Trade welcome code for ${app.company}`,
        });
      } catch (err) {
        console.error(
          "[Trade Program] Promo_Codes write failed (tab may not exist yet):",
          err
        );
      }

      // 4. Send welcome email
      void sendTradeWelcomeEmail(
        app.email,
        app.contact_name,
        app.company,
        welcomeCode
      ).catch((err) =>
        console.error("[Trade Program] Welcome email failed:", err)
      );

      // 5. Activity log
      const logId = `TA-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      void appendRow("Activity_Log", [
        logId,
        now,
        user.email,
        "trade_application_approved",
        "trade_application",
        body.id,
        JSON.stringify({
          company: app.company,
          applicant_email: app.email,
          welcome_code: welcomeCode,
        }),
      ]).catch((err) =>
        console.error("[Trade Program] Activity_Log append failed:", err)
      );

      return NextResponse.json({
        success: true,
        action: "approved",
        welcomeCode,
      });
    }

    // Reject
    await updateRowByHeader("Trade_Applications", rowIdx, {
      status: "rejected",
      decided_at: now,
      decided_by: user.email,
      ...(body.notes ? { notes: body.notes } : {}),
    });

    void sendTradeDeclineEmail(
      app.email,
      app.contact_name,
      body.notes
    ).catch((err) =>
      console.error("[Trade Program] Decline email failed:", err)
    );

    const logId = `TA-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    void appendRow("Activity_Log", [
      logId,
      now,
      user.email,
      "trade_application_rejected",
      "trade_application",
      body.id,
      JSON.stringify({
        company: app.company,
        applicant_email: app.email,
        notes: body.notes ?? "",
      }),
    ]).catch((err) =>
      console.error("[Trade Program] Activity_Log append failed:", err)
    );

    return NextResponse.json({ success: true, action: "rejected" });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: err.issues },
        { status: 400 }
      );
    }
    console.error("[Trade Program API] PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update trade application" },
      { status: 500 }
    );
  }
};
