import type { GraphQLObjectType, GraphQLSchema } from "graphql";

const REQUIRED_CLIENT_FIELDS = {
  Query: [
    "myAttendanceSummary",
    "leaveApprovalQueue",
    "notificationAutomationSettings",
    "myCelebrationPreferences",
    "benefitTypes",
    "benefitPlans",
    "jobPostings",
    "reviewCycles",
    "performancePrograms",
    "myPerformanceReviews",
    "myTeamPerformanceReviews",
    "performanceReviewDetail",
    "surveys",
    "survey",
    "surveyAudience",
    "surveyAudienceOptions",
    "surveyManagementEvents",
    "availableSurveys",
    "surveyResults",
    "surveyResultsCatalog",
    "skills",
    "courses",
    "competencies",
    "talentPools",
    "salaryBands",
    "compensationReviewCycles",
  ],
  Mutation: [
    "saveBenefitType",
    "saveBenefitPlan",
    "saveJobPosting",
    "saveReviewCycle",
    "savePerformanceProgram",
    "saveAppraisalTemplate",
    "publishAppraisalTemplate",
    "activatePerformanceProgram",
    "launchPerformanceCycle",
    "proposePerformanceGoal",
    "approvePerformanceGoals",
    "addPerformanceFeedback",
    "advancePerformanceCycle",
    "submitSelfAppraisal",
    "submitManagerAppraisal",
    "acknowledgePerformanceReview",
    "saveSurvey",
    "publishSurvey",
    "openSurvey",
    "closeSurvey",
    "submitSurvey",
    "saveSkill",
    "saveCourse",
    "saveCompetency",
    "saveTalentPool",
    "saveCompensationReviewCycle",
    "saveSalaryBand",
    "saveNotificationAutomationSettings",
    "updateMyCelebrationPreferences",
  ],
} as const;

function missingFields(
  typeName: keyof typeof REQUIRED_CLIENT_FIELDS,
  type: GraphQLObjectType | null | undefined,
): string[] {
  const fields = type?.getFields() ?? {};
  return REQUIRED_CLIENT_FIELDS[typeName]
    .filter((fieldName) => fields[fieldName] === undefined)
    .map((fieldName) => `${typeName}.${fieldName}`);
}

export function missingRequiredClientFields(schema: GraphQLSchema): string[] {
  return [
    ...missingFields("Query", schema.getQueryType()),
    ...missingFields("Mutation", schema.getMutationType()),
  ];
}
