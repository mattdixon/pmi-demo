import { NextResponse } from "next/server";
import { withLogging } from "@/lib/withLogging";
import { getTenantById } from "@/lib/seed";
import { createTicket, getTickets, IssueType } from "@/lib/tickets";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

export const POST = withLogging(async (_req, body) => {
  const data = (body ?? {}) as {
    tenant_id?: unknown;
    issue_type?: unknown;
    description?: unknown;
  };

  const tenant_id = Number(data.tenant_id);
  const issue_type = data.issue_type as IssueType;
  const description = typeof data.description === "string" ? data.description : "";

  await log(
    `Creating ${issue_type} ticket for tenant_id ${data.tenant_id}: ${description}`
  );

  const tenant = Number.isInteger(tenant_id) ? getTenantById(tenant_id) : undefined;

  if (!tenant) {
    await log("Invalid tenant_id");
    return NextResponse.json({ error: "invalid tenant_id" }, { status: 400 });
  }

  const ticket = await createTicket({
    tenant_id: tenant.tenant_id,
    tenant_name: `${tenant.first_name} ${tenant.last_name}`,
    complex: tenant.complex,
    unit: tenant.unit,
    issue_type,
    description,
  });

  await log(`Ticket #${ticket.ticket_id} created`);
  return NextResponse.json(ticket, { status: 201 });
});

// Dashboard polling helper — intentionally NOT request-logged (see /api/logs).
export const GET = async () => {
  return NextResponse.json(await getTickets(), { status: 200 });
};
