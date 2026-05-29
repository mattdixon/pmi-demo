import { NextRequest, NextResponse } from "next/server";
import { withLogging } from "@/lib/withLogging";
import { findTenant } from "@/lib/seed";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

export const GET = withLogging(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const complex = searchParams.get("complex") ?? "";
  const unit = searchParams.get("unit") ?? "";

  await log(`Searching for unit ${unit} in complex ${complex}`);

  const tenant = findTenant(complex, unit);

  if (!tenant) {
    await log(`No tenant found for ${complex} unit ${unit}`);
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await log(
    `Found tenant ${tenant.first_name} ${tenant.last_name} (tenant_id: ${tenant.tenant_id})`
  );
  return NextResponse.json(tenant, { status: 200 });
});
