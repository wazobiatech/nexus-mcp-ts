# ZIN-4661 — @wazobiatech/nexus-mcp Handoff

## Status: COMPLETED

All blockers and noted issues resolved. PR is ready to merge.

---

## Fixes Applied

### ✅ `.npmrc` — private registry now active
- Uncommented `@wazobiatech:registry=https://npm.internal.wazobia.tech`
- `npm publish` will now correctly route `@wazobiatech` scope to the private registry

### ✅ Test bodies — all assertions present
- `tests/hmac.middleware.spec.ts`: valid ✅, missing headers ❌, bad sig ❌, stale timestamp ❌ — all real
- `tests/hmac.middleware.spec.ts`: `HMACGuard` — valid ✅, throws on missing headers ❌ — all real
- `tests/contract.vectors.spec.ts`: all 16 contract vectors run via `it.each`

---

## What Was Already Correct

- HMAC payload: `METHOD.toUpperCase() + originalUrl + timestamp` (includes query string via `req.originalUrl`) ✅
- `crypto.timingSafeEqual` used correctly with hex → Buffer conversion ✅
- Exports both Express `hmacMiddleware` and NestJS `HMACGuard` ✅
- `createMCPServer({ port, hmacSecret, manifest, tools })` returns `http.Server` ✅
- `MCPToolDefinition.handler` stripped from `Manifest` serialisation via `Omit` ✅
- `generate-manifest` CLI with `--context`, `--tools`, `--out` and AJV validation ✅
- CI: typecheck → lint → contract vectors → unit tests → publish on `v*` tag ✅
- `exports` map for tree-shaking in `package.json` ✅

---

## Nothing Left
