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

/**
 * Generates reusable Agentforce Vibes workflows for `.a4drules/workflows/`.
 * Workflows are invoked in chat with `/[filename.md]`.
 * Each function returns a `Record<filename, content>` map.
 */

/** Base workflows always generated for Salesforce projects. */
export function generateBaseWorkflows(version: string): Record<string, string> {
  return {
    'deploy.md': deployWorkflow(version),
    'run-tests.md': runTestsWorkflow(version),
    'validate.md': validateWorkflow(version),
    'code-quality.md': codeQualityWorkflow(version),
  };
}

// ─── Base workflow content ─────────────────────────────────────────────────

function deployWorkflow(version: string): string {
  return workflow(
    version,
    'Deploy Salesforce Components',
    `
## 1. Gather Deployment Information

Ask which components to deploy and which org to target.
Then validate the org connection:

\`\`\`bash
sf org display --target-org <alias>
\`\`\`

## 2. Pre-Deployment Validation

Run a dry-run to catch issues before deploying:

\`\`\`bash
sf project deploy start --dry-run --target-org <alias>
\`\`\`

Review any validation errors and fix them before continuing.

## 3. Confirm and Deploy

Ask user to confirm, then execute the deployment:

\`\`\`bash
sf project deploy start --target-org <alias>
\`\`\`

## 4. Post-Deployment Validation

Run Apex tests to confirm nothing is broken:

\`\`\`bash
sf apex test run --target-org <alias> --code-coverage --result-format human
\`\`\`

Report the deployment outcome and test coverage to the user.
`
  );
}

function runTestsWorkflow(version: string): string {
  return workflow(
    version,
    'Run Apex Tests',
    `
## 1. Select Test Scope

Ask whether to run all tests or specific classes. Then execute:

\`\`\`bash
# All local tests
sf apex test run --target-org <alias> --test-level RunLocalTests --code-coverage --result-format human

# Specific classes
sf apex test run --target-org <alias> --class-names "<Class1,Class2>" --code-coverage --result-format human
\`\`\`

## 2. Analyse Results

Read test results and report:
- Total pass / fail count
- Classes or methods that failed (with error messages)
- Overall code coverage percentage
- Classes below the 90% coverage threshold

## 3. Fix and Re-run

If failures exist, identify the root cause, apply fixes, and re-run the affected test class.
`
  );
}

function validateWorkflow(version: string): string {
  return workflow(
    version,
    'Validate Deployment (Dry Run)',
    `
## 1. Identify Components

Ask which components or directory to validate. Default: \`force-app\`.

## 2. Execute Validation

\`\`\`bash
sf project deploy validate -d force-app --target-org <alias> --test-level RunLocalTests
\`\`\`

## 3. Report Results

Summarise:
- Whether validation passed or failed
- Any metadata conflicts or missing dependencies
- Test coverage results (must be ≥ 90%)

If validation fails, identify which components need attention before a real deploy.
`
  );
}

