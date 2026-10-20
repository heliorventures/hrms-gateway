import assert from "node:assert/strict";
import test from "node:test";
import { allowPartialSubgraphs, configuredSubgraphs, SUBGRAPHS } from "./subgraphs.js";

test("organization service is explicitly opt-in and has its own plane", () => {
  assert.equal(configuredSubgraphs({}).some(({ name }) => name === "organization"), false);
  assert.equal(configuredSubgraphs({ KABIPAY_ORGANIZATION_ENABLED: "true" }).filter(({ name }) => name === "organization").length, 1);
  assert.throws(() => configuredSubgraphs({ KABIPAY_ORGANIZATION_ENABLED: "sometimes" }), /true or false/);
});

test("production requires every configured subgraph by default", () => {
  assert.equal(allowPartialSubgraphs({ NODE_ENV: "production" }), false);
});

test("development keeps partial-fleet startup available", () => {
  assert.equal(allowPartialSubgraphs({ NODE_ENV: "development" }), true);
  assert.equal(allowPartialSubgraphs({}), true);
});

test("an explicit boolean override is honored and invalid values fail closed", () => {
  assert.equal(
    allowPartialSubgraphs({ NODE_ENV: "production", KABIPAY_ALLOW_PARTIAL_SUBGRAPHS: "true" }),
    true,
  );
  assert.equal(
    allowPartialSubgraphs({ NODE_ENV: "development", KABIPAY_ALLOW_PARTIAL_SUBGRAPHS: "false" }),
    false,
  );
  assert.throws(
    () => allowPartialSubgraphs({ KABIPAY_ALLOW_PARTIAL_SUBGRAPHS: "sometimes" }),
    /must be true or false/,
  );
});

test("plane endpoints are fixed independently while numeric callers remain compatible", async () => {
  const { subgraphUrl } = await import("./subgraphs.js");
  const env = { KABIPAY_SUBGRAPH_BASE_URL: "http://company", KABIPAY_ORGANIZATION_SUBGRAPH_URL: "http://central:4031/graphql", KABIPAY_OPS_SUBGRAPH_URL: "http://legacy:4010/graphql" };
  assert.equal(subgraphUrl({name:"organization",port:4031,plane:"organization"},env),"http://central:4031/graphql");
  assert.equal(subgraphUrl({name:"ops",port:4010,plane:"ops"},env),"http://legacy:4010/graphql");
  assert.equal(subgraphUrl({name:"employee",port:4013,plane:"tenant"},env),"http://company:4013/graphql");
  assert.equal(subgraphUrl(4013,env),"http://company:4013/graphql");
});

test("startup rejects malformed configured plane endpoints even before introspection", () => {
  for (const value of ["ftp://central/graphql","https://user:pass@central/graphql","https://central/graphql?tenant=x","https://central/graphql#x","https://central/graphql?","https://central/graphql#","https://central/wrong"]) {
    assert.throws(()=>configuredSubgraphs({KABIPAY_ORGANIZATION_SUBGRAPH_URL:value}),/KABIPAY_ORGANIZATION_SUBGRAPH_URL/);
    assert.throws(()=>configuredSubgraphs({KABIPAY_OPS_SUBGRAPH_URL:value}),/KABIPAY_OPS_SUBGRAPH_URL/);
  }
});

test("tenant endpoint map uses only validated known operator-configured services", async () => {
 const {subgraphUrl} = await import("./subgraphs.js");
 const endpoints=Object.fromEntries(SUBGRAPHS.filter(def=>def.plane==="tenant").map(def=>[def.name,`http://company-${def.name}:${def.port}/graphql`]));
 const env={KABIPAY_SUBGRAPH_ENDPOINTS:JSON.stringify({...endpoints,leave:"https://company-leave/graphql"})};
 assert.equal(subgraphUrl({name:"employee",plane:"tenant",port:4013},env),"http://company-employee:4013/graphql");
 for(const raw of ['[]','null','{}','{"employee":"https://company/graphql"}','{"ops":"https://ops/graphql"}','{"unknown":"https://bad/graphql"}','{"employee":"https://company/graphql?source=x"}','{"employee":3}'])assert.throws(()=>configuredSubgraphs({KABIPAY_SUBGRAPH_ENDPOINTS:raw}),/KABIPAY_SUBGRAPH_ENDPOINTS/);
});

test("ops gateway plane cannot expose tenant or organization subgraphs",()=>{
 assert.deepEqual(configuredSubgraphs({KABIPAY_GATEWAY_PLANE:"ops"}).map(def=>def.name),["ops"]);
 assert.throws(()=>configuredSubgraphs({KABIPAY_GATEWAY_PLANE:"ops",KABIPAY_ORGANIZATION_ENABLED:"true"}),/Organization/);
 for(const value of ["", "client", "OPS"])assert.throws(()=>configuredSubgraphs({KABIPAY_GATEWAY_PLANE:value}),/KABIPAY_GATEWAY_PLANE/);
 assert.equal(configuredSubgraphs({KABIPAY_GATEWAY_PLANE:"all"}).length,SUBGRAPHS.length);
});
