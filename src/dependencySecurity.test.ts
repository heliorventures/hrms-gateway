import assert from "node:assert/strict";
import test from "node:test";
import { mergeDeep, mergeIncrementalResult } from "@graphql-tools/utils";

test("result merging discards prototype-control keys at every level", () => {
  const unsafe = JSON.parse('{"safe":{"constructor":{"marker":true},"prototype":{"marker":true},"__proto__":{"marker":true},"name":"ok"}}');
  const merged = mergeDeep([{ safe: { id: 1 } }, unsafe]);
  assert.deepEqual(Object.keys(merged.safe).sort(), ["id", "name"]);
  assert.equal(Object.getPrototypeOf(merged.safe), Object.prototype);
});

test("incremental responses reject non-primitive path segments", () => {
  const marker = "__hrmsDependencySecurityProbe";
  const prototype = Object.prototype as Record<string, unknown>;
  const executionResult = { data: {} };
  try {
    mergeIncrementalResult({
      executionResult,
      incrementalResult: JSON.parse(`{"path":[["__proto__"],"${marker}"],"data":{"unsafe":true}}`),
    });
    assert.equal(Object.hasOwn(prototype, marker), false);
  } finally {
    delete prototype[marker];
  }
});
