export interface FacturaResult {
  ok: true;
  uuid: string;
  pdfUrl: string;
  xmlUrl: string;
}

export interface FacturaError {
  ok: false;
  reason: string;
}

export interface FacturaPayload {
  rfc: string;
  razonSocial: string;
  cpFiscal: string;
  regimenFiscal: string;
  usoCfdi: string;
  email: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    currency: string;
  }>;
  cartSessionId: string;
}

export async function issueFactura(
  _payload: FacturaPayload
): Promise<FacturaResult | FacturaError> {
  const apiKey = process.env.FACTURAPI_KEY;
  if (!apiKey) {
    return { ok: false, reason: "factura_provider_not_configured" };
  }

  // Stub — real Facturapi integration ships in follow-up PR
  return { ok: false, reason: "factura_provider_not_configured" };
}
