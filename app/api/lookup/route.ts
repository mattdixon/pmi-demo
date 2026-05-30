import { NextRequest, NextResponse } from "next/server";
import { withLogging } from "@/lib/withLogging";
import { findTenant } from "@/lib/seed";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

function lookup(complex: string, unit: string) {
  return findTenant(complex, unit);
}

async function respond(complex: string, unit: string) {
  await log(`Searching for unit ${unit} in complex ${complex}`);

  const tenant = lookup(complex, unit);

  if (!tenant) {
    await log(`No tenant found for ${complex} unit ${unit}`);
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await log(
    `Found tenant ${tenant.first_name} ${tenant.last_name} (tenant_id: ${tenant.tenant_id})`
  );
  return NextResponse.json(tenant, { status: 200 });
}

// GET: complex/unit come from the query string (Swagger, curl, dashboard).
export const GET = withLogging(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  return respond(searchParams.get("complex") ?? "", searchParams.get("unit") ?? "");
});

// POST: complex/unit come from the JSON body. This is the path Retell uses when
// the lookup_apartment function is configured as a POST tool with an LLM-filled
// parameter schema, so the model can pass values extracted from the live call.
export const POST = withLogging(async (_req, body) => {
  const data = (body ?? {}) as { complex?: unknown; unit?: unknown };
  const complex = typeof data.complex === "string" ? data.complex : "";
  const unit = typeof data.unit === "string" ? data.unit : "";
  return respond(complex, unit);
});
