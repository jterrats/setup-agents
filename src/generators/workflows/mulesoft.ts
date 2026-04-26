/*
 * Copyright 2026, Jaime Terrats.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { workflow } from '../workflow-generator.js';

export function generateMulesoftWorkflows(version: string): Record<string, string> {
  return {
    'create-mule-api.md': workflow(
      version,
      'Create MuleSoft API',
      `
## 1. Design the API Spec

Ask:
- API name, version, and API-led layer (\`sys-\`, \`proc-\`, or \`exp-\`).
- HTTP methods and resource paths.
- Request/response schemas.

Create the RAML or OAS 3.0 spec in \`src/main/resources/api/\`.

## 2. Scaffold the Mule Project

If no project exists:
\`\`\`bash
mvn archetype:generate -DarchetypeGroupId=org.mule.tools \\
  -DarchetypeArtifactId=mule-app-archetype -DarchetypeVersion=4.x
\`\`\`

Wire the API spec to the main flow using APIkit Router.

## 3. Configure Error Handling

Add an **On Error Propagate** scope in the main flow with:
- 400 → Bad Request (validation errors)
- 404 → Not Found
- 500 → Internal Server Error with correlation ID

## 4. Configure External Properties

Move all environment-specific values to \`mule-app.properties\`:
- API auto-discovery ID
- External system endpoints
- Timeout and retry configuration

Never hardcode endpoints or credentials in flows.

## 5. Publish to Exchange (Optional)

If Anypoint Platform is available:
\`\`\`bash
mvn clean deploy -DmuleDeploy
\`\`\`
`
    ),
    'run-munit.md': workflow(
      version,
      'Run MUnit Tests',
      `
## 1. Identify Test Scope

Ask: Which flows or API resources should be tested?

## 2. Run MUnit Tests

\`\`\`bash
mvn clean test
\`\`\`

Wait for the command to complete. Report: total tests, passed, failed, and coverage percentage.

## 3. Review Coverage

Target **80% flow coverage** minimum.
Identify uncovered flows and suggest MUnit test stubs for them.

## 4. Review Failures

For each failing test:
- Show the test name, expected vs actual result.
- Suggest a fix if the issue is apparent.

## IMPORTANT — Active Monitoring

Do NOT suggest running tests and leave the user to check. Wait for \`mvn test\` to finish and report the full result.
`
    ),
    'deploy-mule-app.md': workflow(
      version,
      'Deploy MuleSoft Application',
      `
## 1. Pre-deployment Checks

- Verify all MUnit tests pass: \`mvn clean test\`
- Confirm target environment (CloudHub / Runtime Fabric / on-prem)
- Verify \`mule-app.properties\` has correct values for target environment

## 2. Deploy

### CloudHub
\`\`\`bash
mvn clean deploy -DmuleDeploy \\
  -Dcloudhub.environment=<env> \\
  -Dcloudhub.workerType=MICRO \\
  -Dcloudhub.workers=1
\`\`\`

### Runtime Fabric
\`\`\`bash
mvn clean deploy -DmuleDeploy -Drtf.target=<target-name>
\`\`\`

## 3. Monitor Deployment

Wait for the deployment to complete. Poll status if needed.
Report: deployment status, application URL, and any warnings.

## 4. Verify Health

After deployment succeeds, hit the health endpoint:
\`\`\`bash
curl -s <app-url>/api/health
\`\`\`

Report the response status.

## IMPORTANT — Active Monitoring

Monitor the deployment from start to finish. Never ask the user to check deployment status.
`
    ),
  };
}
