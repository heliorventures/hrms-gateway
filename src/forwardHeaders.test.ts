import assert from "node:assert/strict";
import test from "node:test";
import { forwardHeaders } from "./forwardHeaders.js";

test("forwards the allowed tenant, identity, client IP, and request ID headers", () => {
  const request = new Request("http://gateway.test/graphql", {
    headers: {
      authorization: "Bearer test-token",
      "x-forwarded-for": "203.0.113.1",
      "x-real-ip": "203.0.113.2",
      "x-request-id": "request-123",
      "x-tenant-id": "tenant-123",
    },
  });

  assert.deepEqual(forwardHeaders(request), {
    authorization: "Bearer test-token",
    "x-forwarded-for": "203.0.113.1",
    "x-real-ip": "203.0.113.2",
    "x-request-id": "request-123",
    "x-tenant-id": "tenant-123",
  });
});

test("does not forward unrelated request headers", () => {
  const request = new Request("http://gateway.test/graphql", {
    headers: {
      "content-type": "application/json",
      cookie: "session=secret",
      "x-tenant-id": "tenant-123",
    },
  });

  assert.deepEqual(forwardHeaders(request), {
    "x-tenant-id": "tenant-123",
  });
});
