import { NextRequest, NextResponse } from "next/server";
import { isConfigured } from "@/app/lib/odoo/client";

const ALLOWED_REPORTS = new Set([
  "sale.report_saleorder",
  "purchase.report_purchaseorder",
  "account.report_invoice",
  "account.report_invoice_with_payments",
]);

const ODOO_URL = process.env.ODOO_URL ?? "";
const ODOO_DB = process.env.ODOO_DB ?? "";
const ODOO_LOGIN = process.env.ODOO_USERNAME ?? "";
const ODOO_API_KEY = process.env.ODOO_API_KEY ?? "";
const ODOO_PASSWORD = process.env.ODOO_PASSWORD ?? "";

export const GET = async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const report = searchParams.get("report");
  const id = searchParams.get("id");

  if (!report || !id) {
    return NextResponse.json(
      { error: "report and id are required" },
      { status: 400 }
    );
  }

  if (!ALLOWED_REPORTS.has(report)) {
    return NextResponse.json(
      { error: "Report not allowed" },
      { status: 403 }
    );
  }

  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Odoo not configured" },
      { status: 503 }
    );
  }

  const recordId = Number(id);
  if (!Number.isFinite(recordId) || recordId <= 0) {
    return NextResponse.json(
      { error: "Invalid record id" },
      { status: 400 }
    );
  }

  const fail = (detail: string) =>
    NextResponse.json({ error: "odoo_pdf_unavailable", detail }, { status: 502 });

  try {
    const tryAuth = async (password: string) => {
      const r = await fetch(`${ODOO_URL}/web/session/authenticate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          params: { db: ODOO_DB, login: ODOO_LOGIN, password },
        }),
      });
      const j = await r.json().catch(() => null);
      return {
        uid: j?.result?.uid,
        setCookies: r.headers.getSetCookie?.() ?? [],
      };
    };

    let { uid, setCookies } = await tryAuth(ODOO_API_KEY);
    if (!uid && ODOO_PASSWORD) {
      ({ uid, setCookies } = await tryAuth(ODOO_PASSWORD));
    }
    if (!uid) {
      console.warn("[odoo-report] web-session auth returned no uid");
      return fail("web session auth failed");
    }

    const sessionCookie = setCookies
      .find((c) => c.startsWith("session_id="))
      ?.split(";")[0];
    if (!sessionCookie) return fail("no session_id cookie returned");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25_000);
    let pdfRes: Response;
    try {
      pdfRes = await fetch(
        `${ODOO_URL}/report/pdf/${report}/${recordId}`,
        {
          headers: { Cookie: sessionCookie },
          signal: controller.signal,
        }
      );
    } finally {
      clearTimeout(timer);
    }

    const ct = pdfRes.headers.get("content-type") ?? "";
    if (!pdfRes.ok || !ct.includes("application/pdf")) {
      console.warn("[odoo-report] report fetch not a pdf:", pdfRes.status, ct);
      return fail(`report fetch ${pdfRes.status} ${ct || "no content-type"}`);
    }

    const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());
    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${report}-${id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error(
      "[odoo-report] Error:",
      err instanceof Error ? err.message : err
    );
    return fail(err instanceof Error ? err.message : "Unknown error");
  }
};
