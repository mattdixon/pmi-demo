// Module-scoped ring buffer, capped at 500 entries.
// Survives between requests within a single running process (no DB).

export type RequestLogEntry = {
  timestamp: string;
  type: "request";
  method: string;
  path: string;
  query: string;
  body?: unknown;
};

export type AppLogEntry = {
  timestamp: string;
  type: "app";
  message: string;
};

export type LogEntry = RequestLogEntry | AppLogEntry;

const MAX_ENTRIES = 500;

// Use globalThis so the buffer survives Next.js dev hot-reloads (which re-evaluate modules).
const g = globalThis as unknown as { __pmiLogBuffer?: LogEntry[] };
const buffer: LogEntry[] = (g.__pmiLogBuffer ??= []);

function push(entry: LogEntry) {
  buffer.push(entry);
  if (buffer.length > MAX_ENTRIES) {
    buffer.splice(0, buffer.length - MAX_ENTRIES);
  }
}

export function logRequest(details: {
  method: string;
  path: string;
  query: string;
  body?: unknown;
}) {
  push({ timestamp: new Date().toISOString(), type: "request", ...details });
}

export function log(message: string) {
  push({ timestamp: new Date().toISOString(), type: "app", message });
}

// Most recent first, for the dashboard feed.
export function getLogs(): LogEntry[] {
  return [...buffer].reverse();
}
