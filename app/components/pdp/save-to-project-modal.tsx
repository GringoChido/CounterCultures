"use client";

import { useState } from "react";
import { X, Plus, FolderOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useProjectStore,
  type Project,
  type ProjectLineItem,
} from "@/app/lib/project-store";

const T = {
  en: {
    title: "Save to Project",
    newProject: "New Project",
    placeholder: "Project name",
    create: "Create & Add",
    cancel: "Cancel",
    noProjects: "No projects yet. Create one to get started.",
    addTo: "Add to",
    added: "Added!",
  },
  es: {
    title: "Guardar en Proyecto",
    newProject: "Nuevo Proyecto",
    placeholder: "Nombre del proyecto",
    create: "Crear y Agregar",
    cancel: "Cancelar",
    noProjects: "Aún no hay proyectos. Crea uno para comenzar.",
    addTo: "Agregar a",
    added: "Agregado!",
  },
};

interface SaveToProjectModalProps {
  open: boolean;
  onClose: () => void;
  locale: "en" | "es";
  item: Omit<ProjectLineItem, "addedAt">;
}

export const SaveToProjectModal = ({
  open,
  onClose,
  locale,
  item,
}: SaveToProjectModalProps) => {
  const t = T[locale];
  const projects = useProjectStore((s) => s.projects);
  const createProject = useProjectStore((s) => s.create);
  const addItem = useProjectStore((s) => s.addItem);

  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [justAdded, setJustAdded] = useState<string | null>(null);

  const handleAddToProject = (project: Project) => {
    addItem(project.id, item);
    setJustAdded(project.id);
    setTimeout(() => {
      setJustAdded(null);
      onClose();
    }, 800);
  };

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const project = createProject(trimmed);
    addItem(project.id, item);
    setNewName("");
    setShowNew(false);
    setJustAdded(project.id);
    setTimeout(() => {
      setJustAdded(null);
      onClose();
    }, 800);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[60]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            className="fixed inset-x-4 top-[20%] mx-auto max-w-sm bg-white rounded-xl shadow-xl z-[61] overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-brand-stone/10">
              <h3 className="font-display text-lg font-light tracking-wide text-brand-charcoal">
                {t.title}
              </h3>
              <button
                onClick={onClose}
                className="p-1 text-dash-text-secondary hover:text-brand-charcoal transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-4 max-h-[50vh] overflow-y-auto">
              {projects.length === 0 && !showNew && (
                <p className="text-sm text-dash-text-secondary text-center py-4">
                  {t.noProjects}
                </p>
              )}

              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleAddToProject(project)}
                  disabled={justAdded === project.id}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-brand-linen transition-colors cursor-pointer text-left disabled:cursor-default"
                >
                  <FolderOpen className="w-4 h-4 text-brand-copper shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm text-brand-charcoal truncate">
                      {project.name}
                    </p>
                    <p className="font-body text-xs text-dash-text-secondary">
                      {project.items.length}{" "}
                      {project.items.length === 1
                        ? locale === "es"
                          ? "artículo"
                          : "item"
                        : locale === "es"
                          ? "artículos"
                          : "items"}
                    </p>
                  </div>
                  <span className="font-body text-xs text-brand-copper">
                    {justAdded === project.id ? t.added : t.addTo}
                  </span>
                </button>
              ))}

              {showNew ? (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    placeholder={t.placeholder}
                    autoFocus
                    className="flex-1 px-3 py-2 text-sm border border-brand-stone/20 rounded-lg focus:outline-none focus:border-brand-copper font-body"
                  />
                  <button
                    onClick={handleCreate}
                    disabled={!newName.trim()}
                    className="px-3 py-2 text-sm font-body font-medium text-white bg-brand-copper rounded-lg hover:bg-brand-copper/90 disabled:opacity-50 cursor-pointer disabled:cursor-default transition-colors"
                  >
                    {t.create}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowNew(true)}
                  className="mt-3 w-full flex items-center gap-2 px-3 py-3 rounded-lg border border-dashed border-brand-stone/20 hover:border-brand-copper/40 hover:bg-brand-linen transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-brand-copper" />
                  <span className="font-body text-sm text-brand-copper font-medium">
                    {t.newProject}
                  </span>
                </button>
              )}
            </div>

            {showNew && (
              <div className="px-5 py-3 border-t border-brand-stone/10">
                <button
                  onClick={() => {
                    setShowNew(false);
                    setNewName("");
                  }}
                  className="font-body text-xs text-dash-text-secondary hover:text-brand-charcoal transition-colors cursor-pointer"
                >
                  {t.cancel}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
