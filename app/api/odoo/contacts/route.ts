import { NextRequest, NextResponse } from "next/server";
import { searchRead, searchCount, isConfigured } from "@/app/lib/odoo";

export const GET = async (req: NextRequest) => {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Odoo not configured" }, { status: 500 });
  }

  const params = req.nextUrl.searchParams;
  const type = params.get("type") ?? "customer";
  const limit = Number(params.get("limit") ?? "50");
  const offset = Number(params.get("offset") ?? "0");
  const search = params.get("search") ?? "";

  const domain: unknown[][] = [];
  if (type === "customer") domain.push(["customer_rank", ">", 0]);
  if (type === "supplier") domain.push(["supplier_rank", ">", 0]);
  if (search) domain.push(["name", "ilike", search]);

  try {
    const [contacts, total] = await Promise.all([
      searchRead(
        "res.partner",
        domain,
        [
          "name", "email", "phone", "mobile", "street", "city",
          "country_id", "customer_rank", "supplier_rank",
          "is_company", "company_name", "create_date", "write_date",
        ],
        limit,
        offset,
        "write_date desc"
      ),
      searchCount("res.partner", domain),
    ]);

    return NextResponse.json({ contacts, total, limit, offset });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
};
