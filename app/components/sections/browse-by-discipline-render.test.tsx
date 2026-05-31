// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { DisciplineSpreadCard } from "./browse-by-discipline";
import { DISCIPLINE_SPREADS, PRODUCT_CATEGORIES, type CategoryKey } from "@/app/lib/constants";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, priority, ...rest } = props;
    return <img data-fill={fill ? "true" : undefined} data-priority={priority ? "true" : undefined} {...rest} />;
  },
}));

vi.mock("@/app/i18n/navigation", () => ({
  Link: ({ children, href, ...props }: { children: React.ReactNode; href: string; [k: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe("DisciplineSpreadCard — render tests", () => {
  afterEach(() => cleanup());

  const bathroom = DISCIPLINE_SPREADS[0];

  it("renders the number marker", () => {
    render(
      <DisciplineSpreadCard
        spread={bathroom}
        locale="en"
        pieceCount={12418}
        imagePosition="right"
        priorityImage
      />,
    );
    expect(screen.getByText("01")).toBeInTheDocument();
  });

  it("renders the discipline name as h3", () => {
    render(
      <DisciplineSpreadCard
        spread={bathroom}
        locale="en"
        pieceCount={12418}
        imagePosition="right"
        priorityImage
      />,
    );
    const heading = screen.getByRole("heading", { level: 3 });
    expect(heading).toHaveTextContent("Bathroom");
  });

  it("renders the editorial copy", () => {
    render(
      <DisciplineSpreadCard
        spread={bathroom}
        locale="en"
        pieceCount={12418}
        imagePosition="right"
        priorityImage
      />,
    );
    expect(screen.getByText(/house gets judged on/)).toBeInTheDocument();
  });

  it("renders all 10 bathroom subcategories as links", () => {
    render(
      <DisciplineSpreadCard
        spread={bathroom}
        locale="en"
        pieceCount={12418}
        imagePosition="right"
        priorityImage
      />,
    );
    const bathroomSubs = PRODUCT_CATEGORIES.bathroom.subcategories;
    for (const sub of bathroomSubs) {
      const link = screen.getByRole("link", {
        name: new RegExp(sub.label.en.toUpperCase(), "i"),
      });
      expect(link).toHaveAttribute("href", `/shop/bathroom/${sub.slug}`);
    }
  });

  it("renders anchor brands joined correctly (EN)", () => {
    render(
      <DisciplineSpreadCard
        spread={bathroom}
        locale="en"
        pieceCount={12418}
        imagePosition="right"
        priorityImage
      />,
    );
    expect(
      screen.getByText(/TOTO, Brizo, California Faucets and Mistoa/),
    ).toBeInTheDocument();
  });

  it("renders piece count formatted with locale separator", () => {
    render(
      <DisciplineSpreadCard
        spread={bathroom}
        locale="en"
        pieceCount={12418}
        imagePosition="right"
        priorityImage
      />,
    );
    expect(screen.getByText(/12,418 pieces/)).toBeInTheDocument();
  });

  it("renders the CTA with correct href", () => {
    render(
      <DisciplineSpreadCard
        spread={bathroom}
        locale="en"
        pieceCount={12418}
        imagePosition="right"
        priorityImage
      />,
    );
    const cta = screen.getByRole("link", { name: /enter the bathroom/i });
    expect(cta).toHaveAttribute("href", "/shop/bathroom");
  });

  it("renders the hero image with correct src", () => {
    render(
      <DisciplineSpreadCard
        spread={bathroom}
        locale="en"
        pieceCount={12418}
        imagePosition="right"
        priorityImage
      />,
    );
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", bathroom.heroImage);
    expect(img).toHaveAttribute("data-priority", "true");
  });

  it("non-priority image does not set priority", () => {
    const kitchen = DISCIPLINE_SPREADS[1];
    render(
      <DisciplineSpreadCard
        spread={kitchen}
        locale="en"
        pieceCount={8000}
        imagePosition="left"
        priorityImage={false}
      />,
    );
    const img = screen.getByRole("img");
    expect(img).not.toHaveAttribute("data-priority");
  });

  it("renders ES locale with 'y' conjunction", () => {
    render(
      <DisciplineSpreadCard
        spread={bathroom}
        locale="es"
        pieceCount={12418}
        imagePosition="right"
        priorityImage
      />,
    );
    expect(
      screen.getByText(/TOTO, Brizo, California Faucets y Mistoa/),
    ).toBeInTheDocument();
    expect(screen.getByText(/piezas/)).toBeInTheDocument();
  });

  it("renders workshops CTA linking to #artisans", () => {
    const workshops = DISCIPLINE_SPREADS[3];
    render(
      <DisciplineSpreadCard
        spread={workshops}
        locale="en"
        pieceCount={0}
        imagePosition="left"
        priorityImage={false}
      />,
    );
    const cta = screen.getByRole("link", { name: /meet the makers/i });
    expect(cta).toHaveAttribute("href", "#artisans");
  });

  it("alt text includes discipline name", () => {
    render(
      <DisciplineSpreadCard
        spread={bathroom}
        locale="en"
        pieceCount={12418}
        imagePosition="right"
        priorityImage
      />,
    );
    const img = screen.getByRole("img");
    expect(img.getAttribute("alt")).toContain("Bathroom");
  });

  it("renders all 4 disciplines without crashing", () => {
    for (let i = 0; i < DISCIPLINE_SPREADS.length; i++) {
      const s = DISCIPLINE_SPREADS[i];
      const { unmount } = render(
        <DisciplineSpreadCard
          spread={s}
          locale="en"
          pieceCount={1000}
          imagePosition={i % 2 === 0 ? "right" : "left"}
          priorityImage={i === 0}
        />,
      );
      expect(screen.getByText(s.number)).toBeInTheDocument();
      unmount();
    }
  });
});
