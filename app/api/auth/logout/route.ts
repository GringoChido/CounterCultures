import { NextResponse } from "next/server";
import { destroySession } from "@/app/lib/auth";

export const POST = async () => {
  await destroySession();
  return NextResponse.json({ success: true });
};
