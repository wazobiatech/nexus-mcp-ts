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
 * One non-GraphQL HTTP endpoint exposed by the service (health, metrics,
 * webhooks, internal APIs). The MCP /mcp/manifest and /mcp/call endpoints
 * are intentionally NOT listed here — they are the transport, not the API.
 */
export interface ManifestRestEndpoint {
  /**
   * HTTP method. Typed as plain string rather than a literal union so
   * consumers populating this from `JSON.parse` (e.g. reading
   * context.json) don't have to widen or cast each value. The contract
   * schema (`nexus-mcp-contract/schemas/manifest.schema.json`) still
   * validates the actual value is one of GET/POST/PUT/PATCH/DELETE.
   */
  method: string;
  /** URL path, may include Express-style :param placeholders. */
  path: string;
  /** Auth requirement. Use 'none' for public, or a value from Manifest.auth_planes. */
  auth: string;
  /** Human-readable description of what the endpoint does. */
  description: string;
  /** Optional schema of the request body as field-name -> type-description strings. */
  body?: Record<string, string>;
  /** Optional description of the response shape. */
  returns?: string;
}

/**
 * Describes a Nexus service's domain context and the tools it exposes via MCP.
 *
 * The optional catalog fields (does_not_own, emits, consumes, graphql_queries,
 * graphql_mutations, known_gaps, auth_planes, dependencies, rest_endpoints)
 * are populated by the service's generate-manifest script from hand-authored
 * context.json (or equivalent). The aggregator passes them through verbatim
 * on /public/services/{namespace}/manifest; the rest of the aggregator only
 * reads name/namespace/version/description/context/tools.
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

  /** Things this service explicitly does NOT own (delegated elsewhere). */
  does_not_own?: string[];

  /** Domain events emitted by this service (Kafka topics, internal events). */
  emits?: string[];

  /** Domain events consumed from other services. */
  consumes?: string[];

  /** Names of GraphQL Query operations exposed by this service. */
  graphql_queries?: string[];

  /** Names of GraphQL Mutation operations exposed by this service. */
  graphql_mutations?: string[];

  /** Declared unimplemented or partially-implemented features. */
  known_gaps?: string[];

  /** Auth mechanisms this service accepts. Canonical values:
   *  'user-jwt' | 'service-token' | 'project-token' | 'hmac'. */
  auth_planes?: string[];

  /** Other Nexus services this service depends on. */
  dependencies?: string[];

  /** Non-GraphQL HTTP endpoints exposed by this service. */
  rest_endpoints?: ManifestRestEndpoint[];

  /** Tools exposed by this service via MCP. */
  tools: Array<Omit<MCPToolDefinition, 'handler'> & { inputSchema: Record<string, unknown> }>;
}
