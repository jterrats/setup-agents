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

**IMPORTANT — Active Monitoring:** Do NOT leave this command unattended.
Wait for the deployment to complete. If the command is long-running, poll
status with \`sf project deploy report\` until it finishes. Report the final
status (success/failure), component count, and any errors.

## 4. Post-Deployment Validation

Run Apex tests to confirm nothing is broken:

\`\`\`bash
sf apex test run --target-org <alias> --code-coverage --result-format human
\`\`\`

Wait for tests to complete. Report:
- Total pass/fail count
- Overall code coverage (must be ≥ 90%)
- Any failing tests with error messages
`
  );
}

function runTestsWorkflow(version: string): string {
  return workflow(
    version,
    'Run Apex Tests',
    `
## 0. Pre-flight: Ensure Productive Code Is Deployed

Before running any test class, verify the productive Apex class it covers has
been deployed to the target org. If the class was modified locally but not yet
deployed, deploy it first and wait for success. **Never run tests against stale
code in the sandbox.**

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

**IMPORTANT — Active Monitoring:** Wait for the validation to complete.
If the command is long-running, poll with \`sf project deploy report\` until finished.

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
    'architecture-review.md': workflow(
      version,
      'Architecture Review',
      `
## 1. Gather Context

Ask:
- Which feature or change is being reviewed?
- Which objects, APIs, or integrations are affected?

Read related ADRs in \`/docs/adr/\` for prior decisions.

## 2. Pattern Selection Review

Evaluate the proposed solution against established patterns:
- **Trigger strategy** — One trigger per object, Kevin O'Hara handler?
- **Flow strategy** — Sub-flows? One RTF per object/context?
- **Data layer** — JT_DynamicQueries or DataSelector?
- **Async** — @future vs Queueable vs Batch vs Schedulable?

Flag any deviations and require justification.

## 3. Security Review

- Sharing model: \`with sharing\` by default? Apex REST uses \`without sharing\`?
- Validation rule bypass: Custom Permissions only (no hardcoded Profile names)?
- Named Credentials for all external endpoints?
- Permission Set Groups aligned to personas?

## 4. Governor Limit Budget

Estimate resource consumption for the proposed change:
- SOQL queries (limit: 100 sync / 200 async)
- DML statements (limit: 150)
- Callouts (limit: 100)
- CPU time impact

Flag if the change pushes any limit above 60% of the governor cap.

## 5. Produce Review Document

Output a Mermaid diagram showing the solution architecture and write findings to
\`/docs/architecture-reviews/<feature>-review.md\` with: summary, pattern compliance,
security findings, governor limit assessment, and final recommendation (Approved / Needs Revision).
`
    ),
    'data-model-design.md': workflow(
      version,
      'Data Model Design',
      `
## 1. Gather Requirements

Ask:
- Which business entities are involved?
- What are the relationships between them (1:1, 1:N, N:M)?
- Are there existing objects that can be extended?

Read \`force-app/main/default/objects/\` to understand current data model.

## 2. Design the ERD

Produce a Mermaid ERD diagram:
\\\`\\\`\\\`mermaid
erDiagram
    ACCOUNT ||--o{ CONTACT : has
    ACCOUNT ||--o{ OPPORTUNITY : owns
\\\`\\\`\\\`

Include:
- Standard vs custom objects (label custom objects clearly)
- Junction objects for N:M relationships
- Lookup vs Master-Detail relationship type for each link
- Polymorphic lookups if needed

## 3. Evaluate Design Patterns

For each new object/relationship, consider:
- **Junction objects** — needed for N:M? Or can a related list suffice?
- **Big Objects** — data volume > 50M records? Consider Big Object archival.
- **External Objects** — data lives outside Salesforce? Use Salesforce Connect.
- **Custom Metadata Types** — configuration data? Use CMDT instead of Custom Objects.

## 4. Field Standards

- API Names: **PascalCase** (English). Labels: **Spanish**. Descriptions mandatory.
- Standard picklists: use **StandardValueSets**.
- Record Types: only when page layout or process branching requires it.

## 5. Document

Output to \`/docs/data-model/<feature>-erd.md\`:
- Mermaid ERD diagram
- Object table: API Name, Label, Type (Standard/Custom/Junction/Big), Record Types
- Relationship table: Parent, Child, Type (Lookup/Master-Detail), Cascade delete?
- Field inventory for new custom fields
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
    'create-recipe.md': workflow(
      version,
      'Create Analytics Recipe',
      `
## 1. Define Data Requirements

Ask:
- Which source objects/datasets feed this recipe?
- What is the output dataset name and purpose?
- Incremental or full refresh?

## 2. Document Data Lineage

Produce a Mermaid diagram showing the data flow:
\\\`\\\`\\\`mermaid
graph LR
    Source1[Source Dataset 1] --> Recipe[Recipe Name]
    Source2[Source Dataset 2] --> Recipe
    Recipe --> Output[Output Dataset]
\\\`\\\`\\\`

## 3. Build the Recipe

Follow these rules:
- Filter early — reduce record count before joins or transformations.
- Use **Recipes** (Data Prep), not legacy Dataflows.
- Design for incremental loads when possible.
- Dataset naming: **PascalCase** with source prefix (e.g., \`SF_OpportunityMetrics\`).

## 4. Configure Schedule

Set refresh frequency based on SLA:
- Match or exceed upstream data stream refresh frequency.
- Never leave schedule at default.

## 5. Validate

Run the recipe in sandbox and verify:
- Output row count matches expectations.
- No transformation errors in the recipe run log.
- Downstream dashboards/lenses render correctly with the new dataset.

Document the recipe in \`/docs/analytics/recipes.md\` with: name, sources, output, schedule, and lineage diagram.
`
    ),
    'create-dashboard.md': workflow(
      version,
      'Create Analytics Dashboard',
      `
## 1. Define the Primary Question

Every dashboard must answer a documented business question.

Ask:
- What is the primary question this dashboard answers?
- Who is the audience (executive, manager, analyst)?
- What datasets will be used?

## 2. Design Layout

Rules:
- Maximum **12 widgets per page** — split into multiple pages if needed.
- Follow SLDS color guidelines for chart palettes.
- Use consistent chart types: bar for comparison, line for trends, KPI for single metrics.

## 3. Build Widgets

For each widget:
- Write SAQL with explicit \`group by\` and \`order by\`.
- Filter early in the query — never load all records and filter at render time.
- Test SAQL in the lens editor before embedding in the dashboard.

## 4. Security Predicates

If the dashboard uses datasets with sensitive data:
- Verify that a Security Predicate is defined on each dataset.
- Test the dashboard under at least 3 user personas to confirm row-level security.

## 5. Test and Document

- Test on desktop and mobile viewports before release.
- Document in \`/docs/analytics/dashboards.md\`:
  primary question, audience, datasets used, security predicates applied, and page layout description.
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

/** BA profile workflows: story refinement, backlog grooming. */
export function generateBaWorkflows(version: string): Record<string, string> {
  return {
    'refine-stories.md': workflow(
      version,
      'Refine User Stories',
      `
## 1. Identify Stories to Refine

Ask: Which epic or set of user stories should we refine?

Read the story map from \`/docs/story-maps/\` to identify candidate stories.

## 2. Apply Refinement Checklist

For each story, verify:

1. **Persona** — Is a persona linked? If not, ask: *"Who is the primary user?"*
2. **Acceptance Criteria** — Are they in Gherkin format (Given / When / Then)?
3. **Fields & Objects** — Are impacted Salesforce objects and fields listed?
4. **Dependencies** — Are cross-story or cross-epic dependencies documented?
5. **T-shirt Size** — Is an estimate assigned (XS / S / M / L / XL)?
6. **Architect Review** — For M+ stories, has the Architect confirmed feasibility?

## 3. Output

Update the story map with refined stories. Mark each story as **Ready** or **Not Ready**.
Produce a summary table: US ID | Title | Status (Ready/Not Ready) | Missing Items.
`
    ),
    'groom-backlog.md': workflow(
      version,
      'Groom Backlog',
      `
## 1. Load Current Backlog

Read the story map from \`/docs/story-maps/\`.
List all stories with: US ID, Title, MoSCoW, Priority, T-shirt Size, Sprint assignment.

## 2. Prioritize

Apply MoSCoW classification if not already assigned.
Within each MoSCoW category, sort by Priority (P1 > P2 > P3).

Present a **Value vs Effort Matrix**:
- X-axis: Effort (T-shirt size)
- Y-axis: Business Value (from MoSCoW + Priority)
- Highlight quick wins (high value, low effort) and flag complex items (XL) for breakdown.

## 3. Sprint Assignment

Ask: Which sprint are we planning for? What is the team capacity?

Assign stories to the sprint until capacity is filled, prioritizing P1 Must-haves.
Produce the sprint backlog table: US ID | Title | Priority | Size | Assignee.

## 4. Sync to Issue Tracker (Optional)

If the user wants to push stories to an issue tracker, use the **Backlog Sync** skill.
`
    ),
  };
}

