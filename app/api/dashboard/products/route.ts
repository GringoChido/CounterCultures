import { NextResponse, type NextRequest } from "next/server";
import {
  readSheet,
  appendRow,
  updateRow,
  deleteRow,
  findRowIndex,
} from "@/app/lib/dashboard-sheets";
import { PRODUCT_CATEGORIES } from "@/app/lib/constants";
import type { CategoryKey } from "@/app/lib/constants";

const VALID_CATEGORIES = Object.keys(PRODUCT_CATEGORIES);

const validateCategory = (
  category: string,
  subcategory: string
): { valid: boolean; error?: string } => {
  if (!VALID_CATEGORIES.includes(category)) {
    return {
      valid: false,
      error: `Invalid category "${category}". Must be one of: ${VALID_CATEGORIES.join(", ")}`,
    };
  }
  const catConfig = PRODUCT_CATEGORIES[category as CategoryKey];
  const validSubs: string[] = catConfig.subcategories.map((s) => s.slug);
  if (!validSubs.includes(subcategory)) {
    return {
      valid: false,
      error: `Invalid subcategory "${subcategory}" for category "${category}". Must be one of: ${validSubs.join(", ")}`,
    };
  }
  return { valid: true };
};

// Must match the actual Products sheet headers exactly
type ProductRecord = {
  id: string;
  sku: string;
  brand: string;
  name: string;
  nameEn: string;
  category: string;
  subcategory: string;
  price: string;
  tradePrice: string;
  currency: string;
  finishes: string;
  images: string;
  artisanal: string;
  description: string;
  descriptionEn: string;
  availability: string;
  featured: string;
  slug: string;
};

const PRODUCT_COLUMNS: (keyof ProductRecord)[] = [
  "id",
  "sku",
  "brand",
  "name",
  "nameEn",
  "category",
  "subcategory",
  "price",
  "tradePrice",
  "currency",
  "finishes",
  "images",
  "artisanal",
  "description",
  "descriptionEn",
  "availability",
  "featured",
  "slug",
];

// GET — list all products (supports ?category= and ?q= text search)
export const GET = async (request: NextRequest) => {
  const category = request.nextUrl.searchParams.get("category");
  const query = request.nextUrl.searchParams.get("q");
  const limitParam = request.nextUrl.searchParams.get("limit");

  try {
    let products = await readSheet<ProductRecord>("Products");

    if (category && category !== "all") {
      products = products.filter((p) => p.category === category);
    }

    if (query) {
      const terms = query.toLowerCase().trim().split(/\s+/);
      products = products.filter((p) => {
        const searchable = [
          p.name, p.nameEn, p.brand, p.sku,
          p.category, p.subcategory, p.description, p.descriptionEn,
          p.finishes,
        ].join(" ").toLowerCase();
        return terms.every((term) => searchable.includes(term));
      });
    }

    const limit = limitParam ? parseInt(limitParam) : undefined;
    const result = limit ? products.slice(0, limit) : products;

    return NextResponse.json({ products: result });
  } catch (err) {
    console.error("[Products API] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
};

// POST — add new product
export const POST = async (request: NextRequest) => {
  try {
    const body: ProductRecord = await request.json();

    const validation = validateCategory(body.category, body.subcategory);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const values = PRODUCT_COLUMNS.map((col) => body[col] ?? "");
    await appendRow("Products", values);

    return NextResponse.json({ success: true, slug: body.slug });
  } catch (err) {
    console.error("[Products API] POST error:", err);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
};

// PATCH — update product by slug
export const PATCH = async (request: NextRequest) => {
  try {
    const body: Partial<ProductRecord> & { slug: string } = await request.json();

    if (!body.slug) {
      return NextResponse.json(
        { error: "slug is required" },
        { status: 400 }
      );
    }

    const rowIdx = await findRowIndex("Products", "slug", body.slug);
    if (rowIdx === null) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const existing = await readSheet<ProductRecord>("Products");
    const current = existing[rowIdx];
    const merged = { ...current, ...body };

    const validation = validateCategory(merged.category, merged.subcategory);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const values = PRODUCT_COLUMNS.map((col) => merged[col] ?? "");
    await updateRow("Products", rowIdx, values);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Products API] PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
};

// DELETE — remove product by slug
export const DELETE = async (request: NextRequest) => {
  try {
    const { slug } = await request.json();

    if (!slug) {
      return NextResponse.json(
        { error: "slug is required" },
        { status: 400 }
      );
    }

    const rowIdx = await findRowIndex("Products", "slug", slug);
    if (rowIdx === null) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    await deleteRow("Products", rowIdx);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Products API] DELETE error:", err);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
};
