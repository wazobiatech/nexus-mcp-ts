/**
 * Contract vector tests — pin the PRODUCTION computeSignature function
 * (not a local copy) against vectors.json from nexus-mcp-contract.
 *
 * This ensures that if the middleware's canonicalization ever drifts from
 * the contract, these tests catch it.
 */
import * as fs from "fs";
import * as path from "path";
import { computeSignature } from "../src/middleware/hmac.middleware";

interface Vector {
  id: string;
  description: string;
  input: {
    method: string;
    path: string;
    timestamp: string;
    secret: string;
  };
  expected: {
    "x-timestamp": string;
    "x-signature": string;
  };
}

function loadVectors(): Vector[] {
  const candidates = [
    path.join(__dirname, "../vectors.json"),
    path.join(__dirname, "../../nexus-mcp-contract/vectors.json"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, "utf-8")).vectors as Vector[];
    }
  }
  throw new Error("vectors.json not found");
}

describe("Contract Vectors — production computeSignature", () => {
  const vectors = loadVectors();

  it.each(vectors)("$id — $description", (v) => {
    const got = computeSignature(v.input.method, v.input.path, v.input.timestamp, v.input.secret);
    expect(got).toBe(v.expected["x-signature"]);
  });
});
