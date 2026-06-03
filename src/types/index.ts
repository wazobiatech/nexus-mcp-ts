import { JSONSchema7 } from 'json-schema';

/**
 * Request context injected into every MCP tool handler.
 * Contains the raw HTTP request metadata so services can extract
 * auth headers (x-project-token, Authorization, etc.).
 */
export interface RequestContext {
  /** All incoming HTTP headers (lowercased by Express). */
  headers: Record<string, string | string[] | undefined>;
  /** HTTP method. */
  method: string;
  /** Request path (including query string). */
  path: string;
}

/**
 * Describes a single tool exposed through the Nexus MCP ecosystem.
 */
export interface MCPToolDefinition {
  /** Snake_case identifier with no spaces. */
  name: string;

  /** Meaningful description written for the AI consumer (Claude). Min 20 chars. */
  description: string;

  /** Valid JSON Schema draft-07 describing the tool's input parameters. */
  inputSchema: JSONSchema7;

  /** Optional behavioural annotations. */
  annotations?: {
    /** True if the tool performs no side effects. */
    readOnly?: boolean;
    /** True if the tool can delete or irreversibly mutate data. */
    destructive?: boolean;
  };

  /**
   * Handler is called internally by createMCPServer when Claude invokes the tool.
   * It calls the service's internal service layer — NOT an external HTTP endpoint.
   *
   * The second `context` argument contains the raw HTTP request metadata
   * (headers, method, path) so the handler can extract auth tokens.
   */
  handler: (args: Record<string, unknown>, context: RequestContext) => Promise<unknown>;
}

/**
 * DDD context metadata for a service manifest.
 */
export interface ManifestContext {
  domain: string;
  purpose: string;
  bounded_context: string;
  key_entities: string[];
  aggregates: string[];
}

/**
 * Describes a Nexus service's domain context and the tools it exposes via MCP.
 */
export interface Manifest {
  /** Human-readable service name. */
  name: string;

  /** Lowercase, no-spaces identifier used for tool namespacing. */
  namespace: string;

  /** SemVer of the manifest / service. */
  version: string;

  /** Short summary of what the service does. */
  description: string;

  /** DDD domain context. */
  context: ManifestContext;

  /** Tools exposed by this service via MCP. */
  tools: Array<Omit<MCPToolDefinition, 'handler'> & { inputSchema: Record<string, unknown> }>;
}