function codeQualityWorkflow(version: string): string {
  return workflow(
    version,
    'Code Quality — Pre-commit Hook (Apex + LWC)',
    `
## Overview

This workflow sets up a **Husky pre-commit hook** that runs \`sf code-analyzer\` on
staged Apex and LWC files. It blocks commits only on **HIGH / critical** violations
(\`--severity-threshold 1\`). MEDIUM and LOW issues are reported as warnings but do
not prevent the commit.

The hook is **profile-agnostic** — it triggers on every commit, regardless of which
developer profile is configured.

## Prerequisites

| Tool | Check | Install |
|------|-------|---------|
| Salesforce CLI | \`sf --version\` | [https://developer.salesforce.com/tools/salesforcecli](https://developer.salesforce.com/tools/salesforcecli) |
| Code Analyzer | \`sf plugins inspect @salesforce/plugin-code-analyzer\` | \`sf plugins install @salesforce/plugin-code-analyzer\` |
| Husky | \`npx husky --version\` | \`npm install --save-dev husky\` |

If \`sf code-analyzer\` is not installed, the pre-commit hook will **skip analysis
with a warning** instead of blocking commits.

## Setup

Install Husky and create the hook file:

\`\`\`bash
npm install --save-dev husky
npx husky init
\`\`\`

Then replace \`.husky/pre-commit\` with the script below.

## Pre-commit Script

\`\`\`bash
#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Pre-commit: Salesforce Code Analyzer (Apex PMD + LWC ESLint)
# Blocks on HIGH/critical only (--severity-threshold 1).
# Skips gracefully if sf code-analyzer is not installed.
# ─────────────────────────────────────────────────────────────
set -euo pipefail

if ! sf plugins inspect @salesforce/plugin-code-analyzer &>/dev/null 2>&1; then
  echo "⚠️  sf code-analyzer not installed — skipping pre-commit analysis."
  echo "   Install with: sf plugins install @salesforce/plugin-code-analyzer"
  exit 0
fi

STAGED=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$STAGED" ]; then
  echo "ℹ️  No staged files — skipping Code Analyzer."
  exit 0
fi

EXIT_CODE=0

# ── Apex (PMD) ──────────────────────────────────────────────
APEX_FILES=$(echo "$STAGED" | grep '\\.cls$' || true)

if [ -n "$APEX_FILES" ]; then
  APEX_COUNT=$(echo "$APEX_FILES" | wc -l | tr -d ' ')
  echo "🔍 Analyzing $APEX_COUNT Apex file(s) with PMD…"

  APEX_TARGET=$(echo "$APEX_FILES" | paste -sd ',' -)
  sf code-analyzer run \\
    --target "$APEX_TARGET" \\
    --rule-selector "pmd:Recommended,pmd:Security,pmd:Performance" \\
    --severity-threshold 1 || APEX_EXIT=$?

  APEX_EXIT=\${APEX_EXIT:-0}
  if [ "$APEX_EXIT" -eq 2 ]; then
    echo "❌ Apex: HIGH-severity violations found — commit blocked."
    EXIT_CODE=1
  elif [ "$APEX_EXIT" -ne 0 ]; then
    echo "⚠️  Apex: warnings found (MEDIUM/LOW) — commit allowed."
  else
    echo "✅ Apex: no issues."
  fi
else
  echo "ℹ️  No staged Apex files."
fi

# ── LWC (ESLint) ────────────────────────────────────────────
LWC_FILES=$(echo "$STAGED" \\
  | grep '/lwc/' \\
  | grep -v '/__tests__/' \\
  | grep -E '\\.(js|html)$' || true)

if [ -n "$LWC_FILES" ]; then
  LWC_COUNT=$(echo "$LWC_FILES" | wc -l | tr -d ' ')
  LWC_JS_COUNT=$(echo "$LWC_FILES" | grep -c '\\.js$' || echo 0)
  LWC_HTML_COUNT=$(echo "$LWC_FILES" | grep -c '\\.html$' || echo 0)
  echo "🔍 Analyzing $LWC_COUNT LWC file(s) ($LWC_JS_COUNT .js, $LWC_HTML_COUNT .html) with ESLint…"

  LWC_TARGET=$(echo "$LWC_FILES" | paste -sd ',' -)
  sf code-analyzer run \\
    --target "$LWC_TARGET" \\
    --rule-selector "eslint:Recommended,eslint:Security" \\
    --severity-threshold 1 || LWC_EXIT=$?

  LWC_EXIT=\${LWC_EXIT:-0}

  # Fallback: if the CLI rejects .html targets, retry with .js only
  if [ "$LWC_EXIT" -ne 0 ] && [ "$LWC_HTML_COUNT" -gt 0 ]; then
    LWC_JS_ONLY=$(echo "$LWC_FILES" | grep '\\.js$' || true)
    if [ -n "$LWC_JS_ONLY" ]; then
      echo "⚠️  Retrying LWC analysis with .js files only (HTML targets unsupported)…"
      LWC_TARGET_JS=$(echo "$LWC_JS_ONLY" | paste -sd ',' -)
      sf code-analyzer run \\
        --target "$LWC_TARGET_JS" \\
        --rule-selector "eslint:Recommended,eslint:Security" \\
        --severity-threshold 1 || LWC_EXIT=$?
      LWC_EXIT=\${LWC_EXIT:-0}
    fi
  fi

  if [ "$LWC_EXIT" -eq 2 ]; then
    echo "❌ LWC: HIGH-severity violations found — commit blocked."
    EXIT_CODE=1
  elif [ "$LWC_EXIT" -ne 0 ]; then
    echo "⚠️  LWC: warnings found (MEDIUM/LOW) — commit allowed."
  else
    echo "✅ LWC: no issues."
  fi
else
  echo "ℹ️  No staged LWC files."
fi

exit $EXIT_CODE
\`\`\`

## Exit Code Behavior

| Exit Code | Meaning | Commit |
|-----------|---------|--------|
| 0 | No issues or MEDIUM/LOW only | **Allowed** |
| 2 | HIGH / critical violations | **Blocked** |
| Other | Analyzer error / warning | **Allowed** (non-blocking) |

## File Filters

| Type | Glob | Exclusions |
|------|------|------------|
| Apex | \`*.cls\` (staged) | — |
| LWC JS | \`**/lwc/**/*.js\` (staged) | \`**/__tests__/**\` |
| LWC HTML | \`**/lwc/**/*.html\` (staged) | \`**/__tests__/**\` |

## Fallback for HTML Targets

If \`sf code-analyzer\` does not support \`.html\` targets for ESLint rules,
the hook automatically retries with only \`.js\` files. This ensures the hook
never breaks on CLI version differences.
`
  );
}

