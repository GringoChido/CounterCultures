import { NextResponse, type NextRequest } from "next/server";
import {
  generatePnLReport,
  type PeriodType,
} from "@/app/lib/pnl-report";

type Company = "cc" | "llc" | "combined";

export const GET = async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;

  const company = (sp.get("company") ?? "combined") as Company;
  const periodType = (sp.get("periodType") ?? "month") as PeriodType;
  const year = parseInt(sp.get("year") ?? String(new Date().getFullYear()), 10);
  const period = parseInt(
    sp.get("period") ?? String(new Date().getMonth() + 1),
    10
  );
  const includePrior = sp.get("prior") !== "false";

  try {
    const report = await generatePnLReport({
      company,
      periodType,
      year,
      period,
      includePrior,
    });

    return NextResponse.json(report);
  } catch (err) {
    console.error("[reports/pnl] error:", err);
    return NextResponse.json(
      { error: "Failed to generate P&L report" },
      { status: 500 }
    );
  }
};
