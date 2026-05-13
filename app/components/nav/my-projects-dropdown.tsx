"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { FolderOpen, ChevronDown, Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useProjectStore, SPECIAL_PRICING_THRESHOLD_MXN } from "@/app/lib/project-store";

const T = {
  en: {
    myProjects: "My Projects",
    noProjects: "No projects yet",
    newProject: "New Project",
    viewAll: "View All Projects",
    items: "items",
    item: "item",
    specialPricing: "Eligible for special pricing!",
  },
  es: {
    myProjects: "Mis Proyectos",
    noProjects: "Aún no hay proyectos",
    newProject: "Nuevo Proyecto",
    viewAll: "Ver Todos los Proyectos",
    items: "artículos",
    item: "artículo",
    specialPricing: "Elegible para precio especial!",
  },
};

const fmtMXN = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

export const MyProjectsDropdown = ({ locale }: { locale: "en" | "es" }) => {
  const t = T[locale];
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const projects = useProjectStore((s) => s.projects);
  const projectSubtotal = useProjectStore((s) => s.projectSubtotal);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (projects.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 font-body text-sm font-medium text-brand-charcoal hover:text-brand-terracotta transition-colors py-2 cursor-pointer"
      >
        <FolderOpen className="w-4 h-4" />
        <span className="hidden md:inline">{t.myProjects}</span>
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-copper/10 text-brand-copper text-[10px] font-bold">
          {projects.length}
        </span>
        <ChevronDown
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-brand-stone/10 z-50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-brand-stone/10">
              <p className="font-body text-xs font-semibold tracking-wider text-brand-charcoal uppercase">
                {t.myProjects}
              </p>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {projects.map((project) => {
                const subtotal = projectSubtotal(project.id);
                const eligible = subtotal >= SPECIAL_PRICING_THRESHOLD_MXN;
                return (
                  <Link
                    key={project.id}
                    href={`/${locale}/account/projects/${project.id}`}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 hover:bg-brand-linen transition-colors border-b border-brand-stone/5 last:border-0"
                  >
                    <p className="font-body text-sm text-brand-charcoal truncate">
                      {project.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-body text-xs text-dash-text-secondary">
                        {project.items.length}{" "}
                        {project.items.length === 1 ? t.item : t.items}
                      </span>
                      <span className="font-mono text-xs text-brand-charcoal">
                        {fmtMXN(subtotal)}
                      </span>
                    </div>
                    {eligible && (
                      <p className="mt-1 font-body text-[10px] text-brand-copper font-semibold">
                        {t.specialPricing}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="px-4 py-3 border-t border-brand-stone/10 flex items-center justify-between">
              <Link
                href={`/${locale}/account/projects`}
                onClick={() => setOpen(false)}
                className="font-body text-xs font-medium text-brand-copper hover:text-brand-copper/80 transition-colors"
              >
                {t.viewAll}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
