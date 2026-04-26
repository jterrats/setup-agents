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

export function generateQaWorkflows(version: string): Record<string, string> {
  return {
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