// ─── Profile-specific workflow builders ────────────────────────────────────

/** Developer profile workflows: create Apex class, LWC, trigger. */
export function generateDeveloperWorkflows(version: string): Record<string, string> {
  return {
    'create-apex-class.md': workflow(
      version,
      'Create Apex Class',
      `
## 1. Gather Requirements

Ask:
- Class name (PascalCase, infer prefix from project)
- Purpose (service, handler, utility, REST, batch, etc.)
- Sharing model (\`with sharing\` default; \`without sharing\` for REST)

Read \`sfdx-project.json\` to confirm the API version.

## 2. Generate Class

Create the Apex class following project naming conventions.
Check for an existing exception class; if none exists, propose one first.

Scan for existing patterns in \`force-app/main/default/classes/\` before generating.

## 3. Create Test Class

Generate \`<ClassName>_Test.cls\` with:
- One Assert per test method (modern \`Assert\` class)
- \`@TestSetup\` for shared data
- \`System.runAs()\` with PSG-based test users where relevant
- Target 90% coverage

## 4. Deploy

\`\`\`bash
sf project deploy start --source-dir force-app/main/default/classes/<ClassName>.cls --target-org <alias>
sf project deploy start --source-dir force-app/main/default/classes/<ClassName>_Test.cls --target-org <alias>
\`\`\`
`
    ),
    'create-lwc.md': workflow(
      version,
      'Create Lightning Web Component',
      `
## 1. Gather Requirements

Ask:
- Component name (camelCase for API, kebab-case for directory)
- Purpose and data it needs to display
- Whether it needs a controller Apex class

## 2. Generate Component Files

Create:
- \`<name>.html\` — SLDS-based template using Styling Hooks
- \`<name>.js\` — LWC controller using LDS 2 / wire adapters
- \`<name>.css\` — only if custom styling is truly needed
- \`<name>.js-meta.xml\` — metadata with appropriate targets

## 3. Generate Apex Controller (if needed)

Follow Apex rules: one Assert per test, JT_DynamicQueries or DataSelector.

## 4. Deploy

\`\`\`bash
sf project deploy start --source-dir force-app/main/default/lwc/<name> --target-org <alias>
\`\`\`
`
    ),
    'create-trigger.md': workflow(
      version,
      'Create Apex Trigger + Handler',
      `
## 1. Confirm Object

Ask which SObject needs the trigger. Check \`force-app/main/default/triggers/\`
to verify no trigger already exists for that object (one trigger per object rule).

## 2. Generate Trigger (Logic-free)

\`\`\`apex
trigger <ObjectName>Trigger on <ObjectName> (before insert, before update, after insert, after update) {
    new <ObjectName>TriggerHandler().run();
}
\`\`\`

## 3. Generate Handler

Create \`<ObjectName>TriggerHandler.cls\` following the Kevin O'Hara pattern:
- Extend \`TriggerHandler\`
- Override only the needed context methods (beforeInsert, afterUpdate, etc.)
- Delegate immediately to service/selector classes — zero business logic inline

## 4. Deploy

\`\`\`bash
sf project deploy start --source-dir force-app/main/default/triggers/<ObjectName>Trigger.trigger --target-org <alias>
sf project deploy start --source-dir force-app/main/default/classes/<ObjectName>TriggerHandler.cls --target-org <alias>
\`\`\`
`
    ),
  };
}

