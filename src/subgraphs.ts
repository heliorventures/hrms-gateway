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
  plane: "ops" | "tenant";
}

export const SUBGRAPHS: SubgraphDef[] = [
  { name: "operator", port: 4010, plane: "ops" },
  { name: "tenant", port: 4011, plane: "ops" },
  { name: "billing", port: 4012, plane: "ops" },
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
];

export function baseUrl(): string {
  return (process.env.KABIPAY_SUBGRAPH_BASE_URL ?? "http://127.0.0.1").replace(
    /\/$/,
    "",
  );
}

export function subgraphUrl(port: number): string {
  return `${baseUrl()}:${port}/graphql`;
}