/** MuleSoft profile workflows: API creation, MUnit testing, deployment. */
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

/** UX profile workflows: UX audits, design reviews. */
export function generateUxWorkflows(version: string): Record<string, string> {
  return {
    'ux-audit.md': workflow(
      version,
      'UX Audit — LWC Interaction Checklist',
      `
## 1. Identify the Component

Ask: Which LWC component should be audited?

Read the component's HTML, JS, and CSS files.

## 2. Run the LWC Interaction Checklist

Evaluate every item and report pass/fail:

1. **Click efficiency** — Does this require too many clicks? If yes, suggest a shortcut.
2. **Cancel vs Submit separation** — Is Cancel clearly separated from Submit (different variant, adequate spacing)?
3. **Empty state** — Is there a clear empty state if no data is present (message + CTA)?
4. **Accessibility** — Contrast ratio (4.5:1), alt-text, aria-labels, keyboard navigation, screen-reader friendly.
5. **Custom Labels** — Are all user-facing strings sourced from Custom Labels?
6. **Feedback loops** — Are loading/success/error feedback loops defined (spinner + toast)?

## 3. Cognitive UX Laws Check

- **Jakob's Law** — Does it follow familiar Salesforce patterns?
- **Hick's Law** — Are there more than 7 choices presented at once? If so, recommend grouping.
- **Fitts's Law** — Are primary actions large enough and in predictable locations?

## 4. Produce Report

Create a findings document with:
- Component name and purpose
- Checklist results (pass/fail per item)
- Cognitive law compliance
- Recommended fixes with priority (Critical / High / Medium / Low)
`
    ),
    'design-review.md': workflow(
      version,
      'Design Review',
      `
## 1. Gather Context

Ask:
- Which feature or LWC is under review?
- Is there a mockup or wireframe? (file path or description)

Read the component files if they already exist.

## 2. Evaluate Against Standards

### SLDS Compliance
- Are SLDS components used instead of custom HTML?
- Are Styling Hooks used instead of custom CSS overrides?
- Are design tokens used for colors, spacing, and typography?

### WCAG 2.1 AA Compliance
- Text contrast ratios meet 4.5:1 (normal) / 3:1 (large)?
- All interactive elements have accessible labels?
- Keyboard navigation works for all interactions?

### Responsive Design
- Tested at 320px, 768px, and 1280px breakpoints?
- SLDS grid used for layout?

## 3. Produce Review Document

Output to \`/docs/ux-reviews/<component-name>-review.md\`:
- Summary of findings
- SLDS compliance: pass/fail
- Accessibility: pass/fail with specific issues
- Responsive: pass/fail
- Recommendations with severity
- Sign-off: Ready for development / Needs revision
`
    ),
  };
}

