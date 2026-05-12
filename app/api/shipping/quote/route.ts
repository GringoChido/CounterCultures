import { NextResponse, type NextRequest } from "next/server";
import { getRates } from "@/app/lib/shipping/skydropx";

export async function POST(req: NextRequest) {
  try {
    const { items, address } = await req.json();

    if (!address?.postal || !address?.country) {
      return NextResponse.json({ error: "Missing address" }, { status: 400 });
    }

    const parcels = Array.isArray(items)
      ? items.map((item: { weight_kg?: number; length_cm?: number; width_cm?: number; height_cm?: number; quantity?: number }) => ({
          weight_kg: (item.weight_kg ?? 5) * (item.quantity ?? 1),
          length_cm: item.length_cm ?? 30,
          width_cm: item.width_cm ?? 30,
          height_cm: (item.height_cm ?? 20) * (item.quantity ?? 1),
        }))
      : [{ weight_kg: 5, length_cm: 30, width_cm: 30, height_cm: 20 }];

    const rates = await getRates({
      fromZip: process.env.SHIPPING_ORIGIN_ZIP || "37700",
      toZip: address.postal,
      country: address.country,
      parcels,
    });

    return NextResponse.json({ rates });
  } catch (err) {
    console.error("[shipping/quote] Error:", err);
    return NextResponse.json({ rates: [] });
  }
}
