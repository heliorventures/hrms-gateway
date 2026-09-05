import type { GraphQLObjectType, GraphQLSchema } from "graphql";

const REQUIRED_CLIENT_FIELDS = {
  Query: [
    "benefitTypes",
    "benefitPlans",
    "jobPostings",
    "reviewCycles",
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
    "saveSkill",
    "saveCourse",
    "saveCompetency",
    "saveTalentPool",
    "saveCompensationReviewCycle",
    "saveSalaryBand",
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
