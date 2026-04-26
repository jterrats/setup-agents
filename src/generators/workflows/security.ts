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

export function generateSecurityWorkflows(version: string): Record<string, string> {
  return {
    'sharing-model-review.md': workflow(
      version,
      'Sharing Model Review',
      `
## 1. Audit Current OWD Settings

Retrieve the current Organization-Wide Defaults for all objects:

\`\`\`bash
sf org open --target-org <alias> --path "/lightning/setup/SecuritySharing/home"
\`\`\`

Document the current OWD for each object in scope. Classify as:
- **Private** — appropriate for PII, financial, or confidential data
- **Public Read Only** — appropriate when broad visibility is needed without edit access
- **Public Read/Write** — only when all users should have full access
- **Controlled by Parent** — for detail objects in master-detail relationships

## 2. Identify Over-Permissioned Objects

Flag objects where OWD is less restrictive than needed:
- Objects with PII/PHI fields set to Public Read/Write
- Objects with financial data set to anything other than Private
- Custom objects with no documented justification for Public access

## 3. Recommend Sharing Rules

For each object that needs scoped access beyond the OWD:

**Criteria-Based Sharing Rules** — when access depends on field values:
- Region-based access (e.g., \`Region__c = 'EMEA'\`)
- Status-based access (e.g., \`Status__c = 'Active'\`)

**Owner-Based Sharing Rules** — when access follows role hierarchy:
- Grant read access to peer roles
- Grant read/write access to team leads

## 4. Test With Different User Contexts

Validate sharing works correctly by testing with users in different roles:

\`\`\`bash
# Run Apex tests that use System.runAs() with PSG-based users
sf apex test run --class-names "SharingModel_Test" --target-org <alias> --code-coverage --result-format human
\`\`\`

Verify:
- Users in restricted roles cannot see Private records they don't own
- Sharing rules grant access only to the intended records
- Apex Managed Sharing records appear in \`<Object>Share\` table correctly
`
    ),
    'fls-audit.md': workflow(
      version,
      'FLS & CRUD Audit',
      `
## 1. Scan Apex Classes for CRUD/FLS Violations

Run the Salesforce Code Analyzer with security-focused rules:

\`\`\`bash
sf code-analyzer run --target "force-app/main/default/classes/" --rule-selector "pmd:Security" --severity-threshold 1
\`\`\`

Look for:
- SOQL queries **without** \`WITH SECURITY_ENFORCED\` or \`WITH USER_MODE\`
- DML operations **without** \`Security.stripInaccessible()\`
- Missing CRUD checks before \`insert\`, \`update\`, \`delete\`
- Dynamic SOQL using string concatenation instead of bind variables

## 2. Classify Findings

For each violation, categorize by severity:
- **Critical:** User input flows into SOQL without sanitization (injection risk)
- **High:** DML without FLS enforcement on objects containing PII
- **Medium:** Missing \`WITH SECURITY_ENFORCED\` on internal queries
- **Low:** Missing CRUD checks on system-context operations with documented justification

## 3. Recommend Fixes

For each finding, apply the appropriate pattern:

**SOQL Queries:**
\`\`\`apex
// Before (vulnerable)
List<Account> accs = [SELECT Id, Name FROM Account WHERE Name = :name];

// After (secure)
List<Account> accs = [SELECT Id, Name FROM Account WHERE Name = :name WITH SECURITY_ENFORCED];
\`\`\`

**DML Operations:**
\`\`\`apex
// Before (vulnerable)
insert newRecords;

// After (secure)
SObjectAccessDecision decision = Security.stripInaccessible(AccessType.CREATABLE, newRecords);
insert decision.getRecords();
\`\`\`

**Dynamic SOQL:**
\`\`\`apex
// Before (injectable)
String query = 'SELECT Id FROM Account WHERE Name = \\'' + userInput + '\\'';

// After (safe)
String query = 'SELECT Id FROM Account WHERE Name = :userInput';
\`\`\`

## 4. Verify Fixes

Deploy the fixes and re-run the analyzer:

\`\`\`bash
sf project deploy start --source-dir force-app/main/default/classes/ --target-org <alias>
sf code-analyzer run --target "force-app/main/default/classes/" --rule-selector "pmd:Security" --severity-threshold 1
\`\`\`

Confirm zero Critical/High findings remain.
`
    ),
    'encryption-strategy.md': workflow(
      version,
      'Encryption Strategy (Shield)',
      `
## 1. Identify Fields Requiring Encryption

Survey all custom fields and classify by data sensitivity:

| Classification | Examples | Encryption Required |
|---|---|---|
| **Restricted** | SSN, Tax ID, credit card, health records | Yes — mandatory |
| **Confidential** | Salary, performance rating, legal notes | Yes — recommended |
| **Internal** | Internal codes, department references | No — unless regulated |
| **Public** | Company name, public email | No |

## 2. Choose Encryption Scheme

For each field requiring encryption, select the appropriate scheme:

**Deterministic Encryption** — use when the field needs:
- Equality-based \`WHERE\` filtering (\`= :value\`)
- \`GROUP BY\` aggregation
- Unique constraints or duplicate matching
- Case-insensitive search (with deterministic case-insensitive option)

**Probabilistic Encryption** — use when the field:
- Only needs display or export (no filtering)
- Contains highly sensitive data where stronger encryption is preferred
- Is never used in report filters, formulas, or \`ORDER BY\`

## 3. Assess Impact

Before enabling encryption, audit for conflicts:

- **Formulas:** Fields referenced in cross-object formulas cannot be encrypted
- **SOQL:** Encrypted fields cannot use \`LIKE\`, \`ORDER BY\`, or comparison operators
- **Validation Rules:** Cannot reference encrypted fields in formula conditions
- **Report Filters:** Deterministic-encrypted fields work; probabilistic do not
- **Workflows/Flows:** Field updates targeting encrypted fields require special handling

Document all conflicts and propose workarounds (e.g., helper fields, design changes).

## 4. Enable & Validate

1. Generate or upload a **Tenant Secret** in Setup > Platform Encryption > Key Management
2. Select the encryption policy for each field in Setup > Platform Encryption > Encryption Policy
3. Back-fill existing data using the **Background Encryption** service
4. Validate:
   - Encrypted fields display correctly for users with FLS access
   - Queries using deterministic-encrypted fields still return results
   - Reports using encrypted fields render without errors
   - Integrations receiving encrypted field data still function

## 5. Document & Schedule Rotation

Create an Encryption Impact Assessment document covering:
- Fields encrypted, scheme used, and justification
- Known limitations and workarounds
- Tenant Secret rotation schedule (per compliance framework)
- Responsible team for key management
`
    ),
  };
}
