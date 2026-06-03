import { Request, Response, NextFunction } from "express";
import { createHmac, timingSafeEqual } from "crypto";

const MAX_AGE_SECONDS = 300;
const HEADER_SIGNATURE = "x-signature";
const HEADER_TIMESTAMP = "x-timestamp";

/**
 * Build an HTTP 401 error that both NestJS and plain Node.js callers handle
 * correctly. When @nestjs/common is available (optional peer dep) we throw
 * UnauthorizedException so NestJS returns 401; otherwise we throw a plain
 * Error and let the caller decide (express middleware returns 401 directly).
 */
function unauthorizedError(message: string): Error {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { UnauthorizedException } = require("@nestjs/common");
    return new UnauthorizedException(message);
  } catch {
    return new Error(message);
  }
}

export { computeSignature };

function computeSignature(
  method: string,
  path: string,
  timestamp: string,
  secret: string
): string {
  const payload = `${method.toUpperCase()}${path}${timestamp}`;
  return createHmac("sha256", secret).update(payload, "utf-8").digest("hex");
}

function isStale(ts: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  return Math.abs(now - ts) > MAX_AGE_SECONDS;
}

/**
 * Express middleware factory that validates HMAC-SHA256 signatures.
 *
 * @param hmacSecret - Shared symmetric key.
 * @returns Express middleware function.
 */
export function hmacMiddleware(hmacSecret: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const sig = req.headers[HEADER_SIGNATURE] as string | undefined;
    const ts = req.headers[HEADER_TIMESTAMP] as string | undefined;

    if (!sig || !ts) {
      res.status(401).json({ error: "unauthorized", reason: "missing headers" });
      return;
    }

    const timestamp = parseInt(ts, 10);
    if (Number.isNaN(timestamp) || isStale(timestamp)) {
      res.status(401).json({ error: "unauthorized", reason: "stale timestamp" });
      return;
    }

    const expected = computeSignature(req.method, req.originalUrl, ts, hmacSecret);

    try {
      const expectedBuf = Buffer.from(expected, "hex");
      const receivedBuf = Buffer.from(sig, "hex");
      if (
        expectedBuf.length !== receivedBuf.length ||
        !timingSafeEqual(expectedBuf, receivedBuf)
      ) {
        res.status(401).json({ error: "unauthorized", reason: "signature mismatch" });
        return;
      }
    } catch {
      res.status(401).json({ error: "unauthorized", reason: "signature mismatch" });
      return;
    }

    next();
  };
}

/**
 * NestJS guard that validates HMAC-SHA256 signatures.
 *
 * Does not use @Injectable() so it works without reflect-metadata
 * in non-NestJS projects. NestJS resolves guards by duck-typing
 * the canActivate method — the decorator is not required.
 *
 * Usage: @UseGuards(new HMACGuard(secret))
 */
export class HMACGuard {
  constructor(private readonly hmacSecret: string) {}

  canActivate(context: { switchToHttp: () => { getRequest: () => Request } }): boolean {
    const req = context.switchToHttp().getRequest() as Request;
    const sig = req.headers[HEADER_SIGNATURE] as string | undefined;
    const ts = req.headers[HEADER_TIMESTAMP] as string | undefined;

    if (!sig || !ts) {
      throw unauthorizedError("unauthorized: missing headers");
    }

    const timestamp = parseInt(ts, 10);
    if (Number.isNaN(timestamp) || isStale(timestamp)) {
      throw unauthorizedError("unauthorized: stale timestamp");
    }

    const expected = computeSignature(req.method, req.originalUrl, ts, this.hmacSecret);

    try {
      const expectedBuf = Buffer.from(expected, "hex");
      const receivedBuf = Buffer.from(sig, "hex");
      if (
        expectedBuf.length !== receivedBuf.length ||
        !timingSafeEqual(expectedBuf, receivedBuf)
      ) {
        throw unauthorizedError("unauthorized: signature mismatch");
      }
    } catch (e) {
      // Re-throw if it's already our unauthorized error; otherwise treat as mismatch
      if ((e as any)?.status === 401 || (e as any)?.response?.statusCode === 401) throw e;
      throw unauthorizedError("unauthorized: signature mismatch");
    }

    return true;
  }
}
