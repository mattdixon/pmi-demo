import { Redis } from "@upstash/redis";

// Shared store so state is consistent across Vercel serverless instances.
// Supports both Upstash-native env names and the Vercel KV / Marketplace names.
const url =
  process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token =
  process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

export const redis = url && token ? new Redis({ url, token }) : null;

// When no Redis is configured (e.g. local dev with no creds), callers fall back
// to module-scoped memory — which is fine locally because there's one process.
export const usingRedis = redis !== null;