/** Architect profile workflows: Architecture Decision Records. */
export function generateArchitectWorkflows(version: string): Record<string, string> {
  return {
    'adr.md': workflow(
      version,
      'Create Architecture Decision Record (ADR)',
      `
## 1. Gather Context

Ask:
- What decision needs to be documented?
- What options were considered?
- What are the trade-offs?

Read existing ADRs in \`/docs/adr/\` to determine the next ADR number.

## 2. Produce Mermaid Diagram

Generate a diagram illustrating the proposed solution:
- \`graph TD\` for flow decisions
- \`classDiagram\` for data model decisions
- \`sequenceDiagram\` for integration decisions

## 3. Create ADR File

Create \`/docs/adr/ADR-NNN-<short-title>.md\` with:

\`\`\`markdown
# ADR-NNN: <Title>

## Status
Proposed | Accepted | Deprecated | Superseded by ADR-NNN

## Context
<What problem are we solving and why does it matter?>

## Decision
<What have we decided to do?>

## Consequences
<What becomes easier or harder as a result?>
\`\`\`

## 4. Get Agreement

Present the ADR to the developer and confirm agreement before any implementation begins.
`
    ),
  };
}

/** DevOps profile workflows: release management, scratch org setup. */
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

/** QA profile workflows: Playwright test execution and reporting. */
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

/** CRMA profile workflows: analytics deployment. */
export function generateCrmaWorkflows(version: string): Record<string, string> {
  return {
    'deploy-analytics.md': workflow(
      version,
      'Deploy CRM Analytics Metadata',
      `
## 1. Confirm Deployment Scope

Ask which analytics components to deploy (Recipes, Datasets, Dashboards, Apps).

Read \`package.xml\` to confirm metadata types:
- \`WaveDataset\`, \`WaveDataflow\`, \`WaveRecipe\`
- \`WaveDashboard\`, \`WaveLens\`, \`WaveApplication\`

## 2. Validate Deployment Order

Analytics metadata must be deployed in this order:
1. Datasets (WaveDataset)
2. Dataflows / Recipes (WaveDataflow, WaveRecipe)
3. Lenses (WaveLens)
4. Dashboards (WaveDashboard)
5. Apps (WaveApplication)

## 3. Deploy

\`\`\`bash
sf project deploy start --target-org <alias> --metadata WaveDataset WaveRecipe WaveDashboard WaveApplication
\`\`\`

## 4. Post-Deployment Validation

- Verify recipe ran successfully in the target org.
- Confirm row counts in datasets match expected values.
- Check security predicates are applied correctly under test personas.

Report any manual post-deployment steps (schedule recipes, share app) to the developer.
`
    ),
  };
}

