import { NextResponse } from "next/server";
import { listReps } from "@/app/lib/reps";

export const GET = async () => {
  try {
    const reps = await listReps();
    return NextResponse.json({ reps });
  } catch (err) {
    console.error("[Reps API] GET error:", err);
    return NextResponse.json({ reps: [] });
  }
};
