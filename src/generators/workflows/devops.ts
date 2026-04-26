/*
 * Copyright 2026, Salesforce, Inc.
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

export function generateDevopsWorkflows(version: string): Record<string, string> {
  return {
    'release.md': workflow(
      version,
      'Create Release',
      `
## 1. Gather Release Scope

Ask:
- Target environment (sandbox / staging / production)
- Version number (semantic versioning: MAJOR.MINOR.PATCH)

Check merged branches since last release:

\`\`\`bash
git log --oneline <last-tag>..HEAD --merges
\`\`\`

## 2. Build Changelog

Extract commit messages grouped by type (feat, fix, chore):

\`\`\`bash
git log --oneline <last-tag>..HEAD
\`\`\`

Create or update \`CHANGELOG.md\` with the new version section.

## 3. Bump Version

Update \`sfdx-project.json\` → \`sourceApiVersion\` if needed, and version in \`package.json\`.

\`\`\`bash
npm version <major|minor|patch> --no-git-tag-version
\`\`\`

## 4. Validate and Tag

\`\`\`bash
sf project deploy validate -d force-app --target-org <staging-alias> --test-level RunLocalTests
\`\`\`

**IMPORTANT — Active Monitoring:** Wait for validation to complete before tagging.
Poll with \`sf project deploy report\` if needed. Only tag after successful validation.

\`\`\`bash
git tag -a v<version> -m "Release v<version>"
git push origin v<version>
\`\`\`
`
    ),
    'create-scratch-org.md': workflow(
      version,
      'Create and Setup Scratch Org',
      `
## 1. Confirm Definition File

Read \`config/project-scratch-def.json\` and confirm settings with the developer.

## 2. Create Scratch Org

\`\`\`bash
sf org create scratch --definition-file config/project-scratch-def.json --alias <alias> --duration-days 7
\`\`\`

## 3. Deploy Source

\`\`\`bash
sf project deploy start -d force-app --target-org <alias>
\`\`\`

**Active Monitoring:** Wait for the deployment to complete and report the result
before moving to the next step.

## 4. Assign Permission Sets

\`\`\`bash
sf org assign permset --name <PermSetName> --target-org <alias>
\`\`\`

## 5. Load Sample Data (if applicable)

\`\`\`bash
sf data import tree --plan data/sample-data-plan.json --target-org <alias>
\`\`\`

Report the scratch org URL:

\`\`\`bash
sf org open --target-org <alias>
\`\`\`
`
    ),
  };
}
