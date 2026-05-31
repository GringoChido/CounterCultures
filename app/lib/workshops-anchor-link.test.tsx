// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { DisciplineSpreadCard } from "@/app/components/sections/browse-by-discipline";
import { DISCIPLINE_SPREADS } from "@/app/lib/constants";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, priority, ...rest } = props;
    return (
      <img
        data-fill={fill ? "true" : undefined}
        data-priority={priority ? "true" : undefined}
        {...rest}
      />
    );
  },
}));

vi.mock("@/app/i18n/navigation", () => ({
  Link: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [k: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("Workshops spread → #artisans anchor contract", () => {
  afterEach(() => cleanup());

  const workshopsSpread = DISCIPLINE_SPREADS.find((s) => s.key === "workshops")!;

  it("the Workshops spread exists in DISCIPLINE_SPREADS", () => {
    expect(workshopsSpread).toBeDefined();
  });

  it("the Workshops spread href is #artisans", () => {
    expect(workshopsSpread.href).toBe("#artisans");
  });

  it("the Workshops CTA renders 'Meet the Makers' (EN)", () => {
    render(
      <DisciplineSpreadCard
        spread={workshopsSpread}
        locale="en"
        pieceCount={0}
        imagePosition="left"
        priorityImage={false}
      />,
    );
    expect(screen.getByText("Meet the Makers")).toBeInTheDocument();
  });

  it("the CTA link points to #artisans in the rendered DOM", () => {
    render(
      <DisciplineSpreadCard
        spread={workshopsSpread}
        locale="en"
        pieceCount={0}
        imagePosition="left"
        priorityImage={false}
      />,
    );
    const link = screen.getByText("Meet the Makers").closest("a");
    expect(link).not.toBeNull();
    expect(link!.getAttribute("href")).toBe("#artisans");
  });

  it("the ES CTA renders 'Conoce a los Talleres'", () => {
    render(
      <DisciplineSpreadCard
        spread={workshopsSpread}
        locale="es"
        pieceCount={0}
        imagePosition="left"
        priorityImage={false}
      />,
    );
    expect(screen.getByText("Conoce a los Talleres")).toBeInTheDocument();
  });
});
