import { Manifest, MCPToolDefinition } from "../types/index.js";
import { hmacMiddleware } from "../middleware/hmac.middleware.js";
import express, { Request, Response } from "express";
import * as http from "http";

export interface MCPServerOptions {
  port: number;
  hmacSecret: string;
  manifest: Manifest;
  tools: MCPToolDefinition[];
  /**
   * Optional custom health handler. When provided, it replaces the default
   * `GET /health → { status: "ok" }` with a real health check implementation.
   * The handler receives the Express Request/Response and should call res.json().
   */
  healthHandler?: (req: Request, res: Response) => void | Promise<void>;
}

/**
 * Create and start an MCP server with HMAC protection.
 *
 * @param options - Server configuration.
 * @returns HTTP server instance (call `.close()` for graceful shutdown).
 */
export function createMCPServer(options: MCPServerOptions): http.Server {
  const app = express();
  app.use(express.json());

  // Health check is mounted BEFORE the HMAC gate so kubelet probes
  // (which don't send x-signature / x-timestamp) receive 200, not 401.
  app.get("/health", options.healthHandler ?? ((_req: Request, res: Response) => {
    res.json({ status: "ok" });
  }));

  // HMAC middleware protects all routes registered below this line
  app.use(hmacMiddleware(options.hmacSecret));

  // Manifest endpoint
  app.get("/mcp/manifest", (_req: Request, res: Response) => {
    res.json(options.manifest);
  });

  // Tool call endpoint
  app.post("/mcp/call", async (req: Request, res: Response) => {
    const { tool, arguments: args } = req.body as {
      tool: string;
      arguments: Record<string, unknown>;
    };

    const definition = options.tools.find((t) => t.name === tool);
    if (!definition) {
      res.status(404).json({ error: `tool not found: ${tool}` });
      return;
    }

    const context = {
      headers: req.headers,
      method: req.method,
      path: req.originalUrl,
    };

    try {
      const result = await definition.handler(args, context);
      res.json({ result });
    } catch (err: any) {
      // 400 = tool-level error (bad input, auth, business logic)
      // These should be surfaced to the caller, not swallowed as "service error"
      res.status(400).json({ error: err.message || "tool execution failed" });
    }
  });

  const server = app.listen(options.port, () => {
    console.info(`MCP server listening on :${options.port}`);
  });

  return server;
}

/**
 * Build a stripped manifest (handler-free) suitable for serialization.
 */
export function buildManifest(
  manifest: Manifest,
  tools: MCPToolDefinition[]
): Manifest {
  return {
    ...manifest,
    tools: tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema as Record<string, unknown>,
      annotations: t.annotations,
    })),
  };
}
