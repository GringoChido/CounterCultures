/**
 * Stage 7 — Final coverage audit + needs-photography report.
 *
 * Walks the entire Odoo CSV + product-content.json + product-families.json
 * + on-disk image inventory, and emits:
 *
 *   docs/audit/CC-Asset-Gap-Audit.xlsx      — refreshed gap report
 *   docs/audit/CC-Needs-Photography.xlsx    — shot list for unphotographed parents
 *
 * Usage:
 *   npx tsx scripts/scrape/12-final-audit.ts
 */
import * as path from "node:path";
import { promises as fs } from "node:fs";
import { REPO_ROOT, exists } from "./_lib";

interface CsvRow {
  odoo_id: string; sku: string; name: string; brand: string;
  list_price: string; description: string;
}

const parseCsv = async (csvPath: string): Promise<CsvRow[]> => {
  const text = (await fs.readFile(csvPath, "utf-8")).replace(/^﻿/, "");
  const out: CsvRow[] = [];
  let header: string[] = []; let field = ""; let row: string[] = []; let inQuotes = false; let i = 0;
  const pushField = () => { row.push(field); field = ""; };
  const pushRow = () => {
    if (!header.length) header = row;
    else if (row.some((c) => c !== "")) {
      const o: Record<string, string> = {};
      for (let k = 0; k < header.length; k++) o[header[k]] = row[k] ?? "";
      out.push(o as unknown as CsvRow);
    }
    row = [];
  };
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) { if (c === '"') { if (text[i+1] === '"') { field += '"'; i+=2; continue; } inQuotes = false; i++; continue; } field += c; i++; continue; }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ",") { pushField(); i++; continue; }
    if (c === "\n") { pushField(); pushRow(); i++; continue; }
    if (c === "\r") { i++; continue; }
    field += c; i++;
  }
  if (field || row.length) { pushField(); pushRow(); }
  return out;
};

