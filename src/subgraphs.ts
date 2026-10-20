/**
 * Canonical list of KabiPay async-graphql subgraphs.
 *
 * Ports match `KABIPAY_<SVC>_PORT` defaults in `kabipay-svc` and
 * `.env.example`. The schema-stitching gateway will skip any subgraph
 * that is unreachable at startup so partial fleets still work in dev.
 */
export interface SubgraphDef {
  name: string;
  port: number;
  plane: "ops" | "tenant" | "organization";
}

export const SUBGRAPHS: SubgraphDef[] = [
  { name: "ops", port: 4010, plane: "ops" },
  { name: "employee", port: 4013, plane: "tenant" },
  { name: "leave", port: 4014, plane: "tenant" },
  { name: "attendance", port: 4015, plane: "tenant" },
  { name: "payroll", port: 4016, plane: "tenant" },
  { name: "tax", port: 4017, plane: "tenant" },
  { name: "benefits", port: 4018, plane: "tenant" },
  { name: "expense", port: 4019, plane: "tenant" },
  { name: "recruitment", port: 4020, plane: "tenant" },
  { name: "performance", port: 4021, plane: "tenant" },
  { name: "lms", port: 4022, plane: "tenant" },
  { name: "succession", port: 4023, plane: "tenant" },
  { name: "compensation", port: 4024, plane: "tenant" },
  { name: "assets", port: 4025, plane: "tenant" },
  { name: "grievance", port: 4026, plane: "tenant" },
  { name: "workflow", port: 4027, plane: "tenant" },
  { name: "notification", port: 4028, plane: "tenant" },
  { name: "analytics", port: 4029, plane: "tenant" },
  { name: "survey", port: 4030, plane: "tenant" },
];

export function allowPartialSubgraphs(
  environment: Record<string, string | undefined> = process.env,
): boolean {
  const configured = environment.KABIPAY_ALLOW_PARTIAL_SUBGRAPHS?.trim().toLowerCase();
  if (configured !== undefined && configured !== "") {
    if (configured === "true") return true;
    if (configured === "false") return false;
    throw new Error("KABIPAY_ALLOW_PARTIAL_SUBGRAPHS must be true or false");
  }
  return environment.NODE_ENV?.trim().toLowerCase() !== "production";
}

export function baseUrl(environment: Record<string, string | undefined> = process.env): string {
  return (environment.KABIPAY_SUBGRAPH_BASE_URL ?? "http://127.0.0.1").replace(
    /\/$/,
    "",
  );
}

function planeEndpoint(value: string | undefined, key: string): string | undefined {
  if (value === undefined) return undefined;
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || value.includes("?") || value.includes("#") || url.pathname !== "/graphql") throw new Error();
    return url.toString();
  } catch {
    throw new Error(`${key} must be an HTTP(S) /graphql URL without credentials, query or fragment`);
  }
}

function tenantEndpoints(environment: Record<string, string | undefined>): Record<string, string> {
  const raw = environment.KABIPAY_SUBGRAPH_ENDPOINTS;
  if (raw === undefined) return {};
  const key = "KABIPAY_SUBGRAPH_ENDPOINTS";
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new Error(`${key} must be a JSON object of tenant service endpoints`); }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${key} must be a JSON object`);
  const known = new Set(SUBGRAPHS.filter(def => def.plane === "tenant").map(def => def.name));
  const result: Record<string, string> = Object.create(null);
  for (const [name, endpoint] of Object.entries(value)) {
    if (!known.has(name) || typeof endpoint !== "string") throw new Error(`${key} contains an unknown tenant service or invalid endpoint`);
    result[name] = planeEndpoint(endpoint, `${key}.${name}`)!;
  }
  if ([...known].some(name => !Object.hasOwn(result, name))) throw new Error(`${key} must contain every tenant service; partial routing maps are not allowed`);
  return result;
}

export function subgraphUrl(definition: SubgraphDef | number, environment: Record<string, string | undefined> = process.env): string {
  if (typeof definition !== "number") {
    const endpoints = tenantEndpoints(environment);
    if (definition.plane === "tenant" && endpoints[definition.name]) return endpoints[definition.name];
    const key = definition.plane === "organization" ? "KABIPAY_ORGANIZATION_SUBGRAPH_URL" : definition.plane === "ops" ? "KABIPAY_OPS_SUBGRAPH_URL" : undefined;
    if (key) {
      const endpoint = planeEndpoint(environment[key], key);
      if (endpoint) return endpoint;
    }
  }
  const port = typeof definition === "number" ? definition : definition.port;
  return `${baseUrl(environment)}:${port}/graphql`;
}

export function configuredSubgraphs(environment: Record<string, string | undefined> = process.env): SubgraphDef[] {
  const plane = environment.KABIPAY_GATEWAY_PLANE ?? "all";
  if (plane !== "all" && plane !== "ops") throw new Error("KABIPAY_GATEWAY_PLANE must be all or ops");
  // Validate deployment endpoints before any introspection, even for disabled planes.
  for (const key of ["KABIPAY_ORGANIZATION_SUBGRAPH_URL", "KABIPAY_OPS_SUBGRAPH_URL"]) planeEndpoint(environment[key], key);
  tenantEndpoints(environment);
  const enabled = environment.KABIPAY_ORGANIZATION_ENABLED?.trim().toLowerCase();
  if (enabled !== undefined && enabled !== "" && enabled !== "true" && enabled !== "false") {
    throw new Error("KABIPAY_ORGANIZATION_ENABLED must be true or false");
  }
  if (plane === "ops") {
    if (enabled === "true") throw new Error("Organization cannot be enabled in the ops gateway plane");
    return SUBGRAPHS.filter(def => def.plane === "ops");
  }
  return enabled === "true"
    ? [...SUBGRAPHS, { name: "organization", port: 4031, plane: "organization" }]
    : [...SUBGRAPHS];
}
