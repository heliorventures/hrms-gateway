/**
 * KabiPay stitching gateway.
 *
 * Replaces the defunct WunderGraph setup (its `wunderctl` binary could
 * no longer be downloaded because `github.com/wundergraph/wundergraph`
 * was archived).
 *
 * This gateway:
 *  - Introspects every reachable subgraph at startup.
 *  - Stitches their schemas into a single executable schema via
 *    `@graphql-tools/stitch`.
 *  - Forwards the `x-tenant-id` header through to each subgraph so
 *    tenant-plane resolvers can pick it up (until real JWT auth lands).
 *  - Serves the combined schema at `http://127.0.0.1:4009/graphql`
 *    with a Yoga playground.
 */
import { createYoga } from "graphql-yoga";
import { stitchSchemas } from "@graphql-tools/stitch";
import { schemaFromExecutor } from "@graphql-tools/wrap";
import { buildHTTPExecutor } from "@graphql-tools/executor-http";
import { createServer } from "node:http";
import { forwardHeaders } from "./forwardHeaders.js";
import { SUBGRAPHS, subgraphUrl, type SubgraphDef } from "./subgraphs.js";

const GATEWAY_PORT = Number(process.env.KABIPAY_GATEWAY_PORT ?? 4009);
interface StitchedSubgraph {
  def: SubgraphDef;
  schema: Awaited<ReturnType<typeof schemaFromExecutor>>;
  url: string;
}

/**
 * Forward the caller's tenant-id + bearer token to each subgraph. Either
 * (or both) may be missing — `kabipay-common::subgraph` accepts a JWT
 * alone and extracts the tenant from its claims.
 */
function forwardedExecutorHeaders(executorRequest?: { context?: unknown }): Record<string, string> {
  const context = executorRequest?.context as { request?: Request } | undefined;
  return forwardHeaders(context?.request);
}

async function loadSubgraph(def: SubgraphDef): Promise<StitchedSubgraph | null> {
  const url = subgraphUrl(def.port);
  const executor = buildHTTPExecutor({
    endpoint: url,
    headers: forwardedExecutorHeaders,
  });
  try {
    const schema = await schemaFromExecutor(executor);
    console.log(`[gateway] \u2714 ${def.name.padEnd(14)} introspected from ${url}`);
    return { def, schema, url };
  } catch (err) {
    console.warn(
      `[gateway] \u26A0 ${def.name.padEnd(14)} unreachable at ${url} \u2014 skipping. (${(err as Error).message})`,
    );
    return null;
  }
}

async function main() {
  console.log("[gateway] booting KabiPay stitching gateway\u2026");
  const loaded = (
    await Promise.all(SUBGRAPHS.map((def) => loadSubgraph(def)))
  ).filter((s): s is StitchedSubgraph => s !== null);

  if (loaded.length === 0) {
    console.error(
      "[gateway] no subgraphs reachable \u2014 serving empty schema; start subgraphs and restart the gateway.",
    );
  }

  const stitched = stitchSchemas({
    subschemas: loaded.map((s) => {
      const executor = buildHTTPExecutor({
        endpoint: s.url,
        headers: forwardedExecutorHeaders,
      });
      return { schema: s.schema, executor };
    }),
  });

  const yoga = createYoga({
    schema: stitched,
    graphqlEndpoint: "/graphql",
    cors: { origin: "*", credentials: true },
    context: ({ request }) => ({ request }),
    landingPage: false,
  });

  const server = createServer(yoga);
  server.listen(GATEWAY_PORT, () => {
    console.log(
      `[gateway] listening on http://127.0.0.1:${GATEWAY_PORT}/graphql with ${loaded.length}/${SUBGRAPHS.length} subgraphs`,
    );
  });
}

main().catch((err) => {
  console.error("[gateway] fatal", err);
  process.exit(1);
});
