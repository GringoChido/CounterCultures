"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  ExternalLink,
  Star,
  AlertTriangle,
  Folder,
  ShoppingBag,
} from "lucide-react";
import type { Brand, CategorySlug } from "@/app/lib/brand-kit-types";
import { CATEGORY_LABELS } from "@/app/lib/brand-kit-types";
import { BrandRelated } from "@/app/(dashboard)/components/brand-related";

const STOCKED_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "Untagged" },
  { value: "stocked", label: "Stocked" },
  { value: "request", label: "On Request" },
  { value: "external", label: "External" },
];

const NOM_OPTIONS = [
  "unknown",
  "certified",
  "partial",
  "in_progress",
  "needs_cert",
  "not_required",
] as const;

const ALL_CATEGORIES: CategorySlug[] = [
  "faucetry-showers",
  "door-cabinet-hardware",
  "bathroom-sinks",
  "kitchen-sinks",
  "drains",
  "toilets",
  "bathtubs",
  "appliances",
  "other",
];

const BRAND_KIT_FOLDER_ID = "11dN5ngdFuLWvOKMfyRKk0tjCjXHgjSjj";

const labelClass =
  "block text-xs font-medium text-dash-text-secondary mb-1.5 uppercase tracking-wider";
const inputClass =
  "w-full text-sm bg-dash-bg border border-dash-border rounded-lg px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30 placeholder:text-dash-text-secondary/50";
const sectionClass =
  "bg-dash-surface border border-dash-border rounded-xl p-5 space-y-5";

