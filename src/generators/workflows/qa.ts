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

export function generateQaWorkflows(version: string): Record<string, string> {
  return {
    'session-from-cli.md': workflow(
      version,
      'Salesforce CLI Session Authentication',
      `
## Overview

This workflow shows how to authenticate Playwright tests using the active
SF CLI session — no passwords, no \`.env\` credentials. The access token is
read directly from \`sf org display\` via \`execFileSync\` (no shell interpolation).

## Prerequisites

| Tool | Check | Install |
|------|-------|---------|
| Salesforce CLI | \`sf --version\` | [https://developer.salesforce.com/tools/salesforcecli](https://developer.salesforce.com/tools/salesforcecli) |
| @playwright/test | \`npx playwright --version\` | \`npm install --save-dev @playwright/test && npx playwright install\` |

Verify you have an authenticated org:
\`\`\`bash
sf org display --json | grep instanceUrl
\`\`\`

## 1. Scaffold the Utilities (One-Time Setup)

Run setup-agents to generate \`src/utils/salesforce-auth.ts\` and
\`src/utils/salesforce-api.ts\` in your project:

\`\`\`bash
sf setup-agents local --profile qa
\`\`\`

Both files are written to \`src/utils/\`. They are not overwritten unless you
pass \`--force\`.

## 2. Use in Tests

### Pattern A — Full navigation (recommended for UI tests)

\`\`\`typescript
import { test, expect } from '@playwright/test';
import { navigateWithCLISession } from '../src/utils/salesforce-auth';

test.describe('Case Management', () => {
  test.beforeEach(async ({ page, context }) => {
    await navigateWithCLISession(page, context);
  });

  test('should show cases list', async ({ page }) => {
    await page.goto('/lightning/o/Case/list');
    await expect(page.getByRole('button', { name: 'New' })).toBeVisible();
  });
});
\`\`\`

### Pattern B — Context-only (for API-heavy tests)

\`\`\`typescript
import { test } from '@playwright/test';
import { useSalesforceCLISession } from '../src/utils/salesforce-auth';
import { createRecord, deleteRecord } from '../src/utils/salesforce-api';

test('creates and deletes a case', async ({ page, context }) => {
  await useSalesforceCLISession(context);
  const caseId = await createRecord(page, 'Case', { Subject: 'Playwright Test', Status: 'New' });
  // ... assertions ...
  await deleteRecord(page, 'Case', caseId);
});
\`\`\`

### Pattern C — Fixture (for multi-test suites)

\`\`\`typescript
// fixtures/sfFixture.ts
import { test as base } from '@playwright/test';
import { navigateWithCLISession } from '../src/utils/salesforce-auth';

export const test = base.extend({
  sfPage: async ({ page, context }, use) => {
    await navigateWithCLISession(page, context);
    await use(page);
  },
});
\`\`\`

## 3. Targeting a Specific Org

Set \`SF_TARGET_ORG\` to use a named org or alias instead of the default:

\`\`\`bash
SF_TARGET_ORG=qa-sandbox npx playwright test
\`\`\`

Or in \`playwright.config.ts\`:
\`\`\`typescript
process.env.SF_TARGET_ORG = 'qa-sandbox';
\`\`\`

## 4. CI/CD (No SF CLI Available)

In CI, inject the org URL and token as environment variables instead:

\`\`\`bash
SALESFORCE_INSTANCE_URL=https://myorg.my.salesforce.com
SALESFORCE_ACCESS_TOKEN=00D...
\`\`\`

Modify \`getSalesforceOrgInfo()\` to check these env vars first:
\`\`\`typescript
if (process.env.SALESFORCE_INSTANCE_URL && process.env.SALESFORCE_ACCESS_TOKEN) {
  return {
    instanceUrl: process.env.SALESFORCE_INSTANCE_URL,
    accessToken: process.env.SALESFORCE_ACCESS_TOKEN,
    username: process.env.SALESFORCE_USERNAME ?? 'ci-user',
    orgId: process.env.SALESFORCE_ORG_ID ?? '',
  };
}
\`\`\`
`
    ),
    'run-playwright.md': workflow(
      version,
      'Run Playwright Tests',
      `
## Prerequisites

| Tool | Check | Install |
|------|-------|---------|
| Node.js >= 18 | \`node --version\` | [https://nodejs.org](https://nodejs.org) |
| @playwright/test | \`npx playwright --version\` | \`npm install --save-dev @playwright/test && npx playwright install\` |

Before running tests, verify Playwright is installed:

\`\`\`bash
npx playwright --version 2>/dev/null || (echo "Installing Playwright..." && npm install --save-dev @playwright/test && npx playwright install)
\`\`\`

## 1. Confirm Environment

Ask which org / environment to test against. Validate the \`.env\` file has the required credentials.

## 2. Run Tests

\`\`\`bash
# All tests
npx playwright test

# Specific test file
npx playwright test tests/<feature>.spec.ts

# Specific tag
npx playwright test --grep "@smoke"
\`\`\`

## 3. Analyse Results

If tests fail:
- Read the error message and screenshot (captured automatically on failure)
- Check if the failure is a flake (retry once) or a real regression
- Identify the Page Object responsible for the failed selector

## 4. Open Report

\`\`\`bash
npx playwright show-report
\`\`\`

Report pass/fail summary and any accessibility violations found by axe-core.
`
    ),
    'generate-test-report.md': workflow(
      version,
      'Generate QA Test Report',
      `
## Prerequisites

| Tool | Check | Install |
|------|-------|---------|
| @playwright/test | \`npx playwright --version\` | \`npm install --save-dev @playwright/test && npx playwright install\` |

## 1. Run Full Suite with Trace

\`\`\`bash
npx playwright test --reporter=html --trace=on
\`\`\`

## 2. Collect Results

Read the \`playwright-report/index.html\` output:
- Total tests: passed / failed / skipped
- Duration
- Screenshots and traces for failing tests
- Accessibility violations summary

## 3. Summarise

Generate a markdown summary table:

| Suite | Passed | Failed | Skipped | Coverage |
|-------|--------|--------|---------|----------|
| ...   | ...    | ...    | ...     | ...      |

Attach to PR description or Jira ticket as requested by the developer.
`
    ),
  };
}
