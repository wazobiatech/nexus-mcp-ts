# ZIN-4661 — @wazobiatech/nexus-mcp Handoff

## Status: 🔍 Review

Blocking PR review issues resolved. Deferred design decisions documented below.

---

## Fixes Applied

### ✅ `.npmrc` — private registry active
- Uncommented `@wazobiatech:registry=https://npm.internal.wazobia.tech`

### ✅ Test bodies — all assertions present
- `tests/hmac.middleware.spec.ts`: all four middleware cases + HMACGuard cases real
- `tests/contract.vectors.spec.ts`: imports production `computeSignature` — drift now fails CI

### ✅ `HMACGuard` returns 401, not 500
- `unauthorizedError()` helper tries `UnauthorizedException` from `@nestjs/common` (optional peer dep), falls back to plain `Error`

### ✅ Contract vectors pin real signer
- `computeSignature` exported from `hmac.middleware.ts`
- Both test files import it — a canonicalization change will fail CI

### ✅ `generate-manifest` CLI — compiled-JS default
- Default `--tools` glob changed to `./dist/mcp/tools/*.tools.js`
- README updated with both Option A (pre-compile) and Option B (ts-node)

### ✅ Publish pipeline hardened (Bitbucket)
- `bitbucket-pipelines.yml` added — this is the active CI (`.github/workflows/ci.yml` deleted)
- Publish step runs `npm ci` before `npm run build` so `tsc` is available in the fresh container
- `NPM_TOKEN` env variable wired to `npm.internal.wazobia.tech` via `.npmrc` append
- Tag↔version guard: pipeline fails if `$BITBUCKET_TAG` ≠ `package.json` version

### ✅ `exports` map cleaned
- Removed redundant `./dist/middleware/hmac.middleware` and `./dist/middleware/hmac.middleware.js` entries

---

## What Was Already Correct

- HMAC payload: `METHOD.toUpperCase() + originalUrl + timestamp` ✅
- `crypto.timingSafeEqual` with hex → Buffer ✅
- `createMCPServer` returns `http.Server` ✅
- `MCPToolDefinition.handler` stripped from manifest JSON via `Omit` ✅
- `/health` mounted before HMAC middleware ✅

---

## Open / Deferred (not blockers)

- **Body not signed**: `POST /mcp/call` arguments aren't covered by HMAC. Replay possible within 300s window. Acceptable for internal mesh — needs explicit decision in `SIGNING.md` if intentional.
- **No server-side inputSchema validation**: AJV is already a dependency; could validate `arguments` against each tool's `inputSchema` in `createMCPServer` for free.

---

## Before Tagging

1. `package.json` is at `1.0.6` — tag `v1.0.6` to publish.
2. Add `NPM_TOKEN` as a Bitbucket repository variable (Repository settings → Repository variables).
