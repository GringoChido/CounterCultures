import { NextResponse, type NextRequest } from "next/server";
import { getCustomerList } from "@/app/lib/odoo-sheets";

export const GET = async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.toLowerCase().trim() ?? "";
  const type = sp.get("type") ?? "customer"; // customer | open_ar
  const sortBy = sp.get("sort") ?? "activity"; // activity | name | outstanding | invoiced
  const limit = Math.min(Number(sp.get("limit") ?? 100), 1000);
  const offset = Math.max(Number(sp.get("offset") ?? 0), 0);

  try {
    let rows = await getCustomerList();

    const isCustomer = (r: typeof rows[number]) => r.customerRank > 0 || r.orderCount > 0;
    if (type === "open_ar") rows = rows.filter((r) => isCustomer(r) && r.outstanding > 0);
    else rows = rows.filter(isCustomer);

    if (q) {
      rows = rows.filter((r) => {
        const hay = `${r.name} ${r.email} ${r.phone} ${r.vat} ${r.city} ${r.display_name}`.toLowerCase();
        return hay.includes(q);
      });
    }

    const sort = (a: typeof rows[number], b: typeof rows[number]) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "outstanding") return b.outstanding - a.outstanding;
      if (sortBy === "invoiced") return b.totalInvoiced - a.totalInvoiced;
      // default: most-recently-active first
      return (b.lastActivity ?? "").localeCompare(a.lastActivity ?? "");
    };
    rows.sort(sort);

    const total = rows.length;
    const paged = rows.slice(offset, offset + limit);
    return NextResponse.json({ customers: paged, total, offset, limit });
  } catch (err) {
    console.error("[customers API] error:", err);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
};
