import { NextResponse } from "next/server";
import { clearLogs, getLogs } from "@/lib/logger";

export const dynamic = "force-dynamic";

// Dashboard polling helper — intentionally NOT request-logged, so the 2s poll
// does not flood the live feed and bury the actual call-loop lines.
export const GET = async () => {
  return NextResponse.json(await getLogs(), { status: 200 });
};

export const DELETE = async () => {
  await clearLogs();
  return NextResponse.json({ ok: true }, { status: 200 });
};
