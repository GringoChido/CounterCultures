import type {
  QuoteData,
  LineItem,
} from "@/app/(dashboard)/components/templates/quote-template";
import { formatDate } from "./format-date";
import manifest from "./product-image-manifest.json";

const verifiedImages = new Set<string>(manifest as string[]);

interface OrderRow {
  id: string;
  name: string;
  partnerName: string;
  currency: string;
  dateOrder: string;
  validityDate: string;
  amountUntaxed: number;
  amountTax: number;
  amountTotal: number;
  rawState: string;
}

interface OrderLine {
  name: string;
  product_id: string;
  product_id_id: string;
  product_uom_qty: string;
  price_unit: string;
  discount: string;
  price_subtotal: string;
}

interface RawOrder {
  [key: string]: string;
  note: string;
}

export const buildQuoteDataFromOrder = (
  order: OrderRow,
  rawOrder: RawOrder,
  lines: OrderLine[],
): QuoteData => {
  const productItems: LineItem[] = [];

  for (const l of lines) {
    const qty = parseFloat(l.product_uom_qty) || 0;
    const price = parseFloat(l.price_unit) || 0;
    const productId = l.product_id_id;

    if (qty === 0 && price === 0 && !productId) {
      const text = (l.product_id || l.name || "").trim();
      if (text && productItems.length > 0) {
        const prev = productItems[productItems.length - 1];
        prev.description = prev.description
          ? `${prev.description}\n${text}`
          : text;
      }
      continue;
    }

    const image =
      productId && verifiedImages.has(productId)
        ? `/products/odoo/${productId}.jpg`
        : undefined;

    productItems.push({
      product: l.product_id || l.name,
      sku: "",
      quantity: qty,
      unitPrice: price,
      image,
    });
  }

  return {
    docNumber: order.name,
    date: formatDate(order.dateOrder),
    validUntil: order.validityDate ? formatDate(order.validityDate) : "—",
    customerName: order.partnerName,
    customerCompany: "",
    customerEmail: "",
    items: productItems,
    discount: 0,
    discountType: "percent",
    paymentTerms: "",
    deliveryEstimate: "",
    notes: "",
    locale: "en",
    currency:
      order.currency === "MXN" || order.currency === "USD"
        ? order.currency
        : "USD",
    amountUntaxed: order.amountUntaxed,
    amountTax: order.amountTax,
    amountTotal: order.amountTotal,
  };
};
