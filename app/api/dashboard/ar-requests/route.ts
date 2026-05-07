import { NextResponse, type NextRequest } from "next/server";
import {
  listFacturaRequests,
  createFacturaRequest,
  updateFacturaRequestState,
  attachFacturaFiles,
  getARSummary,
  listCreditNotes,
  createCreditNote,
  buildDepositNotes,
  type ARFacturaRequest,
  type FacturaRequestState,
  type FacturaRequestSource,
  type FacturaCompany,
  type FacturaRecipientType,
  type DepositType,
  type CreditNoteReason,
  type CreditNoteApplication,
} from "@/app/lib/ar-factura";

type StateFilter = "all" | FacturaRequestState;
type CompanyFilter = "all" | FacturaCompany;

export const GET = async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const view = sp.get("view") ?? "requests";

  try {
    if (view === "summary") {
      const summary = await getARSummary();
      return NextResponse.json({ summary });
    }

    if (view === "credit_notes") {
      const notes = await listCreditNotes();
      return NextResponse.json({ creditNotes: notes, total: notes.length });
    }

    const stateFilter = (sp.get("state") ?? "all") as StateFilter;
    const companyFilter = (sp.get("company") ?? "all") as CompanyFilter;
    const q = (sp.get("q") ?? "").toLowerCase();
    const depositOnly = sp.get("depositOnly") === "true";

    let requests = await listFacturaRequests();

    if (stateFilter !== "all") {
      requests = requests.filter((r) => r.state === stateFilter);
    }
    if (companyFilter !== "all") {
      requests = requests.filter((r) => r.company === companyFilter);
    }
    if (depositOnly) {
      requests = requests.filter(
        (r) => r.depositType === "deposit" || r.depositType === "finiquito"
      );
    }
    if (q) {
      requests = requests.filter(
        (r) =>
          r.requestName.toLowerCase().includes(q) ||
          r.customerName.toLowerCase().includes(q) ||
          r.customerRfc.toLowerCase().includes(q) ||
          r.facturaFolio.toLowerCase().includes(q) ||
          r.orderReference.toLowerCase().includes(q)
      );
    }

    const sort = sp.get("sort") ?? "date_desc";
    requests.sort((a, b) => {
      if (sort === "date_asc") return a.requestedAt.localeCompare(b.requestedAt);
      if (sort === "amount_desc") return b.amount - a.amount;
      if (sort === "customer") return a.customerName.localeCompare(b.customerName);
      return b.requestedAt.localeCompare(a.requestedAt);
    });

    const summary = await getARSummary();

    return NextResponse.json({
      requests,
      total: requests.length,
      summary,
    });
  } catch (err) {
    console.error("[ar-requests API] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch AR data" },
      { status: 500 }
    );
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const action = body.action as string;

    if (action === "create_request") {
      const now = new Date().toISOString();
      const depositType = (body.depositType ?? "full") as DepositType;
      const depositPercent = body.depositPercent ?? (depositType === "deposit" ? 70 : 100);
      const facturaNotes = body.facturaNotes ??
        buildDepositNotes({
          depositType,
          depositPercent,
          linkedFolio: body.linkedFolio,
        });

      const result = await createFacturaRequest({
        state: "pending",
        source: (body.source ?? "manual") as FacturaRequestSource,
        company: (body.company ?? "cc") as FacturaCompany,
        requestName: body.requestName ?? "",
        customerName: body.customerName ?? "",
        customerRfc: body.customerRfc ?? "",
        recipientType: (body.recipientType ?? "general_public") as FacturaRecipientType,
        amount: parseFloat(body.amount) || 0,
        currency: body.currency ?? "MXN",
        bank: body.bank ?? "",
        paymentMethod: body.paymentMethod ?? "",
        paymentDate: body.paymentDate ?? "",
        depositType,
        depositPercent,
        linkedFolio: body.linkedFolio ?? "",
        facturaFolio: "",
        facturaNotes,
        pdfDriveUrl: "",
        xmlDriveUrl: "",
        solucionFactibleId: "",
        requestedBy: body.requestedBy ?? "",
        requestedAt: now,
        issuedAt: "",
        issuedBy: "",
        orderReference: body.orderReference ?? "",
        invoiceId: body.invoiceId ?? "",
        notes: body.notes ?? "",
      });
      return NextResponse.json({ request: result });
    }

    if (action === "update_state") {
      const result = await updateFacturaRequestState(
        body.id,
        body.state as FacturaRequestState,
        body.updates
      );
      if (!result) {
        return NextResponse.json({ error: "Request not found" }, { status: 404 });
      }
      return NextResponse.json({ request: result });
    }

    if (action === "attach_files") {
      const result = await attachFacturaFiles(
        body.id,
        body.pdfUrl,
        body.xmlUrl,
        body.folio
      );
      if (!result) {
        return NextResponse.json({ error: "Request not found" }, { status: 404 });
      }
      return NextResponse.json({ request: result });
    }

    if (action === "create_credit_note") {
      const now = new Date().toISOString();
      const result = await createCreditNote({
        originalInvoiceId: body.originalInvoiceId ?? "",
        originalFolio: body.originalFolio ?? "",
        customerName: body.customerName ?? "",
        customerRfc: body.customerRfc ?? "",
        company: (body.company ?? "cc") as FacturaCompany,
        amount: parseFloat(body.amount) || 0,
        currency: body.currency ?? "MXN",
        reason: (body.reason ?? "other") as CreditNoteReason,
        application: (body.application ?? "pending") as CreditNoteApplication,
        appliedToInvoiceId: body.appliedToInvoiceId ?? "",
        refundReference: body.refundReference ?? "",
        substituteDetails: body.substituteDetails ?? "",
        notes: body.notes ?? "",
        createdAt: now,
        createdBy: body.createdBy ?? "",
        resolvedAt: "",
      });
      return NextResponse.json({ creditNote: result });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[ar-requests API] POST error:", err);
    return NextResponse.json(
      { error: "Failed to process AR request" },
      { status: 500 }
    );
  }
};
