import { redis } from "./redis";

export type IssueType = "callback" | "urgent" | "maintenance";

export type Ticket = {
  ticket_id: number;
  tenant_id: number;
  tenant_name: string;
  complex: string;
  unit: string;
  issue_type: IssueType;
  description: string;
  created_at: string;
};

const KEY = "pmi:tickets";
const SEQ_KEY = "pmi:ticket:seq";

// In-memory fallback when Redis isn't configured (single-process local dev).
const g = globalThis as unknown as {
  __pmiTickets?: Ticket[];
  __pmiTicketSeq?: number;
};
const mem: Ticket[] = (g.__pmiTickets ??= []);
if (g.__pmiTicketSeq === undefined) g.__pmiTicketSeq = 0;

export async function createTicket(
  input: Omit<Ticket, "ticket_id" | "created_at">
): Promise<Ticket> {
  if (redis) {
    const ticket_id = await redis.incr(SEQ_KEY);
    const ticket: Ticket = {
      ticket_id,
      created_at: new Date().toISOString(),
      ...input,
    };
    await redis.lpush(KEY, ticket);
    return ticket;
  }

  g.__pmiTicketSeq! += 1;
  const ticket: Ticket = {
    ticket_id: g.__pmiTicketSeq!,
    created_at: new Date().toISOString(),
    ...input,
  };
  mem.unshift(ticket);
  return ticket;
}

// Most recent first, for the dashboard table.
export async function getTickets(): Promise<Ticket[]> {
  if (redis) {
    return (await redis.lrange<Ticket>(KEY, 0, -1)) ?? [];
  }
  return [...mem];
}
