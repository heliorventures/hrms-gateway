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
  assert.equal(missing.includes("Query.myAttendanceSummary"), true);
  assert.equal(missing.includes("Query.leaveApprovalQueue"), true);
  assert.equal(missing.includes("Query.notificationAutomationSettings"), true);
  assert.equal(missing.includes("Mutation.updateMyCelebrationPreferences"), true);
});

test("accepts the complete workplace and attendance schema contract", () => {
  const schema = buildSchema(`
    type Query {
      benefitTypes: [String!]!
      benefitPlans: [String!]!
      jobPostings: [String!]!
      reviewCycles: [String!]!
      performancePrograms: [String!]!
      myPerformanceReviews: [String!]!
      myTeamPerformanceReviews: [String!]!
      performanceReviewDetail: String!
      surveys: [String!]!
      availableSurveys: [String!]!
      surveyResults: String!
      surveyResultsCatalog: [String!]!
      skills: [String!]!
      courses: [String!]!
      competencies: [String!]!
      talentPools: [String!]!
      salaryBands: [String!]!
      compensationReviewCycles: [String!]!
      myAttendanceSummary: String!
      leaveApprovalQueue: String!
      notificationAutomationSettings: String!
      myCelebrationPreferences: String!
    }
    type Mutation {
      saveBenefitType: String!
      saveBenefitPlan: String!
      saveJobPosting: String!
      saveReviewCycle: String!
      savePerformanceProgram: String!
      saveAppraisalTemplate: String!
      publishAppraisalTemplate: String!
      activatePerformanceProgram: String!
      launchPerformanceCycle: String!
      proposePerformanceGoal: String!
      approvePerformanceGoals: String!
      addPerformanceFeedback: String!
      advancePerformanceCycle: String!
      submitSelfAppraisal: String!
      submitManagerAppraisal: String!
      acknowledgePerformanceReview: String!
      saveSurvey: String!
      publishSurvey: String!
      closeSurvey: String!
      submitSurvey: String!
      saveSkill: String!
      saveCourse: String!
      saveCompetency: String!
      saveTalentPool: String!
      saveCompensationReviewCycle: String!
      saveSalaryBand: String!
      saveNotificationAutomationSettings: String!
      updateMyCelebrationPreferences: String!
    }
  `);

  assert.deepEqual(missingRequiredClientFields(schema), []);
});
