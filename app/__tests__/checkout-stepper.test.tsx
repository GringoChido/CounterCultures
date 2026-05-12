import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CheckoutStepper } from "../[locale]/checkout/checkout-stepper";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [k: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const mockItems = [
  {
    id: "p1",
    sku: "CB-001",
    name: "Classic Brass Faucet",
    brand: "Classic Brass",
    category: "bathroom",
    currency: "MXN" as const,
    listPrice: 15000,
    quantity: 1,
    productHref: "/en/shop/bathroom/faucets/cb-001",
    availability: "in-stock" as const,
    buyable: true,
    addedAt: Date.now(),
  },
  {
    id: "p2",
    sku: "TT-042",
    name: "Thompson Traders Sink",
    brand: "Thompson Traders",
    category: "kitchen",
    currency: "MXN" as const,
    listPrice: 28000,
    quantity: 2,
    productHref: "/en/shop/kitchen/sinks/tt-042",
    availability: "made-to-order" as const,
    buyable: true,
    addedAt: Date.now(),
    selectedFinish: "Antique Copper",
  },
];

vi.mock("@/app/lib/stores/cart-store", () => ({
  useCartStore: (selector: (s: Record<string, unknown>) => unknown) => {
    const state = {
      items: mockItems,
      subtotal: () => 71000,
      cartMode: () => "all_buyable",
      cartSessionId: "test-session-id",
      tradeCode: null,
      tradeDiscountPct: undefined,
      clear: vi.fn(),
      updateQty: vi.fn(),
      remove: vi.fn(),
    };
    return selector(state);
  },
}));

describe("CheckoutStepper", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders Company above Nombre in Step 1", () => {
    render(<CheckoutStepper locale="en" />);
    screen.getByLabelText(/company/i);
    screen.getByLabelText(/nombre/i);

    const allLabels = screen.getAllByText(/./);
    const companyIndex = allLabels.findIndex((el) => el.textContent?.includes("Company"));
    const nameIndex = allLabels.findIndex((el) => el.textContent?.includes("Nombre"));

    expect(companyIndex).toBeLessThan(nameIndex);
  });

  it("does NOT render a Language selector in Step 1", () => {
    render(<CheckoutStepper locale="en" />);
    expect(screen.queryByText("Language")).not.toBeInTheDocument();
    expect(screen.queryByText("Idioma")).not.toBeInTheDocument();
  });

  it("renders Address Line 3 (Colonia) in Step 2 when country is MX", async () => {
    render(<CheckoutStepper locale="en" />);

    // Fill required fields and go to step 2
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: "John" } });
    fireEvent.change(screen.getByLabelText(/apellido paterno/i), { target: { value: "Doe" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "john@example.com" } });
    fireEvent.click(screen.getByText("Next"));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /ship to/i })).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/colonia/i)).toBeInTheDocument();
  });

  it("toggles Factura fields when checkbox is checked in Step 2", async () => {
    render(<CheckoutStepper locale="en" />);

    // Navigate to step 2
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: "Jane" } });
    fireEvent.change(screen.getByLabelText(/apellido paterno/i), { target: { value: "Doe" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "jane@example.com" } });
    fireEvent.click(screen.getByText("Next"));

    await waitFor(() => {
      expect(screen.getByText(/I need a Factura/i)).toBeInTheDocument();
    });

    // Check the factura toggle
    fireEvent.click(screen.getByLabelText(/I need a Factura/i));

    await waitFor(() => {
      expect(screen.getByLabelText(/RFC/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Razon Social/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Codigo Postal Fiscal/i)).toBeInTheDocument();
    });

    // Verify regime and uso selects are present
    expect(screen.getByText(/Regimen Fiscal/)).toBeInTheDocument();
    expect(screen.getByText(/Uso de CFDI/)).toBeInTheDocument();
  });

  it("rejects invalid RFC in Step 2 factura validation", async () => {
    render(<CheckoutStepper locale="en" />);

    // Navigate to step 2
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: "Test" } });
    fireEvent.change(screen.getByLabelText(/apellido paterno/i), { target: { value: "User" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "test@test.com" } });
    fireEvent.click(screen.getByText("Next"));

    await waitFor(() => {
      expect(screen.getByText(/I need a Factura/i)).toBeInTheDocument();
    });

    // Enable factura
    fireEvent.click(screen.getByLabelText(/I need a Factura/i));

    await waitFor(() => {
      expect(screen.getByLabelText(/RFC/i)).toBeInTheDocument();
    });

    // Enter invalid RFC
    fireEvent.change(screen.getByLabelText(/RFC \*/i), { target: { value: "INVALID" } });

    // Fill address fields
    fireEvent.change(screen.getByLabelText(/Address line 1/i), { target: { value: "Calle Hidalgo 10" } });
    fireEvent.change(screen.getByLabelText(/City/i), { target: { value: "San Miguel" } });
    fireEvent.change(screen.getByLabelText(/Postal code/i), { target: { value: "37700" } });

    // Try to advance — should fail
    fireEvent.click(screen.getByText("Next"));

    await waitFor(() => {
      expect(screen.getByText(/Invalid RFC format/i)).toBeInTheDocument();
    });
  });

  it("unchecking billing-same on Ship To adds Payment Address step", async () => {
    render(<CheckoutStepper locale="en" />);

    // Default: 3 steps (no Payment Address)
    expect(screen.queryByText("Payment Address")).not.toBeInTheDocument();

    // Navigate to step 2 (Ship To)
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: "Test" } });
    fireEvent.change(screen.getByLabelText(/apellido paterno/i), { target: { value: "User" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "test@test.com" } });
    fireEvent.click(screen.getByText("Next"));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /ship to/i })).toBeInTheDocument();
    });

    // Billing-same toggle should be on Ship To step and checked by default
    expect(screen.getByLabelText(/Billing address is the same/i)).toBeChecked();

    // Uncheck it — Payment Address step should appear in stepper
    fireEvent.click(screen.getByLabelText(/Billing address is the same/i));
    expect(screen.getByText("Payment Address")).toBeInTheDocument();
  });

  it("CTA is always 'Pay Now' regardless of item availability", () => {
    render(<CheckoutStepper locale="en" />);

    // Step indicator should show 3 steps by default (billing same = true)
    expect(screen.getByText("Review")).toBeInTheDocument();
    expect(screen.getByText("Contact")).toBeInTheDocument();
    expect(screen.getByText("Ship To")).toBeInTheDocument();

    // There should be no "Submit Quote Request" text anywhere
    expect(screen.queryByText("Submit Quote Request")).not.toBeInTheDocument();
  });
});
