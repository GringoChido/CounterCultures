import { NextResponse, type NextRequest } from "next/server";
import {
  readSheet,
  appendRow,
  updateRow,
  deleteRow,
  findRowIndex,
} from "@/app/lib/dashboard-sheets";

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

// GET — list all products
export const GET = async (request: NextRequest) => {
  const category = request.nextUrl.searchParams.get("category");

  try {
    let products = await readSheet<ProductRecord>("Products");

    if (category && category !== "all") {
      products = products.filter((p) => p.category === category);
    }

    return NextResponse.json({ products });
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
