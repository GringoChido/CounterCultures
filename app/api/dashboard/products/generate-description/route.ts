import { NextResponse, type NextRequest } from "next/server";
import { generateDescription } from "@/app/lib/product-descriptions";
import { getProductById } from "@/app/lib/products-full";

/**
 * Generate AI descriptions for a single product. Auth-gated by middleware
 * (any /api/dashboard/* path requires a valid session cookie). The new row
 * is written with status="pending" — Roger flips it to "approved" in the
 * sheet to gate public surfacing.
 */
export const POST = async (req: NextRequest) => {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      productId?: string;
    };
    if (!body.productId) {
      return NextResponse.json(
        { error: "productId is required" },
        { status: 400 }
      );
    }

    const product = await getProductById(body.productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const result = await generateDescription({ product });
    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        sku: product.sku,
        name: product.name,
        brand: product.brand,
      },
      ...result,
    });
  } catch (err) {
    console.error("[products/generate-description] error:", err);
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};
