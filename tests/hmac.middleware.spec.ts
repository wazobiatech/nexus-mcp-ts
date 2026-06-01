import { Request, Response, NextFunction } from "express";
import { hmacMiddleware, HMACGuard } from "../src/middleware/hmac.middleware";
import { createHmac } from "crypto";

function sign(method: string, path: string, timestamp: string, secret: string): string {
  const payload = `${method.toUpperCase()}${path}${timestamp}`;
  return createHmac("sha256", secret).update(payload, "utf-8").digest("hex");
}

describe("hmacMiddleware", () => {
  const secret = "test-secret";
  const middleware = hmacMiddleware(secret);

  function mockReq(overrides: Partial<Request> = {}): Request {
    return {
      method: "GET",
      originalUrl: "/",
      headers: {},
      ...overrides,
    } as Request;
  }

  function mockRes(): Response {
    const res = {
      statusCode: 200,
      jsonBody: null,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(body: any) {
        this.jsonBody = body;
        return this;
      },
    };
    return res as unknown as Response;
  }

  it("allows a valid request", () => {
    const ts = String(Math.floor(Date.now() / 1000));
    const sig = sign("GET", "/", ts, secret);
    const req = mockReq({ headers: { "x-signature": sig, "x-timestamp": ts } });
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });

  it("rejects missing headers", () => {
    const req = mockReq();
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    middleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it("rejects a bad signature", () => {
    const ts = String(Math.floor(Date.now() / 1000));
    const req = mockReq({
      headers: { "x-signature": "deadbeef", "x-timestamp": ts },
    });
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    middleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it("rejects a stale timestamp", () => {
    const ts = "0";
    const sig = sign("GET", "/", ts, secret);
    const req = mockReq({ headers: { "x-signature": sig, "x-timestamp": ts } });
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    middleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });
});

describe("HMACGuard", () => {
  const secret = "test-secret";

  it("returns true for valid request", () => {
    const ts = String(Math.floor(Date.now() / 1000));
    const sig = sign("GET", "/", ts, secret);

    const guard = new HMACGuard(secret);
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: "GET",
          originalUrl: "/",
          headers: { "x-signature": sig, "x-timestamp": ts },
        }),
      }),
    } as any;

    expect(guard.canActivate(context)).toBe(true);
  });

  it("throws for missing headers", () => {
    const guard = new HMACGuard(secret);
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: "GET",
          originalUrl: "/",
          headers: {},
        }),
      }),
    } as any;

    expect(() => guard.canActivate(context)).toThrow();
  });
});
