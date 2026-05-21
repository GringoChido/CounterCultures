"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FolderPlus } from "lucide-react";
import { useProjectStore } from "@/app/lib/project-store";

const NewProjectPage = () => {
  const router = useRouter();
  const createProject = useProjectStore((s) => s.create);
  const [name, setName] = useState("");

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const project = createProject(trimmed);
    router.push(`/account/projects/${project.id}`);
  };

  return (
    <div className="min-h-screen bg-brand-linen py-12 px-4 sm:px-6">
      <div className="mx-auto max-w-lg">
        <Link
          href="/account/projects"
          className="inline-flex items-center gap-1.5 text-sm text-dash-text-secondary hover:text-brand-charcoal transition-colors font-body mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          My Projects
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-copper">
            <FolderPlus className="h-5 w-5 text-white" strokeWidth={1.75} />
          </div>
          <h1 className="font-display text-2xl font-light tracking-wider text-brand-charcoal">
            Start a New Project
          </h1>
        </div>

        <div className="space-y-5 bg-white rounded-xl border border-brand-stone/30 p-6">
          <div>
            <label
              htmlFor="project-name"
              className="block font-body text-sm font-medium text-brand-charcoal mb-1.5"
            >
              Project name
            </label>
            <input
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="e.g. Master Bath Remodel, Kitchen Renovation"
              autoFocus
              className="w-full px-4 py-3 text-sm border border-brand-stone/30 rounded-lg focus:outline-none focus:border-brand-copper focus:ring-1 focus:ring-brand-copper/30 font-body transition-colors"
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-copper text-white text-sm font-body font-medium rounded-lg hover:bg-brand-copper-dark disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewProjectPage;
