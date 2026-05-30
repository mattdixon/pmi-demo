import { redis } from "./redis";

// Ring buffer of log lines, capped at 500. Backed by a Redis list when
// configured (so all Vercel instances share it), else module-scoped memory.

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
const KEY = "pmi:logs";

// In-memory fallback (most-recent-first), survives dev hot-reloads via globalThis.
const g = globalThis as unknown as { __pmiLogBuffer?: LogEntry[] };
const mem: LogEntry[] = (g.__pmiLogBuffer ??= []);

async function push(entry: LogEntry) {
  if (redis) {
    await redis.lpush(KEY, entry);
    await redis.ltrim(KEY, 0, MAX_ENTRIES - 1);
  } else {
    mem.unshift(entry);
    if (mem.length > MAX_ENTRIES) mem.length = MAX_ENTRIES;
  }
}

export async function logRequest(details: {
  method: string;
  path: string;
  query: string;
  body?: unknown;
}) {
  await push({ timestamp: new Date().toISOString(), type: "request", ...details });
}

export async function log(message: string) {
  await push({ timestamp: new Date().toISOString(), type: "app", message });
}

// Most recent first, for the dashboard feed.
export async function getLogs(): Promise<LogEntry[]> {
  if (redis) {
    return (await redis.lrange<LogEntry>(KEY, 0, -1)) ?? [];
  }
  return [...mem];
}

export async function clearLogs(): Promise<void> {
  if (redis) {
    await redis.del(KEY);
  } else {
    mem.length = 0;
  }
}
