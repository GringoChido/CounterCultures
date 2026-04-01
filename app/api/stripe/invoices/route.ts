import { NextRequest, NextResponse } from "next/server";
import { getStripe, isConfigured } from "@/app/lib/stripe";

export const GET = async () => {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  try {
    const stripe = getStripe();
    const invoices = await stripe.invoices.list({ limit: 25 });

    const formatted = invoices.data.map((inv) => ({
      id: inv.id,
      number: inv.number,
      customerName: inv.customer_name,
      customerEmail: inv.customer_email,
      status: inv.status,
      amountDue: inv.amount_due,
      amountPaid: inv.amount_paid,
      currency: inv.currency,
      created: inv.created,
      dueDate: inv.due_date,
      hostedInvoiceUrl: inv.hosted_invoice_url,
      pdfUrl: inv.invoice_pdf,
    }));

    return NextResponse.json({ invoices: formatted });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch invoices" },
      { status: 500 }
    );
  }
};

export const POST = async (req: NextRequest) => {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  try {
    const { customerId, items, description } = await req.json();
    const stripe = getStripe();

    const invoice = await stripe.invoices.create({
      customer: customerId,
      description,
      auto_advance: false,
    });

    for (const item of items as { description: string; amount: number; currency?: string }[]) {
      await stripe.invoiceItems.create({
        customer: customerId,
        invoice: invoice.id,
        description: item.description,
        amount: Math.round(item.amount * 100),
        currency: item.currency ?? "mxn",
      });
    }

    return NextResponse.json({ invoice: { id: invoice.id, status: invoice.status } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create invoice" },
      { status: 500 }
    );
  }
};
