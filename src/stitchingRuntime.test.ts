import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { createSchema, createYoga } from "graphql-yoga";
import { buildHTTPExecutor } from "@graphql-tools/executor-http";
import { schemaFromExecutor } from "@graphql-tools/wrap";
import { stitchSchemas } from "@graphql-tools/stitch";
import { forwardHeaders } from "./forwardHeaders.js";

test("HTTP introspection and stitching keep concurrent caller headers isolated", async () => {
  const servers: ReturnType<typeof createServer>[] = [];
  async function listen(yoga: ReturnType<typeof createYoga>) {
    const server = createServer(yoga);
    servers.push(server);
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    return `http://127.0.0.1:${(server.address() as AddressInfo).port}/graphql`;
  }
  try {
    const subschemas = [];
    for (const name of ["leftActor", "rightActor"]) {
      const yoga = createYoga({
        schema: createSchema({
          typeDefs: `type Query { ${name}: String! }`,
          resolvers: { Query: { [name]: (_root: unknown, _args: unknown, context: { request: Request }) => {
            const headers = context.request.headers;
            assert.equal(headers.get("x-database-host"), null);
            return `${headers.get("authorization")}|${headers.get("x-login-company-id")}`;
          } } },
        }),
        logging: false,
      });
      const endpoint = await listen(yoga);
      const executor = buildHTTPExecutor({
        endpoint,
        headers: request => forwardHeaders((request?.context as { request?: Request } | undefined)?.request),
      });
      subschemas.push({ schema: await schemaFromExecutor(executor), executor });
    }
    const endpoint = await listen(createYoga({
      schema: stitchSchemas({ subschemas }),
      context: ({ request }) => ({ request }),
      logging: false,
    }));
    const results = await Promise.all(["company-a", "company-b"].map(async company => {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer synthetic-${company}`,
          "x-login-company-id": company,
          "x-database-host": "must-not-forward.invalid",
        },
        body: JSON.stringify({ query: "{ leftActor rightActor }" }),
      });
      assert.equal(response.status, 200);
      const result = await response.json();
      const expected = `Bearer synthetic-${company}|${company}`;
      assert.deepEqual(result, { data: { leftActor: expected, rightActor: expected } });
      return result;
    }));
    assert.equal(results.length, 2);
  } finally {
    await Promise.all(servers.map(server => new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
      server.closeAllConnections();
    })));
  }
});