/** CGCloud profile workflows: deploy customizations, sandbox setup. */
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

/** Data360 profile workflows: data stream setup, identity resolution validation. */
export function generateData360Workflows(version: string): Record<string, string> {
  return {
    'setup-data-stream.md': workflow(
      version,
      'Setup Data Stream',
      `
## 1. Identify Source and Target

Ask:
- Source system (Salesforce CRM, S3, Ingestion API, etc.)
- Source object/entity name
- Target Data Lake Object (DLO) or Data Model Object (DMO)

## 2. Configure the Data Stream

Name convention: \`<Source>_<Object>_Stream\` (e.g., \`SF_Contact_Stream\`).

Document the field mapping in \`/docs/datacloud/stream-mappings.md\`:

| Source Field | Target DLO Field | Transformation |
|-------------|-----------------|---------------|
| ... | ... | ... |

## 3. Set Refresh Frequency

Ask: What is the SLA for data freshness?
- Real-time → use Change Data Capture or Ingestion API
- Hourly/Daily → configure scheduled refresh

Never leave refresh frequency at default.

## 4. Run Initial Sync

Trigger the first data stream sync and monitor to completion.

After sync, verify row counts:
- Expected records from source: N
- Records in DLO: N (should match or be within accepted delta)

Report any transformation errors or unmapped fields.

## 5. Document

Update \`/docs/datacloud/stream-mappings.md\` with:
- Stream name, source, target DLO
- Field mapping table
- Refresh frequency and SLA
- Initial sync date and row count
`
    ),
    'validate-identity-resolution.md': workflow(
      version,
      'Validate Identity Resolution',
      `
## 1. Load Representative Sample

Ask: Which Identity Resolution ruleset should we validate?

Ensure the target DMO has a representative sample of records (at minimum 1,000 records with known duplicates).

## 2. Review IR Configuration

Document the current IR rules:

| Rule Priority | Match Field(s) | Match Type | Reconciliation |
|--------------|---------------|-----------|---------------|
| 1 | Email | Exact | Most Recent |
| 2 | Phone + LastName | Fuzzy | Source Priority |
| ... | ... | ... | ... |

## 3. Run IR and Analyze Results

After running IR, report:
- Total source records
- Total unified profiles created
- Match rate (% of records that merged)
- Largest cluster size (flag if > 10 — may indicate over-matching)

## 4. Spot-check Results

Pick 5-10 merged profiles and verify:
- Were the correct records merged?
- Were reconciliation rules applied correctly (most recent, source priority)?
- Are there false positives (records merged that should not have been)?

## 5. Document Findings

Output to \`/docs/datacloud/ir-validation-<ruleset>-<date>.md\`:
- Ruleset configuration table
- Match rate and cluster statistics
- Spot-check results
- Recommendations (adjust fuzzy threshold, add/remove match fields)
- Sign-off: Approved for production / Needs adjustment
`
    ),
  };
}

// ─── Shared helper ─────────────────────────────────────────────────────────

function workflow(version: string, title: string, body: string): string {
  return `<!-- setup-agents: ${version} -->\n# ${title}\n${body.trimStart()}`;
}
