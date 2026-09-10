// Validate real UI documents against the locally compiled survey subgraph.
// Usage: node scripts/validate-survey-operations.mjs <export_survey_schema.exe>
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildSchema, parse, validate } from 'graphql';

const executable = process.argv[2];
if (!executable) throw new Error('Pass the compiled export_survey_schema executable');
const result = spawnSync(executable, [], { encoding: 'utf8', windowsHide: true });
if (result.error) throw result.error;
if (result.status !== 0) throw new Error(result.stderr || `Schema export exited ${result.status}`);
const schema = buildSchema(result.stdout);
const sourcePath = fileURLToPath(new URL('../../hrms-ui/src/modules/workplace/surveyQueries.ts', import.meta.url));
const source = readFileSync(sourcePath, 'utf8');
let checked = 0;
for (const match of source.matchAll(/export const (\w+) = gql`([\s\S]*?)`;/g)) {
  const [, name, document] = match;
  // This legacy department lookup belongs to the organization subgraph.
  if (name === 'SurveyDepartmentsDocument') continue;
  const errors = validate(schema, parse(document));
  if (errors.length) throw new Error(`${name}: ${errors.map(error => error.message).join('; ')}`);
  checked += 1;
}
if (checked < 10) throw new Error(`Only ${checked} survey documents discovered; verify extraction`);
console.log(`Validated ${checked} UI survey operations against the locally compiled schema.`);