/** PM profile workflows: sprint planning, status reporting, risk management. */
export function generatePmWorkflows(version: string): Record<string, string> {
  return {
    'sprint-plan.md': workflow(
      version,
      'Create Sprint Plan',
      `
## 1. Gather Sprint Context

Ask:
- Sprint number and dates (start/end)
- Team capacity (members × available days)
- Carry-over items from previous sprint

Read existing sprint plans in \`/docs/sprints/\` to determine the next sprint number.

## 2. Build Sprint Backlog

Collect candidate items from the backlog. For each item confirm:
- Backlog Item ID
- Priority (P1 / P2 / P3)
- Story points estimate
- Assignee

Validate total story points do not exceed team velocity (average of last 3 sprints).

## 3. Generate Gantt Timeline

Produce a Mermaid Gantt chart showing the sprint timeline:

\`\`\`mermaid
gantt
  title Sprint N
  dateFormat YYYY-MM-DD
  section Development
    US-101 :a1, 2026-01-06, 3d
    US-102 :a2, after a1, 2d
  section Testing
    QA US-101 :b1, after a1, 1d
\`\`\`

## 4. Document Sprint Plan

Create \`/docs/sprints/sprint-NNN.md\` with:
- Sprint goal (one sentence)
- Capacity and velocity reference
- Sprint backlog table (ID, Story, Points, Assignee, Priority)
- Gantt chart
- Risks and dependencies

## 5. Get Agreement

Present the sprint plan and confirm commitment before the sprint starts.
`
    ),
    'status-report.md': workflow(
      version,
      'Generate Weekly Status Report',
      `
## 1. Gather Status Data

Collect from the team:
- Completed items this week (with Backlog Item IDs)
- In-progress items and % completion
- Blockers and escalations
- Risks (new or updated)

## 2. Calculate Metrics

- Planned vs actual story points completed
- Sprint burndown position (on track / behind / ahead)
- Overall project health: Scope / Schedule / Budget (Red / Amber / Green)

## 3. Generate Report

Create or update \`/docs/status/week-YYYY-WNN.md\` with:

\`\`\`markdown
# Weekly Status Report — Week NN

> Author: Salesforce Professional Services | Date: YYYY-MM-DD

## Health Dashboard

| Dimension | Status | Notes |
|-----------|--------|-------|
| Scope     | 🟢     | On track |
| Schedule  | 🟡     | 2 items at risk |
| Budget    | 🟢     | Within allocation |

## Accomplishments
- [US-101] Completed: <description>

## Upcoming
- [US-201] In progress (60%)

## Blockers
- [BLK-01] <description> — Owner: <name> — Age: N days

## Risks
| ID | Risk | Probability | Impact | Mitigation |
|----|------|-------------|--------|------------|
| R-01 | ... | High | High | ... |
\`\`\`

## 4. Share

Attach the report link to the appropriate Slack channel or email distribution.
`
    ),
    'risk-register.md': workflow(
      version,
      'Maintain Risk Register',
      `
## 1. Review Current Risks

Read \`/docs/risk-register.md\` to see existing risks. If the file does not exist, create it.

## 2. Identify New Risks

Ask the team about:
- Technical risks (integration failures, data quality, performance)
- Schedule risks (dependencies, resource availability, scope creep)
- External risks (vendor delays, regulatory changes)

## 3. Assess and Document

For each risk, capture:

| Field | Description |
|-------|-------------|
| ID | Sequential (R-NNN) |
| Description | Clear statement of the risk |
| Probability | Low / Medium / High |
| Impact | Low / Medium / High |
| Mitigation | Actions to reduce probability or impact |
| Owner | Person responsible for monitoring |
| Status | Open / Mitigated / Closed |

## 4. Update Register

Update \`/docs/risk-register.md\` with new and modified entries. Never delete closed risks — mark them as Closed with resolution date.

## 5. Escalation

Risks with both High probability and High impact must be escalated immediately.
Flag any blocker older than 3 business days.
`
    ),
  };
}

// ─── Shared helper ─────────────────────────────────────────────────────────

function workflow(version: string, title: string, body: string): string {
  return `<!-- setup-agents: ${version} -->\n# ${title}\n${body.trimStart()}`;
}
