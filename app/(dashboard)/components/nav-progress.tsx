"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const NavProgress = () => {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [width, setWidth] = useState(0);

  // Listen for clicks on internal dashboard links → start the bar.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const target = (e.target as Element | null)?.closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href || !href.startsWith("/dashboard")) return;
      if (target.getAttribute("target") === "_blank") return;
      // Same path? no navigation.
      if (href === pathname || href === pathname + "/") return;
      setActive(true);
      setWidth(15);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname]);

  // Pathname changed → finish the bar.
  useEffect(() => {
    if (!active) return;
    setWidth(100);
    const t = setTimeout(() => {
      setActive(false);
      setWidth(0);
    }, 220);
    return () => clearTimeout(t);
  }, [pathname]);

  // Trickle while pending so it never looks frozen on slow pages.
  useEffect(() => {
    if (!active || width >= 90) return;
    const t = setTimeout(() => setWidth((w) => Math.min(90, w + Math.random() * 12)), 220);
    return () => clearTimeout(t);
  }, [active, width]);

  if (!active && width === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 h-0.5 z-[60] pointer-events-none"
      aria-hidden="true"
    >
      <div
        className="h-full bg-brand-copper transition-all duration-200 ease-out shadow-[0_0_8px_rgba(184,115,51,0.6)]"
        style={{ width: `${width}%`, opacity: active ? 1 : 0 }}
      />
    </div>
  );
};

export { NavProgress };
