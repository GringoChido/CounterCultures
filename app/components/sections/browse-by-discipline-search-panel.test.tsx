// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
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
    return <img data-fill={fill ? "true" : undefined} data-priority={priority ? "true" : undefined} {...rest} />;
  },
}));

vi.mock("@/app/lib/products-full", async () => {
  const actual = await vi.importActual<typeof import("@/app/lib/products-full")>(
    "@/app/lib/products-full",
  );
  return {
    ...actual,
    getCategoryPieceCounts: vi.fn(async () => ({
      bathroom: 12418,
      kitchen: 8000,
      hardware: 5000,
      workshops: 0,
    })),
  };
});

vi.mock("@/app/components/visual-search-modal", () => ({
  VisualSearchModal: () => null,
}));

import { BrowseByDiscipline } from "./browse-by-discipline";

const brandCounts: BrandCount[] = [
  { brand: "Brizo", count: 7913 },
  { brand: "Kohler", count: 256 },
  { brand: "TOTO", count: 1284 },
];

const renderAsync = async (jsx: Promise<React.ReactElement>) => {
  const el = await jsx;
  return render(el);
};

describe("BrowseByDiscipline — embedded search panel + live brand count", () => {
  afterEach(() => cleanup());

  it("EN headline uses the live brand count, not a hardcoded 73", async () => {
    await renderAsync(
      BrowseByDiscipline({ locale: "en", brandCount: 134, brandCounts }) as unknown as Promise<React.ReactElement>,
    );
    expect(
      screen.getByText(/Three rooms\. 134 brands\. One catalog\./i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Seventy-three brands/i),
    ).not.toBeInTheDocument();
  });

  it("ES headline uses the live brand count", async () => {
    await renderAsync(
      BrowseByDiscipline({ locale: "es", brandCount: 134, brandCounts }) as unknown as Promise<React.ReactElement>,
    );
    expect(
      screen.getByText(/Tres ambientes\. 134 marcas\. Un catálogo\./i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Setenta y tres marcas/i),
    ).not.toBeInTheDocument();
  });

  it("renders the CatalogSearchPanel inside the section header", async () => {
    await renderAsync(
      BrowseByDiscipline({ locale: "en", brandCount: 134, brandCounts }) as unknown as Promise<React.ReactElement>,
    );
    expect(
      screen.getByPlaceholderText(/search by brand, model, or name/i),
    ).toBeInTheDocument();
  });

  it("uses a 2-column layout on lg+ (grid-cols-[1fr_auto])", async () => {
    const { container } = await renderAsync(
      BrowseByDiscipline({ locale: "en", brandCount: 134, brandCounts }) as unknown as Promise<React.ReactElement>,
    );
    const twoCol = container.querySelector('[class*="lg:grid-cols-[1fr_auto]"]');
    expect(twoCol).not.toBeNull();
  });
});
