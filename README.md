# @wazobiatech/nexus-mcp

TypeScript SDK for the Nexus MCP ecosystem. Provides HMAC signing/verification, MCP server scaffolding, and manifest generation.

## Installation

```bash
npm install @wazobiatech/nexus-mcp
```

### Peer dependencies

`@nestjs/common` is a required peer dependency because `HMACGuard` uses `Injectable` and `UnauthorizedException` at runtime. Express-only consumers don't need it; NestJS consumers do.

```bash
# NestJS users
npm install @wazobiatech/nexus-mcp @nestjs/common
# plus, in your process entry: import 'reflect-metadata';
```

```bash
# Express-only users
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
# Option A — pre-compile first (recommended)
tsc && npx generate-manifest --context ./src/mcp/context.json --tools "./dist/mcp/tools/*.tools.js" --out ./src/mcp/manifest.json

# Option B — run TypeScript sources directly via ts-node
npx ts-node ./node_modules/.bin/generate-manifest --context ./src/mcp/context.json --tools "./src/mcp/tools/*.tools.ts" --out ./src/mcp/manifest.json
```

## Testing

```bash
npm test
```

Contract vector tests verify every entry from `nexus-mcp-contract/vectors.json`.

## License

MIT
