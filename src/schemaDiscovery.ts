import type { IntrospectionOptions } from "graphql";

// Organization enforces a request depth of 12. Keep the generated discovery
// query inside that budget rather than inheriting a changing library default.
// buildClientSchema rejects any type decoration deeper than this query covers.
export const SCHEMA_DISCOVERY_OPTIONS: IntrospectionOptions = {
  typeDepth: 6,
};
