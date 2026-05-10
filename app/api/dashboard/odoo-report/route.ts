import { NextRequest, NextResponse } from "next/server";
import { isConfigured, searchRead } from "@/app/lib/odoo/client";

const ODOO_URL = process.env.ODOO_URL ?? "";
const ODOO_DB = process.env.ODOO_DB ?? "";
const ODOO_USERNAME = process.env.ODOO_USERNAME ?? "";
const ODOO_API_KEY = process.env.ODOO_API_KEY ?? "";

const ALLOWED_REPORTS = new Set([
  "sale.report_saleorder",
  "purchase.report_purchaseorder",
  "account.report_invoice",
  "account.report_invoice_with_payments",
]);

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

  try {
    // Authenticate via web login to get a session cookie for the report URL
    const loginRes = await fetch(`${ODOO_URL}/web/session/authenticate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        params: {
          db: ODOO_DB,
          login: ODOO_USERNAME,
          password: ODOO_API_KEY,
        },
      }),
    });

    const nativeCookies = loginRes.headers.getSetCookie?.() ?? [];
    const fallbackCookie = loginRes.headers.get("set-cookie");
    const cookies = nativeCookies.length > 0
      ? nativeCookies
      : fallbackCookie
        ? fallbackCookie.split(/,(?=\s*\w+=)/)
        : [];
    const sessionCookie = cookies
      .map((c) => c.split(";")[0].trim())
      .find((c) => c.startsWith("session_id="));

    if (!sessionCookie) {
      // Fallback: try RPC-based report rendering
      return await renderViaRpc(report, id);
    }

    // Fetch the PDF report using the session cookie
    const pdfRes = await fetch(
      `${ODOO_URL}/report/pdf/${report}/${id}`,
      {
        headers: { Cookie: sessionCookie },
        redirect: "follow",
      }
    );

    const ct = pdfRes.headers.get("content-type") ?? "";
    if (!pdfRes.ok || !ct.toLowerCase().startsWith("application/pdf")) {
      return await renderViaRpc(report, id);
    }

    const pdfBuffer = await pdfRes.arrayBuffer();
    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${report}-${id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[odoo-report] Error:", err);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
};

const renderViaRpc = async (
  report: string,
  id: string
): Promise<Response> => {
  try {
    // Look up the report action by name
    const reports = (await searchRead(
      "ir.actions.report",
      [["report_name", "=", report]],
      ["id"]
    )) as { id: number }[];

    if (!reports.length) {
      return NextResponse.json(
        { error: `Report '${report}' not found in Odoo` },
        { status: 404 }
      );
    }

    // Use the report controller endpoint with basic auth
    const credentials = Buffer.from(
      `${ODOO_USERNAME}:${ODOO_API_KEY}`
    ).toString("base64");
    const pdfRes = await fetch(
      `${ODOO_URL}/report/pdf/${report}/${id}`,
      {
        headers: { Authorization: `Basic ${credentials}` },
        redirect: "follow",
      }
    );

    const rpcCt = pdfRes.headers.get("content-type") ?? "";
    if (!pdfRes.ok || !rpcCt.toLowerCase().startsWith("application/pdf")) {
      const preview = await pdfRes.text().catch(() => "");
      return NextResponse.json(
        {
          error: "odoo_pdf_unavailable",
          status: pdfRes.status,
          contentType: rpcCt,
          preview: preview.slice(0, 400),
        },
        { status: 502 }
      );
    }

    const pdfBuffer = await pdfRes.arrayBuffer();
    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${report}-${id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[odoo-report] RPC fallback error:", err);
    return NextResponse.json(
      { error: "Report generation failed" },
      { status: 500 }
    );
  }
};
