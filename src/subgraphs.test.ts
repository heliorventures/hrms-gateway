import assert from "node:assert/strict";
import test from "node:test";
import { allowPartialSubgraphs } from "./subgraphs.js";

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
