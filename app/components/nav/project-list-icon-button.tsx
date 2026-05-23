"use client";

import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { useProjectStore } from "@/app/lib/stores/project-store";
import { useUiStore } from "@/app/lib/stores/ui-store";

export const ProjectListIconButton = () => {
  const [mounted, setMounted] = useState(false);
  const itemCount = useProjectStore((s) => s.items.length);
  const openProjectPanel = useUiStore((s) => s.openProjectPanel);

  useEffect(() => setMounted(true), []);

  if (!mounted || itemCount === 0) return null;

  return (
    <button
      type="button"
      onClick={openProjectPanel}
      className="relative flex items-center justify-center w-11 h-11 text-brand-charcoal hover:text-brand-terracotta transition-colors cursor-pointer"
      aria-label={`Project list (${itemCount})`}
    >
      <Bookmark className="w-5 h-5" />
      <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-brand-copper text-white font-body text-[10px] font-bold leading-none">
        {itemCount > 99 ? "99+" : itemCount}
      </span>
    </button>
  );
};