const BrandEditPage = () => {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const router = useRouter();

  const [brand, setBrand] = useState<Brand | null>(null);
  const [form, setForm] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const fetchBrand = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/dashboard/brands/${slug}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("Brand not found.");
        } else {
          throw new Error("Failed to fetch");
        }
        return;
      }
      const data = await res.json();
      setBrand(data.brand as Brand);
      setForm(data.brand as Brand);
    } catch (err) {
      console.error(err);
      setError("Unable to load brand.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) fetchBrand();
  }, [slug, fetchBrand]);

  const dirty = useMemo(() => {
    if (!brand || !form) return false;
    return JSON.stringify(brand) !== JSON.stringify(form);
  }, [brand, form]);

  const set = <K extends keyof Brand>(key: K, value: Brand[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const toggleCategory = (cat: CategorySlug) => {
    setForm((prev) => {
      if (!prev) return prev;
      const has = prev.categorySlugs.includes(cat);
      const next = has
        ? prev.categorySlugs.filter((c) => c !== cat)
        : [...prev.categorySlugs, cat];
      return { ...prev, categorySlugs: next };
    });
  };

  const save = async () => {
    if (!form || !brand) return;
    try {
      setSaving(true);
      setError(null);
      setSaveMsg(null);

      // Only send changed fields
      const patch: Partial<Brand> = {};
      for (const key of Object.keys(form) as (keyof Brand)[]) {
        if (JSON.stringify(form[key]) !== JSON.stringify(brand[key])) {
          (patch as Record<string, unknown>)[key as string] = form[key];
        }
      }

      const res = await fetch(`/api/dashboard/brands/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Save failed");
      const data = await res.json();
      setBrand(data.brand as Brand);
      setForm(data.brand as Brand);
      setSaveMsg("Saved.");
      setTimeout(() => setSaveMsg(null), 2500);
    } catch (err) {
      console.error(err);
      setError("Save failed. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-7 h-7 animate-spin text-brand-copper" />
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="p-8 space-y-4">
        <Link
          href="/dashboard/brands"
          className="inline-flex items-center gap-1.5 text-sm text-dash-text-secondary hover:text-dash-text"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to brands
        </Link>
        <p className="text-dash-danger">{error}</p>
      </div>
    );
  }

  if (!form) return null;

  const driveFolderUrl = form.brandFolderDriveId
    ? `https://drive.google.com/drive/folders/${form.brandFolderDriveId}`
    : `https://drive.google.com/drive/folders/${BRAND_KIT_FOLDER_ID}`;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Breadcrumb + title */}
      <div className="space-y-3">
        <Link
          href="/dashboard/brands"
          className="inline-flex items-center gap-1.5 text-sm text-dash-text-secondary hover:text-dash-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to brands
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-brand-copper/10 text-brand-copper border border-brand-copper/20 flex items-center justify-center text-xl font-semibold">
              {form.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-3xl font-light text-dash-text">
                  {form.name}
                </h1>
                {form.isFeatured && (
                  <Star className="w-5 h-5 text-brand-copper fill-brand-copper" />
                )}
              </div>
              <p className="text-xs text-dash-text-secondary mt-1">
                <code className="px-1.5 py-0.5 bg-dash-bg rounded">
                  {form.slug}
                </code>{" "}
                · created {form.createdAt.split("T")[0] || "—"} · last edited{" "}
                {form.updatedAt.split("T")[0] || "—"}{" "}
                {form.updatedBy && `by ${form.updatedBy}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {saveMsg && (
              <span className="text-xs text-dash-success">{saveMsg}</span>
            )}
            {error && <span className="text-xs text-dash-danger">{error}</span>}
            <button
              onClick={save}
              disabled={!dirty || saving}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Identity & Copy */}
          <section className={sectionClass}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">
              Identity & Copy
            </h2>
            <div>
              <label className={labelClass}>Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Tagline (EN)</label>
                <input
                  type="text"
                  value={form.taglineEn}
                  onChange={(e) => set("taglineEn", e.target.value)}
                  placeholder="Short positioning line, ≤80 chars"
                  maxLength={120}
                  className={inputClass}
                />
                <p className="text-xs text-dash-text-secondary/70 mt-1">
                  {form.taglineEn.length}/80 ideal
                </p>
              </div>
              <div>
                <label className={labelClass}>Tagline (ES)</label>
                <input
                  type="text"
                  value={form.taglineEs}
                  onChange={(e) => set("taglineEs", e.target.value)}
                  placeholder="Línea de posicionamiento"
                  maxLength={120}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Description (EN)</label>
              <textarea
                value={form.descriptionEn}
                onChange={(e) => set("descriptionEn", e.target.value)}
                rows={4}
                className={inputClass + " resize-y"}
              />
            </div>
            <div>
              <label className={labelClass}>Description (ES)</label>
              <textarea
                value={form.descriptionEs}
                onChange={(e) => set("descriptionEs", e.target.value)}
                rows={4}
                className={inputClass + " resize-y"}
              />
            </div>
          </section>

          {/* Origin & Links */}
          <section className={sectionClass}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">
              Origin & Links
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Country (ISO-2)</label>
                <input
                  type="text"
                  value={form.originCountry}
                  onChange={(e) =>
                    set("originCountry", e.target.value.toUpperCase().slice(0, 2))
                  }
                  placeholder="DE"
                  maxLength={2}
                  className={inputClass + " font-mono"}
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Country name</label>
                <input
                  type="text"
                  value={form.originCountryName}
                  onChange={(e) => set("originCountryName", e.target.value)}
                  placeholder="Germany"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Website URL</label>
                <input
                  type="url"
                  value={form.websiteUrl}
                  onChange={(e) => set("websiteUrl", e.target.value)}
                  placeholder="https://…"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  External URL <span className="opacity-60">(for external-state cards)</span>
                </label>
                <input
                  type="url"
                  value={form.externalUrl}
                  onChange={(e) => set("externalUrl", e.target.value)}
                  placeholder="falls back to website"
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* Catalog */}
          <section className={sectionClass}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">
              Catalog Position
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Stock state</label>
                <select
                  value={form.stockedState}
                  onChange={(e) =>
                    set("stockedState", e.target.value as Brand["stockedState"])
                  }
                  className={inputClass}
                >
                  {STOCKED_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>NOM summary</label>
                <select
                  value={form.nomStatusSummary}
                  onChange={(e) =>
                    set(
                      "nomStatusSummary",
                      e.target.value as Brand["nomStatusSummary"]
                    )
                  }
                  className={inputClass}
                >
                  {NOM_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Primary category</label>
              <select
                value={form.primaryCategorySlug}
                onChange={(e) =>
                  set(
                    "primaryCategorySlug",
                    e.target.value as Brand["primaryCategorySlug"]
                  )
                }
                className={inputClass}
              >
                <option value="">—</option>
                {ALL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>
                Categories{" "}
                <span className="opacity-60">
                  ({form.categorySlugs.length} selected)
                </span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_CATEGORIES.map((c) => {
                  const active = form.categorySlugs.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCategory(c)}
                      className={`px-2.5 py-1 rounded-full text-xs border transition-colors cursor-pointer ${
                        active
                          ? "bg-brand-copper/15 text-brand-copper border-brand-copper/30"
                          : "bg-dash-bg text-dash-text-secondary border-dash-border hover:border-dash-text-secondary"
                      }`}
                    >
                      {CATEGORY_LABELS[c]}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Flags & ordering */}
          <section className={sectionClass}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">
              Flags & Ordering
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => set("isFeatured", e.target.checked)}
                  className="w-4 h-4 accent-brand-copper cursor-pointer"
                />
                <span className="text-sm text-dash-text">Featured (flagship)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isArtisan}
                  onChange={(e) => set("isArtisan", e.target.checked)}
                  className="w-4 h-4 accent-brand-copper cursor-pointer"
                />
                <span className="text-sm text-dash-text">Artisan maker</span>
              </label>
              <div>
                <label className={labelClass}>Display order</label>
                <input
                  type="number"
                  value={form.displayOrder ?? ""}
                  onChange={(e) =>
                    set(
                      "displayOrder",
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                  placeholder="—"
                  className={inputClass}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          {/* Assets */}
          <section className={sectionClass}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">
              Assets
            </h2>
            <p className="text-sm text-dash-text-secondary">
              Drop logos, heroes, and brochures into this brand&apos;s folder in
              Drive. The portal auto-picks them up — no upload UI needed.
            </p>
            <a
              href={driveFolderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg hover:border-brand-copper/50 transition-colors"
            >
              <Folder className="w-4 h-4 text-brand-copper" />
              {form.brandFolderDriveId
                ? "Open brand folder"
                : "Open Brand Kit folder"}
              <ExternalLink className="w-3 h-3 ml-auto opacity-60" />
            </a>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-dash-text-secondary">Logo ID</span>
                <code className="text-dash-text truncate max-w-[160px]">
                  {form.logoDriveId || "—"}
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-dash-text-secondary">Hero ID</span>
                <code className="text-dash-text truncate max-w-[160px]">
                  {form.heroDriveId || "—"}
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-dash-text-secondary">Folder ID</span>
                <code className="text-dash-text truncate max-w-[160px]">
                  {form.brandFolderDriveId || "—"}
                </code>
              </div>
            </div>
          </section>

          {/* Shopify stub */}
          <section className={sectionClass}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">
              Products (Shopify)
            </h2>
            <div className="flex items-start gap-2 bg-dash-warn/5 border border-dash-warn/20 rounded-lg px-3 py-2.5 text-xs text-dash-text-secondary">
              <AlertTriangle className="w-3.5 h-3.5 text-dash-warn flex-shrink-0 mt-0.5" />
              <div>
                Shopify admin access is still pending. Once connected,
                attach/detach products for this brand will live here.
              </div>
            </div>
            <button
              disabled
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg opacity-50 cursor-not-allowed"
            >
              <ShoppingBag className="w-4 h-4" />
              Attach product
            </button>
            <div className="text-xs text-dash-text-secondary">
              Featured product IDs:{" "}
              {form.featuredProductIds.length > 0
                ? form.featuredProductIds.join(", ")
                : "none"}
            </div>
          </section>

          {/* Danger / utility */}
          <section className={sectionClass}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">
              Utility
            </h2>
            <button
              onClick={() => {
                if (brand) setForm(brand);
              }}
              disabled={!dirty || saving}
              className="w-full px-3 py-2 text-sm border border-dash-border rounded-lg hover:bg-dash-bg transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Discard changes
            </button>
            <button
              onClick={() => router.push("/dashboard/brands")}
              className="w-full px-3 py-2 text-sm border border-dash-border rounded-lg hover:bg-dash-bg transition-colors cursor-pointer"
            >
              Done
            </button>
          </section>
        </aside>
      </div>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-dash-text-secondary">
          Related
        </h2>
        <BrandRelated brandSlug={form.slug} brandName={form.name} />
      </section>
    </div>
  );
};

export default BrandEditPage;
