import assert from "node:assert/strict";
import test from "node:test";
import { buildSchema } from "graphql";
import { loanSchemaOwnershipErrors } from "./schemaContract.js";
const loans = buildSchema("type Query { myLoans: String! loanAccounts: String! } type Mutation { recordLoanReceipt: String! }");
test("Payroll is the sole public owner of Loans", () => {
  assert.deepEqual(loanSchemaOwnershipErrors([{ name: "payroll", schema: loans }]), []);
  assert.ok(loanSchemaOwnershipErrors([{ name: "employee", schema: loans }]).some((error) => error.includes("Query.myLoans")));
  assert.ok(loanSchemaOwnershipErrors([{ name: "payroll", schema: loans }, { name: "employee", schema: loans }]).some((error) => error.includes("multiple owners")));
});
test("private financial coordination cannot be stitched into public GraphQL", () => {
  const schema = buildSchema("type Query { ready: Boolean! } type Mutation { postPayrollRecoveries: Boolean! postFnfRecoveries: Boolean! }");
  const errors = loanSchemaOwnershipErrors([{ name: "payroll", schema }]);
  assert.equal(errors.length, 2);
  assert.ok(errors.every((error) => error.includes("private financial")));
});
