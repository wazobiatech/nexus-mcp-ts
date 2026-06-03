# 📌 Summary

Implements the **TypeScript SDK** for the Nexus MCP ecosystem (ZIN-4661).  
This package (`@wazobiatech/nexus-mcp`) provides HMAC-SHA256 signing/verification, MCP server scaffolding, and manifest generation so that TypeScript/NestJS Nexus services do not re-implement HMAC logic themselves.

---

# 🛠️ Type of Change

- [ ] 🐛 Bug fix
- [x] ✨ New feature
- [ ] 💥 Breaking change
- [x] 📖 Documentation update
- [ ] 🔧 Refactoring
- [x] ✅ Test enhancement
- [x] 🏗️ Build/configuration change

---

# 🔄 Changes Made

- `src/middleware/hmac.middleware.ts` — Express `hmacMiddleware` + NestJS `HMACGuard` (throws `UnauthorizedException` → 401, not 500); `computeSignature` exported so tests pin the real signer
- `src/server/createMCPServer.ts` — `createMCPServer()` factory returning `http.Server`; `/health` mounted before HMAC gate
- `src/types/index.ts` — `MCPToolDefinition`, `Manifest` types; `handler` stripped from manifest JSON via `Omit`
- `src/cli/generate-manifest.ts` — CLI with `--context`, `--tools`, `--out`; default glob targets compiled `.js`
- `tests/contract.vectors.spec.ts` — imports production `computeSignature`; all 16 contract vectors from `nexus-mcp-contract v1.0.0`
- `tests/hmac.middleware.spec.ts` — valid ✅ / bad sig ❌ / stale ❌ / missing headers ❌ + HMACGuard cases
- `bitbucket-pipelines.yml` — lint → typecheck → contract vectors → unit tests → tag↔version guard → publish on `v*` tag (uses Node built-in `fetch` — no curl dependency on slim image)
- `package.json` — version `1.0.6`; redundant `./dist/middleware/...` export entries removed

---

# 🧪 Testing

- [x] Contract vector tests — all 16 canonical HMAC vectors pass against production `computeSignature`
- [x] Unit tests for HMAC middleware and guard
- [x] TypeScript type check passes
- [x] ESLint passes
- [ ] Integration tests
- [ ] E2E tests

---

# 🧩 Test Environment

- [x] Local development
- [ ] Staging
- [ ] Production

---

# 📸 Screenshots / Demos

N/A

---

# 🔗 Related Issues / Tickets

- **Blocks:** ZIN-4638, ZIN-4639, ZIN-4640 (Mercury MCP)
- **Blocked by:** ZIN-4660 (nexus-mcp-contract v1.0.0)

---

# 📝 Release Notes (for tag `v1.0.6`)

- HMAC-SHA256 Express middleware and NestJS guard
- `computeSignature` exported for contract vector pinning
- `HMACGuard` now returns 401 (via `UnauthorizedException`) instead of 500
- `createMCPServer()` returns `http.Server` for graceful shutdown
- `generate-manifest` CLI defaults to compiled `.js` tool files

---

# ✅ Pre-merge Checklist

- [x] CI passes (typecheck + lint + contract vectors + unit tests)
- [x] Contract vector tests pass against `nexus-mcp-contract v1.0.0`
- [x] README updated
- [x] Version bumped to `1.0.6`
- [x] `NPM_TOKEN` Bitbucket repo variable set before tagging
- [ ] SDK team review sign-off
