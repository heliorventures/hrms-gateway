import type { GraphQLObjectType, GraphQLSchema } from "graphql";

const REQUIRED_CLIENT_FIELDS = {
  Query: [
    "myLoans", "loanAccounts", "myLoanRequests", "loanRequestQueue", "loanAccount", "loanPolicies", "loanPolicyVersions", "loanLedger", "loanPayments", "loanSchedules", "previewLoanReversal",
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
    "performanceProgramPolicy",
    "performanceAdminCycles",
    "performanceCycleAdministration",
    "performancePopulationOptions",
    "privatePerformanceFeedback",
    "performanceGoalKpis",
    "performanceReviewRevision",
    "surveys",
    "survey",
    "surveyAudience",
    "surveyAudienceOptions",
    "surveyManagementEvents",
    "availableSurveys",
    "surveySubmissions",
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
    "publishLoanPolicy", "retireLoanPolicy", "saveLoanRequest", "submitLoanRequest", "decideLoanRequest", "withdrawLoanRequest", "recordLoanDisbursement", "recordLoanReceipt", "setLoanDeduction", "setLoanPeriodOverride", "reverseLoanPosting",
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
    "updatePerformanceGoal",
    "deletePerformanceGoal",
    "approvePerformanceGoals",
    "addPerformanceFeedback",
    "advancePerformanceCycle",
    "submitSelfAppraisal",
    "submitManagerAppraisal",
    "acknowledgePerformanceReview",
    "savePerformanceProgramPolicy",
    "archivePerformanceProgram",
    "savePerformanceCalibration",
    "reopenPerformanceReview",
    "setPerformanceParticipantExcluded",
    "addPrivatePerformanceFeedback",
    "savePerformanceKpiTarget",
    "submitPerformanceKpiActual",
    "deletePerformanceGoalKpi",
    "retryPerformanceException",
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
export function loanSchemaOwnershipErrors(subgraphs: readonly { name: string; schema: GraphQLSchema }[]): string[] {
  const loanQueries = new Set(["myLoans", "loanAccounts", "myLoanRequests", "loanRequestQueue", "loanAccount", "loanPolicies", "loanPolicyVersions", "loanLedger", "loanPayments", "loanSchedules", "previewLoanReversal"]);
  const loanMutations = new Set(["publishLoanPolicy", "retireLoanPolicy", "saveLoanRequest", "submitLoanRequest", "decideLoanRequest", "withdrawLoanRequest", "recordLoanDisbursement", "recordLoanReceipt", "setLoanDeduction", "setLoanPeriodOverride", "reverseLoanPosting"]);
  const privateFields = new Set(["lockRecoveryInputs", "prepareRecoveryQuote", "validateRecoveryQuote", "postPayrollRecoveries", "postFnfRecoveries", "authorizeExitReview", "confirmExitAuthorization", "cancelExitAuthorization"]);
  const owners = new Map<string, string[]>();
  const errors: string[] = [];
  for (const subgraph of subgraphs) {
    for (const [name, type, fields] of [["Query", subgraph.schema.getQueryType(), loanQueries], ["Mutation", subgraph.schema.getMutationType(), loanMutations]] as const) {
      for (const field of Object.keys(type?.getFields() ?? {})) {
        const key = `${name}.${field}`;
        if (privateFields.has(field)) errors.push(`${key} exposes private financial coordination from ${subgraph.name}`);
        if (!fields.has(field)) continue;
        const list = owners.get(key) ?? [];
        list.push(subgraph.name);
        owners.set(key, list);
        if (subgraph.name !== "payroll") errors.push(`${key} must be owned by Payroll, found ${subgraph.name}`);
      }
    }
  }
  for (const [field, names] of owners) if (names.length > 1) errors.push(`${field} has multiple owners: ${names.join(", ")}`);
  return errors;
}
