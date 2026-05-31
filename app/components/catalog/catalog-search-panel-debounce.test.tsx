// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { BrandCount } from "@/app/lib/products-full";

vi.mock("@/app/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  Link: ({ children, href, ...props }: { children: React.ReactNode; href: string; [k: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, priority, ...rest } = props;
    return <img {...rest} />;
  },
}));

vi.mock("@/app/components/visual-search-modal", () => ({
  VisualSearchModal: () => null,
}));

import { CatalogSearchPanel } from "./catalog-search-panel";

const brandCounts: BrandCount[] = [
  { brand: "Brizo", count: 7913 },
];

const sampleResponse = {
  items: [],
  total: 0,
  offset: 0,
  limit: 8,
  elapsedMs: 10,
  cacheAgeMs: 0,
};

describe("CatalogSearchPanel — debounce + abort", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    cleanup();
    vi.restoreAllMocks();
  });

  it("fast successive keystrokes trigger only ONE fetch (180ms debounce)", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => ({
      ok: true,
      json: async () => sampleResponse,
    }));
    (global as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    render(<CatalogSearchPanel locale="en" brandCounts={brandCounts} />);
    const input = screen.getByPlaceholderText(/search by brand/i);

    fireEvent.change(input, { target: { value: "b" } });
    fireEvent.change(input, { target: { value: "br" } });
    fireEvent.change(input, { target: { value: "bri" } });
    fireEvent.change(input, { target: { value: "briz" } });
    fireEvent.change(input, { target: { value: "brizo" } });

    // Advance just under the debounce window — should NOT have fired yet
    vi.advanceTimersByTime(170);
    expect(fetchMock).not.toHaveBeenCalled();

    // Advance past the 180ms threshold — one fetch fires for the latest value
    vi.advanceTimersByTime(50);
    await vi.runAllTimersAsync();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("q=brizo");
  });

  it("a new keystroke after a fetch has fired aborts the in-flight request", async () => {
    const abortSignals: AbortSignal[] = [];
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.signal) abortSignals.push(init.signal);
      return { ok: true, json: async () => sampleResponse };
    });
    (global as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    render(<CatalogSearchPanel locale="en" brandCounts={brandCounts} />);
    const input = screen.getByPlaceholderText(/search by brand/i);

    fireEvent.change(input, { target: { value: "brizo" } });
    vi.advanceTimersByTime(200);
    await vi.runAllTimersAsync();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fireEvent.change(input, { target: { value: "brizo widespread" } });
    vi.advanceTimersByTime(200);
    await vi.runAllTimersAsync();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // First request's signal should now be aborted (panel cancels stale fetches
    // when a newer one starts).
    expect(abortSignals[0]?.aborted).toBe(true);
  });

  it("a loading indicator is visible while a fetch is in flight", async () => {
    // Fetch resolves only after we let it
    let resolveFn: (v: Response) => void = () => {};
    const fetchMock = vi.fn(
      (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Promise<Response>((res) => {
          resolveFn = res;
        }),
    );
    (global as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    render(<CatalogSearchPanel locale="en" brandCounts={brandCounts} />);
    fireEvent.change(screen.getByPlaceholderText(/search by brand/i), {
      target: { value: "brizo" },
    });
    vi.advanceTimersByTime(200);
    await vi.runAllTimersAsync();

    expect(screen.getByTestId("typeahead-loading")).toBeInTheDocument();

    // Resolve the fetch and the loader should clear
    resolveFn({ ok: true, json: async () => sampleResponse } as unknown as Response);
    await vi.runAllTimersAsync();
  });
});
