import { Request, Response, NextFunction } from "express";
import { createHmac, timingSafeEqual } from "crypto";
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

const MAX_AGE_SECONDS = 300;
const HEADER_SIGNATURE = "x-signature";
const HEADER_TIMESTAMP = "x-timestamp";

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
 * Inject with `@UseGuards(new HMACGuard(secret))` or bind via a custom provider.
 */
@Injectable()
export class HMACGuard implements CanActivate {
  constructor(private readonly hmacSecret: string) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const sig = req.headers[HEADER_SIGNATURE] as string | undefined;
    const ts = req.headers[HEADER_TIMESTAMP] as string | undefined;

    if (!sig || !ts) {
      throw new UnauthorizedException("missing headers");
    }

    const timestamp = parseInt(ts, 10);
    if (Number.isNaN(timestamp) || isStale(timestamp)) {
      throw new UnauthorizedException("stale timestamp");
    }

    const expected = computeSignature(req.method, req.originalUrl, ts, this.hmacSecret);

    try {
      const expectedBuf = Buffer.from(expected, "hex");
      const receivedBuf = Buffer.from(sig, "hex");
      if (
        expectedBuf.length !== receivedBuf.length ||
        !timingSafeEqual(expectedBuf, receivedBuf)
      ) {
        throw new UnauthorizedException("signature mismatch");
      }
    } catch {
      throw new UnauthorizedException("signature mismatch");
    }

    return true;
  }
}
