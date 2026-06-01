# @wazobiatech/nexus-mcp

TypeScript SDK for the Nexus MCP ecosystem. Provides HMAC signing/verification, MCP server scaffolding, and manifest generation.

## Installation

```bash
npm install @wazobiatech/nexus-mcp
```

## Usage

### HMAC Middleware (Express)

```ts
import express from "express";
import { hmacMiddleware } from "@wazobiatech/nexus-mcp";

const app = express();
app.use(hmacMiddleware(process.env.HMAC_SECRET!));
```

### HMAC Guard (NestJS)

```ts
import { HMACGuard } from "@wazobiatech/nexus-mcp";

@UseGuards(new HMACGuard(process.env.HMAC_SECRET!))
@Controller()
export class MyController {}
```

### MCP Server

```ts
import { createMCPServer } from "@wazobiatech/nexus-mcp";

const server = createMCPServer({
  port: 4001,
  hmacSecret: process.env.HMAC_SECRET!,
  manifest: { /* ... */ },
  tools: [ /* MCPToolDefinition[] */ ],
});

// Graceful shutdown
process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
});
```

### Generate Manifest CLI

```bash
npx generate-manifest --context ./src/mcp/context.json --tools "./src/mcp/tools/*.tools.ts" --out ./src/mcp/manifest.json
```

## Testing

```bash
npm test
```

Contract vector tests verify every entry from `nexus-mcp-contract/vectors.json`.

## License

MIT