const run = async () => {
  const xlsx = await import("xlsx");

  const csv = await parseCsv(path.join(REPO_ROOT, "scripts", "products-odoo.csv"));
  const families = (await exists(path.join(REPO_ROOT, "app", "lib", "product-families.json")))
    ? JSON.parse(await fs.readFile(path.join(REPO_ROOT, "app", "lib", "product-families.json"), "utf-8"))
    : { parents: {}, childToParent: {} };
  const content = (await exists(path.join(REPO_ROOT, "app", "lib", "product-content.json")))
    ? JSON.parse(await fs.readFile(path.join(REPO_ROOT, "app", "lib", "product-content.json"), "utf-8"))
    : {};

  const odooThumbDir = path.join(REPO_ROOT, "public", "products", "odoo");
  const haveThumb = new Set(
    (await fs.readdir(odooThumbDir).catch(() => [])).filter((f) => f.endsWith(".jpg")).map((f) => f.slice(0, -4))
  );
  const galleryDir = path.join(REPO_ROOT, "public", "products", "odoo-gallery");
  const haveGallery = new Set<string>();
  for (const d of await fs.readdir(galleryDir).catch(() => [])) {
    const files = await fs.readdir(path.join(galleryDir, d)).catch(() => []);
    if (files.some((f) => /\.(jpe?g|png|webp)$/i.test(f))) haveGallery.add(d);
  }
  const specDir = path.join(REPO_ROOT, "public", "specs", "odoo");
  const haveSpec = new Set(
    (await fs.readdir(specDir).catch(() => [])).filter((f) => f.endsWith(".pdf")).map((f) => f.slice(0, -4))
  );

  const childToParent: Record<string, string> = families.childToParent ?? {};
  const isChild = (id: string) => Boolean(childToParent[id]);
  const inheritedFrom = (id: string): string | null => childToParent[id] ?? null;

  const has = (id: string, field: keyof typeof content[string]) => {
    const own = content[id]?.[field];
    if (own && (typeof own !== "object" || (Array.isArray(own) ? own.length : true))) return true;
    const parent = inheritedFrom(id);
    if (parent) {
      const p = content[parent]?.[field];
      if (p && (typeof p !== "object" || (Array.isArray(p) ? p.length : true))) return true;
    }
    return false;
  };

  // Per-SKU coverage rows
  const rows = csv.map((r) => {
    const parent = inheritedFrom(r.odoo_id);
    return {
      odoo_id: r.odoo_id,
      sku: r.sku,
      brand: r.brand,
      name: r.name,
      role: isChild(r.odoo_id) ? "variant" : (families.parents?.[r.odoo_id] ? "parent" : "single"),
      parent_id: parent ?? "",
      has_thumb: haveThumb.has(r.odoo_id) ? "Y" : "N",
      has_gallery: haveGallery.has(r.odoo_id) || (parent ? haveGallery.has(parent) : false) ? "Y" : "N",
      has_desc_es: has(r.odoo_id, "descriptionEs") ? "Y" : "N",
      has_desc_en: has(r.odoo_id, "descriptionEn") ? "Y" : "N",
      has_features: has(r.odoo_id, "features") ? "Y" : "N",
      has_spec_sheet: haveSpec.has(r.odoo_id) || (parent ? haveSpec.has(parent) : false) ? "Y" : "N",
      desc_source: content[r.odoo_id]?.descriptionSource ?? (parent ? content[parent]?.descriptionSource : "") ?? "",
    };
  });

  // Aggregate
  const total = rows.length;
  const parents = rows.filter((r) => r.role !== "variant").length;
  const variants = rows.filter((r) => r.role === "variant").length;
  const cov = (key: keyof typeof rows[number]) => rows.filter((r) => r[key] === "Y").length;

  const summary = [
    { Metric: "Total SKUs", Count: total },
    { Metric: "Parent products", Count: rows.filter((r) => r.role === "parent").length },
    { Metric: "Singleton products (no variants)", Count: rows.filter((r) => r.role === "single").length },
    { Metric: "Variant children (inherit content from parent)", Count: variants },
    { Metric: "", Count: "" },
    { Metric: "Has thumbnail", Count: cov("has_thumb"), Pct: (cov("has_thumb") / total * 100).toFixed(1) + "%" },
    { Metric: "Has gallery (own or parent)", Count: cov("has_gallery"), Pct: (cov("has_gallery") / total * 100).toFixed(1) + "%" },
    { Metric: "Has Spanish description", Count: cov("has_desc_es"), Pct: (cov("has_desc_es") / total * 100).toFixed(1) + "%" },
    { Metric: "Has English description", Count: cov("has_desc_en"), Pct: (cov("has_desc_en") / total * 100).toFixed(1) + "%" },
    { Metric: "Has feature bullets", Count: cov("has_features"), Pct: (cov("has_features") / total * 100).toFixed(1) + "%" },
    { Metric: "Has spec sheet PDF locally", Count: cov("has_spec_sheet"), Pct: (cov("has_spec_sheet") / total * 100).toFixed(1) + "%" },
  ];

  // Per-brand coverage
  const byBrand = new Map<string, { total: number; thumb: number; gallery: number; descEs: number; descEn: number; spec: number }>();
  for (const r of rows) {
    const b = r.brand || "(blank)";
    const e = byBrand.get(b) ?? { total: 0, thumb: 0, gallery: 0, descEs: 0, descEn: 0, spec: 0 };
    e.total++;
    if (r.has_thumb === "Y") e.thumb++;
    if (r.has_gallery === "Y") e.gallery++;
    if (r.has_desc_es === "Y") e.descEs++;
    if (r.has_desc_en === "Y") e.descEn++;
    if (r.has_spec_sheet === "Y") e.spec++;
    byBrand.set(b, e);
  }
  const brandRows = [...byBrand.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .map(([brand, e]) => ({
      Brand: brand,
      "Total SKUs": e.total,
      "% Thumbnail": (e.thumb / e.total * 100).toFixed(0) + "%",
      "% Gallery": (e.gallery / e.total * 100).toFixed(0) + "%",
      "% ES Desc": (e.descEs / e.total * 100).toFixed(0) + "%",
      "% EN Desc": (e.descEn / e.total * 100).toFixed(0) + "%",
      "% Spec PDF": (e.spec / e.total * 100).toFixed(0) + "%",
    }));

  // Needs-photography list — parent/singleton products with no gallery
  const needsPhoto = rows
    .filter((r) => r.role !== "variant" && r.has_gallery === "N")
    .sort((a, b) => a.brand.localeCompare(b.brand))
    .map((r) => ({
      Brand: r.brand,
      "Odoo ID": r.odoo_id,
      SKU: r.sku,
      Name: r.name.slice(0, 100),
      "Has Thumbnail": r.has_thumb,
      "Has Spec PDF": r.has_spec_sheet,
      "Description Source": r.desc_source,
      "Suggested Shot Type": r.brand?.startsWith("Counter /") ? "Lifestyle (artisanal)" : r.brand === "Emtek" ? "Product on white" : "Product hero",
    }));

  // Write XLSX 1: Gap audit refreshed
  const wb1 = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb1, xlsx.utils.json_to_sheet(summary), "Coverage Summary");
  xlsx.utils.book_append_sheet(wb1, xlsx.utils.json_to_sheet(brandRows), "By Brand");
  xlsx.utils.book_append_sheet(wb1, xlsx.utils.json_to_sheet(rows), "Per-SKU");

  // Column widths for readability
  const summarySheet = wb1.Sheets["Coverage Summary"];
  summarySheet["!cols"] = [{ wch: 50 }, { wch: 12 }, { wch: 10 }];
  wb1.Sheets["By Brand"]["!cols"] = [{ wch: 28 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
  wb1.Sheets["Per-SKU"]["!cols"] = [
    { wch: 10 }, { wch: 22 }, { wch: 24 }, { wch: 50 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
  ];

  const auditOut = path.join(REPO_ROOT, "docs", "audit", "CC-Asset-Gap-Audit.xlsx");
  await fs.mkdir(path.dirname(auditOut), { recursive: true });
  xlsx.writeFile(wb1, auditOut);
  console.log(`[12] ✓ ${auditOut}`);

  const wb2 = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb2, xlsx.utils.json_to_sheet(needsPhoto), "Needs Photography");
  wb2.Sheets["Needs Photography"]["!cols"] = [
    { wch: 28 }, { wch: 10 }, { wch: 26 }, { wch: 56 }, { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 26 },
  ];
  const needsOut = path.join(REPO_ROOT, "docs", "audit", "CC-Needs-Photography.xlsx");
  xlsx.writeFile(wb2, needsOut);
  console.log(`[12] ✓ ${needsOut} (${needsPhoto.length} products need real photography)`);

  console.log("\nHeadline coverage:");
  for (const s of summary) {
    if (s.Pct) console.log(`  ${s.Metric.padEnd(40)} ${String(s.Count).padStart(6)}   ${s.Pct}`);
  }
};

run().catch((e) => { console.error(e); process.exit(1); });
