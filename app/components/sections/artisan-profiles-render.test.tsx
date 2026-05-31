// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ArtisanProfiles, artisans } from "./artisan-profiles";

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

vi.mock("@/app/components/ui/animated-section", () => ({
  AnimatedSection: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe("ArtisanProfiles render", () => {
  afterEach(() => cleanup());

  it("renders 4 artisan cards", () => {
    render(<ArtisanProfiles locale="en" />);
    for (const a of artisans) {
      expect(screen.getByText(a.name)).toBeInTheDocument();
    }
  });

  it("each card is wrapped in a Link with the correct href", () => {
    render(<ArtisanProfiles locale="en" />);
    for (const a of artisans) {
      const nameEl = screen.getByText(a.name);
      const link = nameEl.closest("a");
      expect(link, `${a.name} should be inside a <Link>`).not.toBeNull();
      expect(link!.getAttribute("href")).toBe(a.href);
    }
  });

  it("each card has an <img> (not background-image)", () => {
    render(<ArtisanProfiles locale="en" />);
    const images = screen.getAllByRole("img");
    expect(images.length).toBeGreaterThanOrEqual(4);
  });

  it("each card renders name, craft, and detail", () => {
    render(<ArtisanProfiles locale="en" />);
    for (const a of artisans) {
      expect(screen.getByText(a.name)).toBeInTheDocument();
      expect(screen.getByText(a.craft.en)).toBeInTheDocument();
      expect(screen.getByText(a.detail.en)).toBeInTheDocument();
    }
  });

  it("ES locale renders Spanish copy", () => {
    render(<ArtisanProfiles locale="es" />);
    for (const a of artisans) {
      expect(screen.getByText(a.craft.es)).toBeInTheDocument();
      expect(screen.getByText(a.detail.es)).toBeInTheDocument();
    }
  });

  it("section has id='artisans'", () => {
    const { container } = render(<ArtisanProfiles locale="en" />);
    const section = container.querySelector("#artisans");
    expect(section).not.toBeNull();
  });

  it("section has scroll-mt-24 class", () => {
    const { container } = render(<ArtisanProfiles locale="en" />);
    const section = container.querySelector("#artisans");
    expect(section?.className).toContain("scroll-mt-24");
  });

  it("alt text includes the artisan name", () => {
    render(<ArtisanProfiles locale="en" />);
    for (const a of artisans) {
      const img = screen.getByAltText(new RegExp(a.name));
      expect(img).toBeInTheDocument();
    }
  });

  it("eyebrow says 'The Makers' not 'The Artisans'", () => {
    render(<ArtisanProfiles locale="en" />);
    expect(screen.getByText("The Makers")).toBeInTheDocument();
  });
});
