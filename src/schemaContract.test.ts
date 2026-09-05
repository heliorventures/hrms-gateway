import assert from "node:assert/strict";
import test from "node:test";
import { buildSchema } from "graphql";
import { missingRequiredClientFields } from "./schemaContract.js";

test("reports required client fields missing from a stitched schema", () => {
  const schema = buildSchema("type Query { benefitTypes: [String!]! } type Mutation { saveBenefitType: String! }");
  const missing = missingRequiredClientFields(schema);

  assert.equal(missing.includes("Query.benefitTypes"), false);
  assert.equal(missing.includes("Mutation.saveBenefitType"), false);
  assert.equal(missing.includes("Mutation.saveSalaryBand"), true);
  assert.equal(missing.includes("Query.compensationReviewCycles"), true);
});

test("accepts the complete workplace configuration schema contract", () => {
  const schema = buildSchema(`
    type Query {
      benefitTypes: [String!]!
      benefitPlans: [String!]!
      jobPostings: [String!]!
      reviewCycles: [String!]!
      skills: [String!]!
      courses: [String!]!
      competencies: [String!]!
      talentPools: [String!]!
      salaryBands: [String!]!
      compensationReviewCycles: [String!]!
    }
    type Mutation {
      saveBenefitType: String!
      saveBenefitPlan: String!
      saveJobPosting: String!
      saveReviewCycle: String!
      saveSkill: String!
      saveCourse: String!
      saveCompetency: String!
      saveTalentPool: String!
      saveCompensationReviewCycle: String!
      saveSalaryBand: String!
    }
  `);

  assert.deepEqual(missingRequiredClientFields(schema), []);
});
