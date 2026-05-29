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

const g = globalThis as unknown as {
  __pmiTickets?: Ticket[];
  __pmiTicketSeq?: number;
};

const store: Ticket[] = (g.__pmiTickets ??= []);
if (g.__pmiTicketSeq === undefined) g.__pmiTicketSeq = 0;

export function createTicket(input: Omit<Ticket, "ticket_id" | "created_at">): Ticket {
  g.__pmiTicketSeq! += 1;
  const ticket: Ticket = {
    ticket_id: g.__pmiTicketSeq!,
    created_at: new Date().toISOString(),
    ...input,
  };
  store.push(ticket);
  return ticket;
}

// Most recent first, for the dashboard table.
export function getTickets(): Ticket[] {
  return [...store].reverse();
}
