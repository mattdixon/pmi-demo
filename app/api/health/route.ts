import { NextResponse } from "next/server";
import { redis, usingRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";

// Diagnostic helper (not request-logged). Reports whether the shared Redis
// store is actually wired up — if `configured` is false on a deployed app,
// state is per-instance and the dashboard will flicker between instances.
export const GET = async () => {
  let connected = false;
  let error: string | undefined;

  if (redis) {
    try {
      connected = (await redis.ping()) === "PONG";
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
  }

  const body = {
    ok: usingRedis ? connected : true,
    store: usingRedis ? "redis" : "in-memory (fallback)",
    redis: { configured: usingRedis, connected, ...(error ? { error } : {}) },
    note: usingRedis
      ? undefined
      : "No Redis credentials detected — state is per-instance and will be inconsistent on multi-instance hosts like Vercel.",
  };

  return NextResponse.json(body, { status: body.ok ? 200 : 503 });
};
