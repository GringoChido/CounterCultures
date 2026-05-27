import { NextRequest, NextResponse } from "next/server";
import { isConfigured, authenticate, execute } from "@/app/lib/odoo/client";

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

  const recordId = Number(id);
  if (!Number.isFinite(recordId) || recordId <= 0) {
    return NextResponse.json(
      { error: "Invalid record id" },
      { status: 400 }
    );
  }

  try {
    const uid = await authenticate();

    // Odoo SaaS: API keys work for JSON-RPC but NOT for web session auth.
    // Render the PDF via the ir.actions.report model's RPC method instead
    // of the /report/pdf/ web controller.
    const result = await execute(
      uid,
      "ir.actions.report",
      "_render_qweb_pdf",
      [report, [recordId]]
    );

    // Odoo returns [base64_pdf_bytes, content_type_string]
    if (Array.isArray(result) && typeof result[0] === "string" && result[0].length > 0) {
      const pdfBuffer = Buffer.from(result[0], "base64");
      return new Response(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${report}-${id}.pdf"`,
          "Cache-Control": "no-store",
        },
      });
    }

    console.warn("[odoo-report] Unexpected RPC result shape:", typeof result, Array.isArray(result) ? result.length : "n/a");
    return NextResponse.json(
      { error: "odoo_pdf_unavailable", detail: "Unexpected response from Odoo report engine" },
      { status: 502 }
    );
  } catch (err) {
    console.error("[odoo-report] Error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "odoo_pdf_unavailable", detail: err instanceof Error ? err.message : "Unknown error" },
      { status: 502 }
    );
  }
};
