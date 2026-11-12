import assert from "node:assert/strict";
import test from "node:test";
import {
  buildClientSchema, getIntrospectionQuery, graphql, GraphQLList,
  GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString, isListType, parse,
  type IntrospectionQuery, type GraphQLOutputType,
  type SelectionSetNode,
} from "graphql";
import { SCHEMA_DISCOVERY_OPTIONS } from "./schemaDiscovery.js";

test("gateway discovery fits the strictest subgraph depth budget", () => {
  const document = parse(getIntrospectionQuery(SCHEMA_DISCOVERY_OPTIONS));
  const fragments = new Map(document.definitions.flatMap(d => d.kind === "FragmentDefinition" ? [[d.name.value, d.selectionSet] as const] : []));
  const depth = (selection: SelectionSetNode): number => Math.max(0, ...selection.selections.map(s =>
    s.kind === "Field" ? 1 + (s.selectionSet ? depth(s.selectionSet) : 0) :
      s.kind === "FragmentSpread" ? depth(fragments.get(s.name.value)!) : depth(s.selectionSet)));
  const operation = document.definitions.find(d => d.kind === "OperationDefinition")!;
  assert.equal(operation.kind, "OperationDefinition");
  assert.ok(depth(operation.selectionSet) <= 12);
});

function wrappedSchema(wrappers: number): GraphQLSchema {
  let type: GraphQLOutputType = GraphQLString;
  for (let index = 0; index < wrappers; index++) {
    if (index % 2 === 0) type = new GraphQLList(type);
    else {
      if (!isListType(type)) throw new Error("Expected the preceding list wrapper");
      type = new GraphQLNonNull(type);
    }
  }
  return new GraphQLSchema({ query: new GraphQLObjectType({ name: "Query", fields: { value: { type } } }) });
}

test("bounded discovery preserves supported wrappers exactly", async () => {
  const response = await graphql({ schema: wrappedSchema(6), source: getIntrospectionQuery(SCHEMA_DISCOVERY_OPTIONS) });
  assert.equal(response.errors, undefined);
  const schema = buildClientSchema(response.data as unknown as IntrospectionQuery);
  assert.equal(String(schema.getQueryType()!.getFields().value!.type), "[[[String]!]!]!");
});

test("a future deeper wrapper fails composition instead of silently changing the contract", async () => {
  const response = await graphql({ schema: wrappedSchema(7), source: getIntrospectionQuery(SCHEMA_DISCOVERY_OPTIONS) });
  assert.equal(response.errors, undefined);
  assert.throws(() => buildClientSchema(response.data as unknown as IntrospectionQuery), /Decorated type deeper than introspection query/);
});
