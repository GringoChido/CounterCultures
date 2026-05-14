/**
 * The eleven ways a Counter Cultures customer can pay Roger. Mapped to
 * their UI labels, currency, and a default fiscal posture used to seed
 * the toggle on the take-payment panel. Roger can override the posture
 * at the moment of payment — the same Netpay swipe runs Fiscal or
 * Non-fiscal depending on what he asks the customer at the counter.
 */

export type PaymentMethodId =
  | "stripe"
  | "cc-santander"
  | "cc-netpay"
  | "cash-mxn"
  | "cash-usd"
  | "check-mxn"
  | "check-usd"
  | "zelle-usd"
  | "wire-mxn"
  | "wire-usd";

export type FiscalPosture = "fiscal" | "non-fiscal";

export interface PaymentMethod {
  id: PaymentMethodId;
  label: string;
  detail: string;
  currency: "MXN" | "USD";
  /** Default fiscal posture — Roger can flip in the UI before recording. */
  defaultFiscal: FiscalPosture;
  /** Whether the same instrument can run either posture in store. */
  fiscalToggleable: boolean;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "stripe",
    label: "Stripe",
    detail: "Online · card",
    currency: "MXN",
    defaultFiscal: "fiscal",
    fiscalToggleable: false,
  },
  {
    id: "cc-santander",
    label: "CC · Santander",
    detail: "Fiscal · terminal",
    currency: "MXN",
    defaultFiscal: "fiscal",
    fiscalToggleable: false,
  },
  {
    id: "cc-netpay",
    label: "CC · Netpay",
    detail: "Toggleable · terminal",
    currency: "MXN",
    defaultFiscal: "non-fiscal",
    fiscalToggleable: true,
  },
  {
    id: "cash-mxn",
    label: "Cash · MXN",
    detail: "In showroom",
    currency: "MXN",
    defaultFiscal: "non-fiscal",
    fiscalToggleable: true,
  },
  {
    id: "cash-usd",
    label: "Cash · USD",
    detail: "In showroom",
    currency: "USD",
    defaultFiscal: "non-fiscal",
    fiscalToggleable: true,
  },
  {
    id: "check-mxn",
    label: "Check · MXN",
    detail: "Drop-off / mail",
    currency: "MXN",
    defaultFiscal: "fiscal",
    fiscalToggleable: true,
  },
  {
    id: "check-usd",
    label: "Check · USD",
    detail: "Drop-off / mail",
    currency: "USD",
    defaultFiscal: "non-fiscal",
    fiscalToggleable: true,
  },
  {
    id: "zelle-usd",
    label: "Zelle · USD",
    detail: "→ Wells Fargo",
    currency: "USD",
    defaultFiscal: "non-fiscal",
    fiscalToggleable: false,
  },
  {
    id: "wire-mxn",
    label: "Wire · MXN",
    detail: "National / intl",
    currency: "MXN",
    defaultFiscal: "fiscal",
    fiscalToggleable: false,
  },
  {
    id: "wire-usd",
    label: "Wire · USD",
    detail: "→ Wells Fargo",
    currency: "USD",
    defaultFiscal: "non-fiscal",
    fiscalToggleable: false,
  },
];

export const getPaymentMethod = (id: PaymentMethodId): PaymentMethod => {
  const m = PAYMENT_METHODS.find((p) => p.id === id);
  if (!m) throw new Error(`Unknown payment method: ${id}`);
  return m;
};
