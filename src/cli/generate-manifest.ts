#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import Ajv from 'ajv';
import { Manifest, MCPToolDefinition } from '../types/index.js';

const args = process.argv.slice(2);

function parseArg(flag: string, defaultValue: string): string {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : defaultValue;
}

async function main() {
  const contextPath = parseArg('--context', './src/mcp/context.json');
  // Default targets compiled .js files. The CLI runs as plain Node (CommonJS)
  // and cannot require() TypeScript without ts-node. If your tools are still
  // in .ts, either:
  //   a) Pre-compile first: tsc && generate-manifest --tools ./dist/mcp/tools/*.tools.js
  //   b) Run via ts-node: ts-node ./node_modules/.bin/generate-manifest --tools ./src/mcp/tools/*.tools.ts
  const toolsGlob = parseArg('--tools', './dist/mcp/tools/*.tools.js');
  const outPath = parseArg('--out', './src/mcp/manifest.json');

  // Load context
  const contextRaw = await fs.readFile(contextPath, 'utf-8');
  const context = JSON.parse(contextRaw);

  // Load tool files via dynamic import
  const toolFiles = await glob(toolsGlob, { absolute: true });
  const allTools: MCPToolDefinition[] = [];

  for (const file of toolFiles) {
    // Clear require cache for idempotent runs — require() is intentional here:
    // the CLI runs as compiled CommonJS and needs synchronous dynamic loading.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    delete require.cache[require.resolve(file)];
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require(file);
    const exported = mod.tools || mod.default || mod;
    if (Array.isArray(exported)) {
      allTools.push(...exported);
    }
  }

  // Strip handlers before writing manifest
  const manifest: Manifest = {
    ...context,
    tools: allTools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema as Record<string, unknown>,
      annotations: t.annotations,
    })),
  };

  // Validate against schema
  const ajv = new Ajv({ strict: false });
  const schemaPath = path.join(__dirname, '../../schemas/manifest.schema.json');
  // Fallback: look in sibling contract repo
  const fallbackSchemaPath = path.resolve(
    process.cwd(),
    '../nexus-mcp-contract/schemas/manifest.schema.json',
  );

  let schema: any;
  try {
    schema = JSON.parse(await fs.readFile(schemaPath, 'utf-8'));
  } catch {
    schema = JSON.parse(await fs.readFile(fallbackSchemaPath, 'utf-8'));
  }

  const validate = ajv.compile(schema);
  const valid = validate(manifest);
  if (!valid) {
    console.error('Manifest validation failed:', validate.errors);
    process.exit(1);
  }

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
  console.info(`Manifest written to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
