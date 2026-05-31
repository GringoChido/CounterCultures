// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { BrandCount } from "@/app/lib/products-full";

const pushMock = vi.fn();

vi.mock("@/app/i18n/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
  Link: ({ children, href, ...props }: { children: React.ReactNode; href: string; [k: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, priority, ...rest } = props;
    return <img data-fill={fill ? "true" : undefined} {...rest} />;
  },
}));

// The visual-search-modal pulls in cart store, dompurify, and various UI deps —
// we stub it because the typeahead tests don't care about its internals.
vi.mock("@/app/components/visual-search-modal", () => ({
  VisualSearchModal: ({ open }: { open: boolean }) =>
    open ? <div data-testid="visual-search-modal-open" /> : null,
}));

import { CatalogSearchPanel } from "./catalog-search-panel";

const sampleBrandCounts: BrandCount[] = [
  { brand: "Brizo", count: 7913 },
  { brand: "California Faucets", count: 3759 },
  { brand: "Kohler", count: 256 },
  { brand: "TOTO", count: 1284 },
];

const sampleApiResponse = {
  items: [
    {
      id: "p-1",
      name: "Litze Single Hole Lavatory Faucet",
      sku: "BRI-65020LF-MB",
      brand: "Brizo",
      category: "bathroom",
      listPrice: 1029,
      currency: "MXN",
      uom: "Units",
      active: true,
      saleOk: true,
      hasImage: false,
      slug: "litze-single-hole-bri-65020lf-mb",
    },
    {
      id: "p-2",
      name: "Levoir Widespread",
      sku: "BRI-65336LF-PC",
      brand: "Brizo",
      category: "bathroom",
      listPrice: 1499,
      currency: "MXN",
      uom: "Units",
      active: true,
      saleOk: true,
      hasImage: false,
      slug: "levoir-widespread-bri-65336lf-pc",
    },
  ],
  total: 2,
  offset: 0,
  limit: 8,
  elapsedMs: 30,
  cacheAgeMs: 0,
};

const flushMicrotasks = () => new Promise((resolve) => setTimeout(resolve, 0));

const stubFetch = (response: unknown = sampleApiResponse) => {
  const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => ({
    ok: true,
    json: async () => response,
  }));
  (global as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
};

describe("CatalogSearchPanel — typeahead behavior", () => {
  beforeEach(() => {
    vi.useRealTimers();
    pushMock.mockReset();
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders the search input and finish swatches", () => {
    render(<CatalogSearchPanel locale="en" brandCounts={sampleBrandCounts} />);
    expect(
      screen.getByPlaceholderText(/search by brand, model, or name/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /matte black/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /chrome/i })).toBeInTheDocument();
  });

  it("typing 2+ characters triggers a /api/products/search fetch", async () => {
    const fetchMock = stubFetch();
    render(<CatalogSearchPanel locale="en" brandCounts={sampleBrandCounts} />);

    fireEvent.change(screen.getByPlaceholderText(/search by brand/i), {
      target: { value: "brizo" },
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalled(), { timeout: 1000 });

    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("/api/products/search");
    expect(url).toContain("q=brizo");
    expect(url).toContain("limit=8");
    expect(url).toContain("sort=relevance");
  });

  it("selecting a finish swatch with no query opens the typeahead", async () => {
    const fetchMock = stubFetch();
    render(<CatalogSearchPanel locale="en" brandCounts={sampleBrandCounts} />);

    fireEvent.click(screen.getByRole("button", { name: /matte black/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled(), { timeout: 1000 });
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("finish=MB");
  });

  it("clicking the same finish swatch twice clears it and closes the dropdown", async () => {
    const fetchMock = stubFetch();
    render(<CatalogSearchPanel locale="en" brandCounts={sampleBrandCounts} />);

    const matteBlackBtn = screen.getByRole("button", { name: /matte black/i });
    fireEvent.click(matteBlackBtn);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    fireEvent.click(matteBlackBtn);
    expect(matteBlackBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("Enter on a product row navigates to that product's PDP", async () => {
    stubFetch();
    render(<CatalogSearchPanel locale="en" brandCounts={sampleBrandCounts} />);

    const input = screen.getByPlaceholderText(/search by brand/i);
    fireEvent.change(input, { target: { value: "brizo" } });

    await waitFor(() =>
      expect(screen.getByText(/Litze Single Hole Lavatory Faucet/i)).toBeInTheDocument(),
      { timeout: 1500 },
    );

    // First row is active by default. ArrowDown moves to second row.
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => expect(pushMock).toHaveBeenCalled());
    const dest = pushMock.mock.calls[0][0] as string;
    expect(dest).toContain("/en/shop/bathroom/p/");
    // ArrowDown selected the second product (Levoir Widespread, BRI-65336LF-PC).
    expect(dest).toContain("bri-65336lf-pc");
  });

  it("Escape closes the dropdown", async () => {
    stubFetch();
    render(<CatalogSearchPanel locale="en" brandCounts={sampleBrandCounts} />);
    const input = screen.getByPlaceholderText(/search by brand/i);
    fireEvent.change(input, { target: { value: "brizo" } });

    await waitFor(() => expect(screen.queryByText(/Litze/i)).toBeInTheDocument());
    fireEvent.keyDown(input, { key: "Escape" });
    await waitFor(() => expect(screen.queryByText(/Litze/i)).not.toBeInTheDocument());
  });

  it("brand suggestions appear below product results for matching queries", async () => {
    stubFetch();
    render(<CatalogSearchPanel locale="en" brandCounts={sampleBrandCounts} />);
    fireEvent.change(screen.getByPlaceholderText(/search by brand/i), {
      target: { value: "calif" },
    });

    await waitFor(() =>
      expect(screen.getByText(/California Faucets/i)).toBeInTheDocument(),
      { timeout: 1500 },
    );
    expect(screen.getByText(/3,759 pieces/)).toBeInTheDocument();
  });

  it("ES locale shows Spanish placeholder + Spanish finish labels", () => {
    render(<CatalogSearchPanel locale="es" brandCounts={sampleBrandCounts} />);
    expect(
      screen.getByPlaceholderText(/buscar por marca|buscar por modelo|buscar.*modelo/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /negro mate/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cromado/i })).toBeInTheDocument();
  });
});
