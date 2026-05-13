"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, FolderOpen, Trash2 } from "lucide-react";
import {
  useProjectStore,
  SPECIAL_PRICING_THRESHOLD_MXN,
} from "@/app/lib/project-store";

const fmtMXN = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const ProjectsPage = () => {
  const projects = useProjectStore((s) => s.projects);
  const createProject = useProjectStore((s) => s.create);
  const removeProject = useProjectStore((s) => s.remove);
  const projectSubtotal = useProjectStore((s) => s.projectSubtotal);

  const [newName, setNewName] = useState("");
  const [showNew, setShowNew] = useState(false);

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    createProject(trimmed);
    setNewName("");
    setShowNew(false);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-12 px-4 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-light tracking-wider text-[#2C2C2C]">
              My Projects
            </h1>
            <p className="font-body text-sm text-[#6B6B6B] mt-1">
              Organize selections for your design projects
            </p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#B87333] text-white text-sm font-body font-medium rounded-lg hover:bg-[#A0632D] transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>

        {showNew && (
          <div className="mb-6 flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Project name"
              autoFocus
              className="flex-1 px-4 py-2.5 text-sm border border-[#E5E0DB] rounded-lg focus:outline-none focus:border-[#B87333] font-body"
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="px-4 py-2.5 text-sm font-body font-medium text-white bg-[#B87333] rounded-lg hover:bg-[#A0632D] disabled:opacity-50 cursor-pointer disabled:cursor-default transition-colors"
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowNew(false);
                setNewName("");
              }}
              className="px-4 py-2.5 text-sm font-body text-[#6B6B6B] hover:text-[#2C2C2C] transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-[#E5E0DB]">
            <FolderOpen className="w-12 h-12 text-[#E5E0DB] mx-auto mb-4" />
            <p className="font-body text-sm text-[#6B6B6B]">
              No projects yet. Create one to start organizing your selections.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => {
              const subtotal = projectSubtotal(project.id);
              const eligible = subtotal >= SPECIAL_PRICING_THRESHOLD_MXN;
              const pct = Math.min(
                (subtotal / SPECIAL_PRICING_THRESHOLD_MXN) * 100,
                100
              );

              return (
                <Link
                  key={project.id}
                  href={`/en/account/projects/${project.id}`}
                  className="block bg-white rounded-xl border border-[#E5E0DB] p-5 hover:border-[#B87333]/30 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h2 className="font-body text-base font-medium text-[#2C2C2C] truncate group-hover:text-[#B87333] transition-colors">
                        {project.name}
                      </h2>
                      <p className="font-body text-xs text-[#6B6B6B] mt-1">
                        {project.items.length}{" "}
                        {project.items.length === 1 ? "item" : "items"} ·{" "}
                        <span className="font-mono">{fmtMXN(subtotal)}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-body font-semibold rounded-full uppercase tracking-wider ${
                          project.status === "quote-requested"
                            ? "bg-[#B87333]/10 text-[#B87333]"
                            : "bg-[#E5E0DB]/50 text-[#6B6B6B]"
                        }`}
                      >
                        {project.status === "quote-requested"
                          ? "Quote Requested"
                          : "Draft"}
                      </span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeProject(project.id);
                        }}
                        className="p-1.5 text-[#E5E0DB] hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar toward $100K */}
                  <div className="mt-3">
                    <div className="h-1.5 bg-[#F0ECE6] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          eligible ? "bg-[#B87333]" : "bg-[#B87333]/40"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-1.5 font-body text-[10px] text-[#6B6B6B]">
                      {eligible ? (
                        <span className="text-[#B87333] font-semibold">
                          Eligible for special project pricing
                        </span>
                      ) : (
                        <>
                          {fmtMXN(SPECIAL_PRICING_THRESHOLD_MXN - subtotal)}{" "}
                          away from special project pricing
                        </>
                      )}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="text-center mt-8">
          <Link
            href="/"
            className="text-sm text-[#B87333] hover:text-[#A0632D] transition-colors font-body"
          >
            &larr; Back to shop
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProjectsPage;
