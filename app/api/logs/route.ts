import { NextResponse } from "next/server";
import { getLogs } from "@/lib/logger";

export const dynamic = "force-dynamic";

// Dashboard polling helper — intentionally NOT request-logged, so the 2s poll
// does not flood the live feed and bury the actual call-loop lines.
export const GET = async () => {
  return NextResponse.json(getLogs(), { status: 200 });
};
