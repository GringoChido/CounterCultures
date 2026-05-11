import { NextResponse } from "next/server";
import { getLatestPeriodWithData } from "@/app/lib/pnl-report";

export const GET = async () => {
  try {
    const result = await getLatestPeriodWithData();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[reports/pnl/latest] error:", err);
    const now = new Date();
    return NextResponse.json(
      { year: now.getFullYear(), month: now.getMonth() + 1 },
      { status: 500 }
    );
  }
};
