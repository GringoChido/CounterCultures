"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ProjectLineItem {
  productId: string;
  variantId?: string;
  name: string;
  brand: string;
  category: string;
  sku: string;
  qty: number;
  unitPrice: number;
  currency: "MXN" | "USD";
  imageSrc?: string;
  productHref: string;
  notes?: string;
  addedAt: number;
}

export type ProjectStatus = "draft" | "quote-requested";

export interface Project {
  id: string;
  name: string;
  notes: string;
  status: ProjectStatus;
  items: ProjectLineItem[];
  createdAt: number;
  updatedAt: number;
}

export interface ProjectState {
  projects: Project[];
  create: (name: string) => Project;
  rename: (id: string, name: string) => void;
  remove: (id: string) => void;
  addItem: (projectId: string, item: Omit<ProjectLineItem, "addedAt">) => void;
  removeItem: (projectId: string, productId: string) => void;
  updateItemQty: (projectId: string, productId: string, qty: number) => void;
  getProject: (id: string) => Project | undefined;
  projectSubtotal: (id: string) => number;
}

const genId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],

      create: (name) => {
        const project: Project = {
          id: genId(),
          name,
          notes: "",
          status: "draft",
          items: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set({ projects: [...get().projects, project] });
        return project;
      },

      rename: (id, name) => {
        set({
          projects: get().projects.map((p) =>
            p.id === id ? { ...p, name, updatedAt: Date.now() } : p
          ),
        });
      },

      remove: (id) => {
        set({ projects: get().projects.filter((p) => p.id !== id) });
      },

      addItem: (projectId, item) => {
        set({
          projects: get().projects.map((p) => {
            if (p.id !== projectId) return p;
            const existing = p.items.find((i) => i.productId === item.productId);
            if (existing) {
              return {
                ...p,
                items: p.items.map((i) =>
                  i.productId === item.productId
                    ? { ...i, qty: i.qty + item.qty }
                    : i
                ),
                updatedAt: Date.now(),
              };
            }
            return {
              ...p,
              items: [...p.items, { ...item, addedAt: Date.now() }],
              updatedAt: Date.now(),
            };
          }),
        });
      },

      removeItem: (projectId, productId) => {
        set({
          projects: get().projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  items: p.items.filter((i) => i.productId !== productId),
                  updatedAt: Date.now(),
                }
              : p
          ),
        });
      },

      updateItemQty: (projectId, productId, qty) => {
        if (qty <= 0) {
          get().removeItem(projectId, productId);
          return;
        }
        set({
          projects: get().projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  items: p.items.map((i) =>
                    i.productId === productId ? { ...i, qty } : i
                  ),
                  updatedAt: Date.now(),
                }
              : p
          ),
        });
      },

      getProject: (id) => get().projects.find((p) => p.id === id),

      projectSubtotal: (id) => {
        const project = get().projects.find((p) => p.id === id);
        if (!project) return 0;
        return project.items.reduce(
          (sum, item) => sum + item.unitPrice * item.qty,
          0
        );
      },
    }),
    { name: "cc_projects_v1" }
  )
);

export const SPECIAL_PRICING_THRESHOLD_MXN = 100_000;
