import { createHmac } from "crypto";
import * as fs from "fs";
import * as path from "path";

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

function sign(method: string, path: string, timestamp: string, secret: string): string {
  const payload = `${method.toUpperCase()}${path}${timestamp}`;
  return createHmac("sha256", secret).update(payload, "utf-8").digest("hex");
}

describe("Contract Vectors", () => {
  const vectors = loadVectors();

  it.each(vectors)("$id — $description", (v) => {
    const got = sign(v.input.method, v.input.path, v.input.timestamp, v.input.secret);
    expect(got).toBe(v.expected["x-signature"]);
  });
});
