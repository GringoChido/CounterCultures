import { NextResponse } from "next/server";
import { testConnection, isConfigured } from "@/app/lib/odoo";

export const GET = async () => {
  if (!isConfigured()) {
    return NextResponse.json(
      { success: false, error: "Odoo credentials not configured" },
      { status: 500 }
    );
  }

  const result = await testConnection();
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
};
