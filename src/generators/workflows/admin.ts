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

export function generateAdminWorkflows(version: string): Record<string, string> {
  return {
    'create-flow.md': workflow(
      version,
      'Create Flow',
      `
## 1. Gather Requirements

Ask:
- **Object:** Which SObject does this flow operate on?
- **Timing:** Before Save or After Save?
- **Purpose:** What business rule or automation does it implement?
- **Sub-flow modularity:** Can any portion be reused across objects? If yes, extract to a sub-flow.

Check \`force-app/main/default/flows/\` to verify no Record-Triggered Flow already exists
for the same object + context (one RTF per object/context rule).

## 2. Design the Flow

- Name: \`<Object>_<Context>_<Purpose>\` (e.g., \`Case_AfterSave_EscalateHighPriority\`).
- Add a **fault path** on every action element, routed to a common error-handling sub-flow.
- Use **Custom Labels** for all user-facing text (screen labels, error messages, choices).
- Prefer **Before Save** for field updates on the triggering record (no DML cost).
- Use **After Save** only when creating/updating related records or publishing platform events.

## 3. Build Sub-flows (if applicable)

Extract reusable logic into sub-flows:
- Naming: \`SubFlow_<Purpose>\` (e.g., \`SubFlow_SendNotification\`).
- Sub-flows must accept input variables and return output variables — no hardcoded record IDs.

## 4. Deploy

\`\`\`bash
sf project deploy start --source-dir force-app/main/default/flows/<FlowApiName>.flow-meta.xml --target-org <alias>
\`\`\`

Activate the flow version in the target org after deployment.
`
    ),
    'create-validation-rule.md': workflow(
      version,
      'Create Validation Rule',
      `
## 1. Gather Requirements

Ask:
- **Object:** Which SObject needs the validation?
- **Business rule:** Under what conditions should the record be rejected?
- **Error message:** What should the user see? (Must use Custom Labels.)

## 2. Design the Rule

Apply the bypass pattern with Custom Permission:

\`\`\`
AND(
  NOT($Permission.Bypass_Validation_Rules),
  <your condition here>
)
\`\`\`

If \`Bypass_Validation_Rules\` Custom Permission does not exist, create it first:
- API Name: \`Bypass_Validation_Rules\`
- Label: Bypass Validation Rules
- Description: Allows data migration and integration users to bypass validation rules.

## 3. Configure Error Message

- Use a **Custom Label** for the error message — never hardcode text.
- Assign the error to a specific field when possible (improves UX).
- Document the business rule in the validation rule Description field.

## 4. Deploy

\`\`\`bash
sf project deploy start --source-dir force-app/main/default/objects/<Object>/validationRules/<RuleName>.validationRule-meta.xml --target-org <alias>
\`\`\`
`
    ),
    'permission-set-setup.md': workflow(
      version,
      'Permission Set Setup',
      `
## 1. Gather Requirements

Ask:
- **Feature or role:** What capability does this Permission Set grant?
- **Object access:** Which objects and fields are needed? (CRUD level)
- **Principle:** Apply **least-privilege** — grant only what is strictly required.

## 2. Create Permission Set

- API Name: \`<Feature>_<Access>\` (e.g., \`CaseManagement_Edit\`, \`ReportViewer_Read\`).
- Label: Descriptive, in Spanish (matching project convention).
- Description: Explain the intended audience and what it unlocks.
- Never include \`Modify All Data\` or \`View All Data\` unless explicitly justified.

## 3. Configure Permissions

- **Object permissions:** Set CRUD as needed (Read, Create, Edit, Delete).
- **Field-Level Security:** Grant access only to fields the role needs.
- **Tab visibility:** Set to \`Available\` or \`Visible\` as appropriate.
- **Apex class / VF page access:** Add only if required by the feature.

## 4. Permission Set Group (optional)

If multiple Permission Sets form a logical role, group them:
- API Name: \`<Role>_PSG\` (e.g., \`SalesRep_PSG\`).
- Include all relevant Permission Sets.
- Use PSGs for assignment instead of individual Permission Sets.

## 5. Deploy

\`\`\`bash
sf project deploy start --source-dir force-app/main/default/permissionsets/<PermSetName>.permissionset-meta.xml --target-org <alias>
\`\`\`

If using a Permission Set Group:

\`\`\`bash
sf project deploy start --source-dir force-app/main/default/permissionsetgroups/<PSGName>.permissionsetgroup-meta.xml --target-org <alias>
\`\`\`
`
    ),
  };
}
