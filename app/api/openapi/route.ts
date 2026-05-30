import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// OpenAPI 3.1 spec for the POC API. Served as JSON and rendered by /docs.
// Not request-logged (docs helper, not part of the call loop).
const spec = {
  openapi: "3.1.0",
  info: {
    title: "PMI Aspire — AI Receptionist POC API",
    version: "0.1.0",
    description:
      "Mocked AppFolio call loop: look up a tenant, then create a ticket. " +
      "All state is in memory (no database).",
  },
  servers: [{ url: "/", description: "current origin" }],
  paths: {
    "/api/lookup": {
      get: {
        summary: "Look up a tenant by complex + unit",
        description: "Case-insensitive match on complex name and unit.",
        parameters: [
          {
            name: "complex",
            in: "query",
            required: true,
            schema: { type: "string" },
            example: "Aspire Heights",
          },
          {
            name: "unit",
            in: "query",
            required: true,
            schema: { type: "string" },
            example: "3B",
          },
        ],
        responses: {
          "200": {
            description: "Tenant found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Tenant" },
              },
            },
          },
          "404": {
            description: "No tenant found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: { error: "not found" },
              },
            },
          },
        },
      },
      post: {
        summary: "Look up a tenant by complex + unit (JSON body)",
        description:
          "Same lookup as GET, but complex/unit are passed in the JSON body. " +
          "Used by the Retell lookup_apartment tool when configured as a POST " +
          "with an LLM-filled parameter schema.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["complex", "unit"],
                properties: {
                  complex: { type: "string", example: "Cherry Creek Commons" },
                  unit: { type: "string", example: "2A" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Tenant found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Tenant" },
              },
            },
          },
          "404": {
            description: "No tenant found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: { error: "not found" },
              },
            },
          },
        },
      },
    },
    "/api/tickets": {
      post: {
        summary: "Create a ticket",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/NewTicket" },
              examples: {
                callback: {
                  summary: "Path A — callback",
                  value: {
                    tenant_id: 1,
                    issue_type: "callback",
                    description: "needs a call back about the lease",
                  },
                },
                urgent: {
                  summary: "Path B — urgent",
                  value: {
                    tenant_id: 6,
                    issue_type: "urgent",
                    description: "water leaking from ceiling",
                  },
                },
                maintenance: {
                  summary: "Path C — maintenance",
                  value: {
                    tenant_id: 6,
                    issue_type: "maintenance",
                    description: "dishwasher isn't draining",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Ticket created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Ticket" },
              },
            },
          },
          "400": {
            description: "Invalid tenant_id",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: { error: "invalid tenant_id" },
              },
            },
          },
        },
      },
      get: {
        summary: "List all tickets (most recent first)",
        responses: {
          "200": {
            description: "All tickets in memory",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Ticket" },
                },
              },
            },
          },
        },
      },
    },
    "/api/logs": {
      get: {
        summary: "Live log buffer (most recent first)",
        responses: {
          "200": {
            description: "In-memory ring buffer (max 500 entries)",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/LogEntry" },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Tenant: {
        type: "object",
        properties: {
          tenant_id: { type: "integer", example: 6 },
          first_name: { type: "string", example: "Morgan" },
          last_name: { type: "string", example: "Ellis" },
          phone: { type: "string", example: "(615) 555-1006" },
          lease_end: { type: "string", example: "2026-12-31" },
          complex: { type: "string", example: "Aspire Heights" },
          unit: { type: "string", example: "3B" },
        },
      },
      NewTicket: {
        type: "object",
        required: ["tenant_id", "issue_type", "description"],
        properties: {
          tenant_id: { type: "integer", example: 6 },
          issue_type: {
            type: "string",
            enum: ["callback", "urgent", "maintenance"],
            example: "urgent",
          },
          description: { type: "string", example: "water leaking from ceiling" },
        },
      },
      Ticket: {
        type: "object",
        properties: {
          ticket_id: { type: "integer", example: 1 },
          tenant_id: { type: "integer", example: 6 },
          tenant_name: { type: "string", example: "Morgan Ellis" },
          complex: { type: "string", example: "Aspire Heights" },
          unit: { type: "string", example: "3B" },
          issue_type: {
            type: "string",
            enum: ["callback", "urgent", "maintenance"],
            example: "urgent",
          },
          description: { type: "string", example: "water leaking from ceiling" },
          created_at: { type: "string", format: "date-time" },
        },
      },
      LogEntry: {
        oneOf: [
          {
            type: "object",
            properties: {
              timestamp: { type: "string", format: "date-time" },
              type: { type: "string", enum: ["request"] },
              method: { type: "string", example: "GET" },
              path: { type: "string", example: "/api/lookup" },
              query: { type: "string", example: "?complex=Aspire%20Heights&unit=3B" },
              body: {},
            },
          },
          {
            type: "object",
            properties: {
              timestamp: { type: "string", format: "date-time" },
              type: { type: "string", enum: ["app"] },
              message: { type: "string", example: "Ticket #1 created" },
            },
          },
        ],
      },
      Error: {
        type: "object",
        properties: { error: { type: "string" } },
      },
    },
  },
} as const;

export const GET = async () => {
  return NextResponse.json(spec, { status: 200 });
};
