"use client";

import { useEffect, useState } from "react";

type LogEntry =
  | {
      timestamp: string;
      type: "request";
      method: string;
      path: string;
      query: string;
      body?: unknown;
    }
  | { timestamp: string; type: "app"; message: string };

type Ticket = {
  ticket_id: number;
  tenant_id: number;
  tenant_name: string;
  complex: string;
  unit: string;
  issue_type: "callback" | "urgent" | "maintenance";
  description: string;
  created_at: string;
};

const URGENT = /\burgent\b/i;

function isUrgentLog(entry: LogEntry): boolean {
  if (entry.type === "app") return URGENT.test(entry.message);
  // request line is urgent if its body marks an urgent ticket
  const body = entry.body as { issue_type?: string } | undefined;
  return body?.issue_type === "urgent";
}

function hasBody(entry: Extract<LogEntry, { type: "request" }>): boolean {
  return entry.body !== undefined && entry.body !== null;
}

// Collapsible JSON payload: one-line preview with an expand toggle, full
// pretty-printed body when open. Keeps long bodies from flooding the feed.
function Payload({ body }: { body: unknown }) {
  const [open, setOpen] = useState(false);
  const oneLine = JSON.stringify(body);
  const pretty = JSON.stringify(body, null, 2);
  // Short payloads aren't worth a toggle — show them inline.
  if (oneLine.length <= 60) {
    return <span className="payload-inline">{oneLine}</span>;
  }
  return (
    <span className="payload">
      <button
        type="button"
        className="payload-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? "▾ payload" : "▸ payload"}
      </button>
      {open ? (
        <pre className="payload-body">{pretty}</pre>
      ) : (
        <span className="payload-preview">
          {oneLine.slice(0, 57)}…
        </span>
      )}
    </span>
  );
}

type Health = { store: string; redis: { configured: boolean; connected: boolean } };

export default function Dashboard() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    let alive = true;

    async function poll() {
      try {
        const [logsRes, ticketsRes] = await Promise.all([
          fetch("/api/logs", { cache: "no-store" }),
          fetch("/api/tickets", { cache: "no-store" }),
        ]);
        if (!alive) return;
        if (logsRes.ok) setLogs(await logsRes.json());
        if (ticketsRes.ok) setTickets(await ticketsRes.json());
      } catch {
        /* transient fetch errors are ignored; next tick retries */
      }
    }

    fetch("/api/health", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((h) => alive && setHealth(h))
      .catch(() => {});

    poll();
    const id = setInterval(poll, 2000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const storeOk = health?.redis.configured && health.redis.connected;

  return (
    <>
      {health && (
        <div className={`store-badge ${storeOk ? "ok" : "warn"}`}>
          {storeOk
            ? "Connected"
            : "Shared store: in-memory fallback — entries may flicker on Vercel (provision Upstash Redis)"}
        </div>
      )}
      <section className="panel">
        <div className="panel-title">
          <span>
            <span className="dot" />
            Live log feed
          </span>
          <span className="title-actions">
            <span>{logs.length} entries</span>
            <button
              type="button"
              className="clear-btn"
              onClick={async () => {
                await fetch("/api/logs", { method: "DELETE" });
                setLogs([]);
              }}
              disabled={logs.length === 0}
            >
              Clear
            </button>
          </span>
        </div>
        <div className="feed">
          {logs.length === 0 && (
            <div className="empty">Waiting for activity…</div>
          )}
          {logs.map((entry, i) => {
            const urgent = isUrgentLog(entry);
            const cls = `log-line ${entry.type}${urgent ? " urgent" : ""}`;
            const tag = entry.type === "request" ? entry.method : "app";
            return (
              <div key={i} className={cls}>
                <span className="ts">{entry.timestamp}</span>
                <span className="tag">{tag}</span>
                <span className="msg">
                  {entry.type === "request" ? (
                    <>
                      {entry.path}
                      {entry.query ?? ""}
                      {hasBody(entry) && (
                        <>
                          {" "}
                          <Payload body={entry.body} />
                        </>
                      )}
                    </>
                  ) : (
                    entry.message
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          <span>Tickets</span>
          <span>{tickets.length} total</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Ticket #</th>
              <th>Created</th>
              <th>Complex</th>
              <th>Unit</th>
              <th>Tenant</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 && (
              <tr>
                <td colSpan={7} className="empty">
                  No tickets yet.
                </td>
              </tr>
            )}
            {tickets.map((t) => (
              <tr
                key={t.ticket_id}
                className={t.issue_type === "urgent" ? "urgent" : ""}
              >
                <td>#{t.ticket_id}</td>
                <td>{t.created_at}</td>
                <td>{t.complex}</td>
                <td>{t.unit}</td>
                <td>{t.tenant_name}</td>
                <td className={`type-${t.issue_type}`}>{t.issue_type}</td>
                <td>{t.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
