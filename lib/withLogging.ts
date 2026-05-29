import { NextRequest, NextResponse } from "next/server";
import { logRequest } from "./logger";

type Handler = (req: NextRequest, body: unknown) => Promise<Response> | Response;

// Wraps a route handler so the incoming request is logged BEFORE the handler runs.
// The request body (if any) is read once here and passed through to the handler.
export function withLogging(handler: Handler) {
  return async (req: NextRequest): Promise<Response> => {
    const url = new URL(req.url);
    let body: unknown = undefined;

    if (req.method !== "GET" && req.method !== "HEAD") {
      const text = await req.text();
      if (text) {
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
        }
      }
    }

    logRequest({
      method: req.method,
      path: url.pathname,
      query: url.search,
      body,
    });

    try {
      return await handler(req, body);
    } catch {
      return NextResponse.json({ error: "internal error" }, { status: 500 });
    }
  };
}
