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

export function generateCgcloudWorkflows(version: string): Record<string, string> {
  return {
    'deploy-cgcloud.md': workflow(
      version,
      'Deploy CGCloud Customizations',
      `
## 1. Pre-deployment Validation

- Verify no managed package components (\`cgcloud__\`) have been modified.
- Confirm all Modeler CMDT records are included in the deployment package.
- Check deployment order: CMDT records must deploy BEFORE dependent Apex.

## 2. Deploy CMDT First

\`\`\`bash
sf project deploy start -d force-app/main/default/customMetadata -o <target-org>
\`\`\`

Wait for completion. If CMDT deployment fails, do NOT proceed to Apex.

## 3. Deploy Custom Apex and Components

\`\`\`bash
sf project deploy start -d force-app -o <target-org>
\`\`\`

Monitor to completion. Report status, duration, and any errors.

## 4. Validate in CGCloud-enabled Sandbox

After deployment, verify:
- Modeler configurations render correctly in the CGCloud UI.
- Custom extension points execute as expected.
- No managed package errors in Setup > Installed Packages.

## IMPORTANT — Active Monitoring

Monitor every deployment step to completion. Never leave a deployment unattended.
`
    ),
    'setup-cgcloud-sandbox.md': workflow(
      version,
      'Setup CGCloud Development Sandbox',
      `
## 1. Verify Managed Package

Check that the CGCloud managed package is installed and at the expected version:

\`\`\`bash
sf package installed list -o <sandbox-alias>
\`\`\`

If the package is missing or outdated, coordinate with the admin to install/upgrade.

## 2. Apply Modeler Configuration

Deploy all CMDT (Modeler) records:

\`\`\`bash
sf project deploy start -d force-app/main/default/customMetadata -o <sandbox-alias>
\`\`\`

## 3. Assign Permission Set Groups

Assign CGCloud-specific PSGs to test users:
- Field Rep PSG
- Territory Manager PSG
- Back Office PSG

\`\`\`bash
sf org assign permset --name <PSG_Name> --target-org <sandbox-alias>
\`\`\`

## 4. Seed Demo Data

If a data plan exists in \`data/\`:

\`\`\`bash
sf data import tree --plan data/cgcloud-seed-plan.json -o <sandbox-alias>
\`\`\`

If no data plan exists, ask the user for the reference org to export from:

\`\`\`bash
sf data export tree --query "SELECT Id, Name FROM Account WHERE cgcloud__Account_Type__c != null LIMIT 50" -o <source-org> -d data/
\`\`\`

## 5. Verify Setup

Confirm:
- Managed package is active (no errors in Installed Packages).
- Modeler configs are visible in the CGCloud admin UI.
- Test users can log in and see CGCloud tabs.
`
    ),
  };
}
