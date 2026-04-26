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

/**
 * Generates reusable Agentforce Vibes workflows for `.a4drules/workflows/`.
 * Workflows are invoked in chat with `/[filename.md]`.
 *
 * Profile-specific workflows live in `./workflows/<profile>.ts`.
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
  return workflow(version, 'Code Quality — Pre-commit Hook (Apex + LWC)', CODE_QUALITY_BODY);
}

const CODE_QUALITY_BODY = `
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
`;

// ─── Shared helper ─────────────────────────────────────────────────────────

export function workflow(version: string, title: string, body: string): string {
  return `<!-- setup-agents: ${version} -->\n# ${title}\n${body.trimStart()}`;
}
