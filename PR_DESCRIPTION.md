# 📌 Summary

Implements the **TypeScript SDK** for the Nexus MCP ecosystem (ZIN-4661).  
This package (`@wazobiatech/nexus-mcp`) provides HMAC-SHA256 request signing/verification, MCP server scaffolding, and manifest/tool types so that Node.js Nexus services do not re-implement HMAC logic themselves.

---

# 🛠️ Type of Change

Select all that apply:

- [ ] 🐛 Bug fix (fixes an issue)
- [x] ✨ New feature (adds functionality)
- [ ] 💥 Breaking change (changes existing functionality)
- [x] 📖 Documentation update
- [ ] 🔧 Refactoring (code improvement without changing functionality)
- [ ] 🚀 Performance improvement
- [x] ✅ Test enhancement
- [x] 🏗️ Build/configuration change

---

# 🔄 Changes Made

- `src/middleware/hmac.middleware.ts` — Express middleware + NestJS `HMACGuard` with `crypto.timingSafeEqual`
- `src/server/createMCPServer.ts` — MCP server factory with manifest endpoint, tool call proxy, and graceful shutdown support
- `src/types/index.ts` — `MCPToolDefinition`, `Manifest`, and `ManifestContext` interfaces aligned with contract schemas
- `src/cli/generate-manifest.ts` — `generate-manifest` CLI for bundling `context.json` + tool files into `manifest.json`
- `tests/contract.vectors.spec.ts` — contract vector test suite (16 vectors from `nexus-mcp-contract v1.0.0`)
- `tests/hmac.middleware.spec.ts` — unit tests for valid ✅ / bad sig ❌ / stale ❌ / missing headers ❌
- `.github/workflows/ci.yml` — lint, typecheck, contract vectors, unit tests, and publish to `npm.internal.wazobia.tech` on tag

---

# 🧪 Testing

- [x] Contract vector tests — all 16 canonical HMAC vectors from `nexus-mcp-contract` pass
- [x] Unit tests for HMAC middleware/guard (valid ✅, bad sig ❌, stale timestamp ❌, missing headers ❌)
- [x] TypeScript compile check (`tsc --noEmit`) passes
- [x] Manual smoke test locally
- [ ] Integration tests added/updated
- [ ] End-to-end (E2E) tests added/updated

---

# 🧩 Test Environment

- [x] Local development
- [ ] Staging
- [ ] Production
- [ ] Other (specify):

---

# 📸 Screenshots / Demos

N/A — No UI redesign

---

# 🔗 Related Issues / Tickets

- **Blocks:** ZIN-4638, ZIN-4639, ZIN-4640 (Mercury MCP), ZIN-4655-T2/T3 (Aggregator manifest & tool routing)
- **Blocked by:** ZIN-4660 (nexus-mcp-contract v1.0.0)

---

# 📝 Release Notes (for tag `v1.0.0`)

- HMAC-SHA256 signing/verification (Express middleware + NestJS guard)
- MCP server factory with manifest and tool-call endpoints
- `MCPToolDefinition` and `Manifest` TypeScript types
- `generate-manifest` CLI for service manifest generation
- Full contract vector test coverage

---

# ✅ Pre-merge Checklist

- [x] CI passes (lint + typecheck + tests)
- [x] Contract vector tests pass against `nexus-mcp-contract v1.0.0`
- [x] README updated with install/usage examples
- [x] Version bumped to `1.0.0`
- [ ] SDK team review sign-off
