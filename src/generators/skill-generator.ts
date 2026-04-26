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
 * Generates Cursor Skill files (`.cursor/skills/<name>/SKILL.md`) and portable
 * skill content for other AI tools (Claude Code, Codex, Copilot, Agentforce).
 *
 * Each "generate*Skill()" function returns a `Record<relativePath, content>` map
 * for Cursor's native SKILL.md format (with YAML frontmatter + assets).
 *
 * The portable API (`getPortableSkillSections`, `getSharedSkillAssets`)
 * provides tool-agnostic content that each tool's generator can embed.
 */

import { backlogSyncSkillMd } from './backlog-sync-content.js';
import { codeAnalyzerSkillMd } from './code-analyzer-content.js';
import { diagramExportSkillMd, exportDiagramScript } from './diagram-export-content.js';
import { stripMdcFrontmatter } from './shared.js';

export const STORY_MAP_PROFILES = new Set(['ba', 'architect', 'pm']);
export const DEPLOY_PROFILES = new Set(['developer', 'devops', 'architect']);
export const CODE_ANALYZER_PROFILES = new Set(['developer', 'qa', 'architect', 'devops']);
export const BACKLOG_SYNC_PROFILES = new Set(['pm', 'ba']);

// ─── Portable API (tool-agnostic) ──────────────────────────────────────────

export type SkillSection = { title: string; body: string };

/**
 * Returns portable skill sections (plain markdown, no YAML frontmatter)
 * for the given profile IDs. Each tool's generator appends these to its config.
 */
export function getPortableSkillSections(profileIds: string[]): SkillSection[] {
  const ids = new Set(profileIds);
  const sections: SkillSection[] = [];

  if ([...ids].some((id) => STORY_MAP_PROFILES.has(id))) {
    sections.push({
      title: 'Story Mapping',
      body: stripMdcFrontmatter(storyMappingSkillMd()).trim(),
    });
    sections.push({
      title: 'Diagram Export',
      body: stripMdcFrontmatter(diagramExportSkillMd()).trim(),
    });
  }

  if ([...ids].some((id) => DEPLOY_PROFILES.has(id))) {
    sections.push({
      title: 'Salesforce Deploy & Validate',
      body: stripMdcFrontmatter(deploySkillMd()).trim(),
    });
  }

  if ([...ids].some((id) => CODE_ANALYZER_PROFILES.has(id))) {
    sections.push({
      title: 'Salesforce Code Analyzer',
      body: stripMdcFrontmatter(codeAnalyzerSkillMd()).trim(),
    });
  }

  if ([...ids].some((id) => BACKLOG_SYNC_PROFILES.has(id))) {
    sections.push({
      title: 'Backlog Sync',
      body: stripMdcFrontmatter(backlogSyncSkillMd()).trim(),
    });
  }

  return sections;
}

/**
 * Returns shared filesystem assets (scripts, CSS) that are tool-agnostic.
 * Keys are relative paths under `.setup-agents/skills/`.
 */
export function getSharedSkillAssets(profileIds: string[]): Record<string, string> {
  const ids = new Set(profileIds);
  const assets: Record<string, string> = {};

  if ([...ids].some((id) => STORY_MAP_PROFILES.has(id))) {
    assets['story-mapping/scripts/render-pdf.sh'] = renderPdfScript();
    assets['story-mapping/assets/mermaid-pdf.css'] = mermaidPdfCss();
    assets['diagram-export/scripts/export-diagram.sh'] = exportDiagramScript();
  }

  return assets;
}

// ─── Cursor-native Skill (SKILL.md + assets) ──────────────────────────────

export function generateStoryMappingSkill(): Record<string, string> {
  return {
    'SKILL.md': storyMappingSkillMd(),
    'scripts/render-pdf.sh': renderPdfScript(),
    'assets/mermaid-pdf.css': mermaidPdfCss(),
  };
}

function storyMappingSkillMd(): string {
  return `---
name: story-mapping
description: >-
  Generate user story maps following the Jeff Patton format with epics, user
  stories, personas, and priorities. Render Mermaid diagrams to PDF using
  mermaid-cli with truncation-safe CSS. USE FOR: story map, user story mapping,
  story mapping, epic breakdown, backlog visualization, user stories board,
  release planning map. Reusable by BA, Architect, and Solution Analyst profiles.
---

# Story Mapping

## Prerequisites

| Tool | Check | Install |
|------|-------|---------|
| Node.js >= 18 | \`node --version\` | [https://nodejs.org](https://nodejs.org) |
| npx | \`npx --version\` | Included with Node.js |

> mermaid-cli is auto-downloaded via \`npx -y\` — no manual install needed.

## When to Use

Use this skill when the user asks to create a story map, user story board,
epic breakdown, or backlog visualization. The output follows the Jeff Patton
story mapping format: personas across the top, epics as horizontal swim-lanes,
and user stories as cards within each epic, ordered by priority.

## Story Map Template (Markdown)

Generate a structured markdown document with this format:

\`\`\`markdown
# Story Map: <Project Name>

> Author: Salesforce Professional Services | Version: 1.0

## Personas

| ID | Persona | Description |
|----|---------|-------------|
| P1 | <Name>  | <Role and key goals> |
| P2 | <Name>  | <Role and key goals> |

## Priority Legend

| Level | Label | Criteria |
|-------|-------|----------|
| P1    | Must Have   | Critical for MVP / go-live |
| P2    | Should Have | High value, deferrable one sprint |
| P3    | Nice to Have | Enhances UX, not blocking |

## Epic 1: <Epic Name>

| US ID  | User Story | Persona | Priority | Acceptance Criteria |
|--------|-----------|---------|----------|---------------------|
| US-101 | <As a P1, I want to...> | P1 | P1 | Given... When... Then... |
| US-102 | <As a P2, I want to...> | P2 | P2 | Given... When... Then... |

## Epic 2: <Epic Name>

| US ID  | User Story | Persona | Priority | Acceptance Criteria |
|--------|-----------|---------|----------|---------------------|
| US-201 | ... | ... | ... | ... |
\`\`\`

### Numbering Convention

- Epic N user stories start at \`US-N01\` (e.g., Epic 3 → US-301, US-302...).
- Always use Gherkin (Given/When/Then) for acceptance criteria.

## Mermaid Diagram Generation

After producing the markdown, generate a Mermaid flowchart for visual
representation. Use subgraphs for epics and nodes for user stories.

\`\`\`mermaid
graph LR
  subgraph epic1 [Epic 1: Authentication]
    US101["US-101: Login via SSO"]
    US102["US-102: MFA Setup"]
    US103["US-103: Password Recovery"]
  end
  subgraph epic2 [Epic 2: Product Catalog]
    US201["US-201: Browse Products"]
    US202["US-202: Search Filters"]
  end
  subgraph epic3 [Epic 3: Checkout]
    US301["US-301: Add to Cart"]
    US302["US-302: Payment Processing"]
  end
\`\`\`

### Diagram Rules

1. Node IDs must not contain spaces: use \`US101\`, not \`US 101\`.
2. Wrap labels with special characters in double quotes: \`US101["US-101: Login"]\`.
3. Use \`graph LR\` (left-to-right) for story maps; \`graph TD\` for flow diagrams.
4. Do NOT apply custom colors or styles -- let the default theme handle it.
5. Keep subgraph IDs lowercase without spaces: \`subgraph epic1 [Epic 1: Name]\`.

## Rendering to PDF

Save the Mermaid diagram to a \`.mmd\` file, then render using the included script:

\`\`\`bash
bash .setup-agents/skills/story-mapping/scripts/render-pdf.sh story-map.mmd story-map.pdf
\`\`\`

### Validation (CRITICAL)

After rendering, **always** check the output:

1. If the script exits with code 1 and prints "No diagram detected", the Mermaid
   syntax is invalid. Common fixes:
   - Ensure the file starts with a valid diagram type (\`graph\`, \`flowchart\`, \`sequenceDiagram\`).
   - Remove trailing whitespace or BOM characters.
   - Escape special characters in labels with double quotes.
2. Open the PDF and verify no content is truncated (cut off at edges).
   The included CSS (\`assets/mermaid-pdf.css\`) prevents this, but very wide
   diagrams may need \`graph TD\` instead of \`graph LR\`.
3. For markdown-embedded diagrams, verify the diagram renders in the markdown
   preview before committing.

## Integration with Docs

Every story map document placed in \`/docs\` must follow the documentation standard:

1. Start with the Salesforce Cloud logo header.
2. Author: **Salesforce Professional Services**.
3. Scan existing \`/docs\` files before creating -- update rather than duplicate.
`;
}

function renderPdfScript(): string {
  return [
    '#!/usr/bin/env bash',
    '# Renders a Mermaid diagram (.mmd) to PDF using mermaid-cli.',
    '# Validates that the diagram was detected and parsed successfully.',
    '#',
    '# Usage: render-pdf.sh <input.mmd> [output.pdf]',
    '# Dependencies: Node.js >= 18 (npx)',
    'set -euo pipefail',
    '',
    '# ── Dependency guard ─────────────────────────────────────────────────────',
    'if ! command -v npx &>/dev/null; then',
    '  echo "ERROR: npx not found. Install Node.js >= 18 from https://nodejs.org"',
    '  exit 1',
    'fi',
    '',
    'INPUT="${1:?Usage: render-pdf.sh <input.mmd> [output.pdf]}"',
    'OUTPUT="${2:-${INPUT%.mmd}.pdf}"',
    'SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"',
    'CSS_FILE="${SCRIPT_DIR}/../assets/mermaid-pdf.css"',
    'LOG_FILE="$(mktemp /tmp/mmdc-XXXXXX.log)"',
    '',
    'cleanup() { rm -f "$LOG_FILE"; }',
    'trap cleanup EXIT',
    '',
    'if [ ! -f "$INPUT" ]; then',
    '  echo "ERROR: Input file not found: $INPUT"',
    '  exit 1',
    'fi',
    '',
    'if [ ! -f "$CSS_FILE" ]; then',
    '  echo "WARN: CSS file not found at $CSS_FILE -- rendering without custom styles."',
    '  CSS_FLAG=""',
    'else',
    '  CSS_FLAG="--cssFile $CSS_FILE"',
    'fi',
    '',
    'echo "Rendering $INPUT -> $OUTPUT ..."',
    '',
    '# shellcheck disable=SC2086',
    'npx -y @mermaid-js/mermaid-cli mmdc \\',
    '  -i "$INPUT" \\',
    '  -o "$OUTPUT" \\',
    '  $CSS_FLAG \\',
    '  --pdfFit 2>&1 | tee "$LOG_FILE"',
    '',
    'ERROR_PATTERNS="No diagram detected|Syntax error in text|Parse error|UnknownDiagramError"',
    '',
    'if grep -qiE "$ERROR_PATTERNS" "$LOG_FILE"; then',
    '  echo ""',
    '  echo "ERROR: Mermaid could not parse the diagram. Check syntax in $INPUT."',
    '  echo "Common fixes:"',
    '  echo "  - Ensure the file starts with a valid type (graph, flowchart, sequenceDiagram)."',
    '  echo "  - Remove BOM characters or trailing whitespace."',
    '  echo "  - Wrap labels with special characters in double quotes."',
    '  exit 1',
    'fi',
    '',
    'if [ ! -f "$OUTPUT" ]; then',
    '  echo "ERROR: PDF was not generated. Check mmdc output above."',
    '  exit 1',
    'fi',
    '',
    '# ── Output content validation ────────────────────────────────────────────',
    'FILESIZE=$(wc -c < "$OUTPUT" | tr -d " ")',
    'if [ "$FILESIZE" -lt 1024 ]; then',
    '  echo "WARN: Output file is suspiciously small (${FILESIZE} bytes). Verify the diagram rendered correctly."',
    'fi',
    '',
    'ERROR_PATTERNS="No diagram detected|Syntax error in text|Parse error|UnknownDiagramError"',
    '',
    'case "$OUTPUT" in',
    '  *.svg)',
    '    if grep -qiE "$ERROR_PATTERNS" "$OUTPUT" 2>/dev/null; then',
    '      echo "ERROR: Output SVG contains error markers. The diagram was not rendered correctly."',
    '      echo "Check the Mermaid syntax in $INPUT."',
    '      rm -f "$OUTPUT"',
    '      exit 1',
    '    fi',
    '    ;;',
    '  *.pdf)',
    '    if command -v pdftotext &>/dev/null; then',
    '      PDF_TEXT=$(pdftotext "$OUTPUT" - 2>/dev/null || true)',
    '      if echo "$PDF_TEXT" | grep -qiE "$ERROR_PATTERNS"; then',
    '        echo "ERROR: Output PDF contains error text. The diagram was not rendered correctly."',
    '        echo "Check the Mermaid syntax in $INPUT."',
    '        rm -f "$OUTPUT"',
    '        exit 1',
    '      fi',
    '    fi',
    '    ;;',
    'esac',
    '',
    'echo "PDF generated successfully: $OUTPUT"',
    '',
  ].join('\n');
}

function mermaidPdfCss(): string {
  return `/*
 * Custom CSS for mermaid-cli PDF rendering.
 * Prevents diagram truncation and ensures full visibility in PDF output.
 */

/* Remove max-width constraint that causes truncation in PDF */
svg {
  max-width: none !important;
  width: 100% !important;
  height: auto !important;
}

/* Ensure the container does not clip overflow */
.mermaid {
  overflow: visible !important;
  max-width: none !important;
}

/* Rounded corners on nodes for readability */
.node rect,
.node polygon {
  rx: 5;
  ry: 5;
}

/* Ensure text inside nodes is not clipped */
.nodeLabel {
  overflow: visible !important;
  white-space: normal !important;
}

/* Subgraph labels (epic headers) */
.cluster-label {
  font-weight: bold;
}
`;
}

// ─── Diagram Export Skill ──────────────────────────────────────────────────

export function generateDiagramExportSkill(): Record<string, string> {
  return {
    'SKILL.md': diagramExportSkillMd(),
    'scripts/export-diagram.sh': exportDiagramScript(),
  };
}

// ─── Deploy/Validate Skill ─────────────────────────────────────────────────

export function generateDeploySkill(): Record<string, string> {
  return {
    'SKILL.md': deploySkillMd(),
  };
}

// ─── Code Analyzer Skill ───────────────────────────────────────────────────

export function generateCodeAnalyzerSkill(): Record<string, string> {
  return {
    'SKILL.md': codeAnalyzerSkillMd(),
  };
}

export function generateBacklogSyncSkill(): Record<string, string> {
  return {
    'SKILL.md': backlogSyncSkillMd(),
  };
}

function deploySkillMd(): string {
  return `---
name: sf-deploy
description: >-
  Deploy and validate Salesforce metadata using @jterrats/profiler for complete
  profile retrieval and @jterrats/smart-deployment for dependency-aware wave
  deployments. USE FOR: deploy, validate, sf deploy, profile retrieve, profile
  compare, smart deployment, wave deployment, metadata deployment, deploy
  validation, deployment pipeline. Reusable by Developer, DevOps, and Architect
  profiles.
---

# Salesforce Deploy & Validate

## Prerequisites

| Tool | Check | Install |
|------|-------|---------|
| Salesforce CLI | \`sf --version\` | [https://developer.salesforce.com/tools/salesforcecli](https://developer.salesforce.com/tools/salesforcecli) |
| @jterrats/profiler | \`sf plugins inspect @jterrats/profiler\` | \`sf plugins install @jterrats/profiler --force\` |
| @jterrats/smart-deployment | \`sf plugins inspect @jterrats/smart-deployment\` | \`sf plugins install @jterrats/smart-deployment --force\` |

Before proceeding, run this check and install anything missing:

\`\`\`bash
sf plugins inspect @jterrats/profiler 2>/dev/null || sf plugins install @jterrats/profiler --force
sf plugins inspect @jterrats/smart-deployment 2>/dev/null || sf plugins install @jterrats/smart-deployment --force
\`\`\`

> **Note:** The \`--force\` flag is required because these are unsigned community plugins.
> Without it, \`sf plugins install\` will prompt for interactive confirmation that blocks
> non-interactive execution (e.g., when an AI agent runs the command).

---

## Active Job Monitoring (CRITICAL)

When you execute **any** command from this skill (deploy, validate, test run, analyze),
you MUST wait for it to complete. **Never** ask the user to check the result or suggest
reviewing it later. You own the job from start to finish:

- **Synchronous CLI commands:** Wait for the command to return and report the result.
- **Async/long-running deploys:** Poll with \`sf project deploy report\` until status
  is \`Succeeded\` or \`Failed\`.
- **Test runs:** Wait for \`sf apex test run\` to complete. Report pass/fail count,
  coverage, and any errors.
- **GitHub Actions (if triggered):** Use \`gh run watch <run-id>\` or poll
  \`gh run view <run-id>\` until the workflow concludes. Report the final conclusion.

After completion, always report: **status**, **duration**, and **actionable next steps**
if there were failures.

---

## 1. Profile Retrieval (\`sf profiler\`)

### Retrieve Profiles with Full Dependencies

\`sf profiler retrieve\` guarantees complete profile metadata by automatically
resolving all dependencies (Apex Classes, Custom Objects, Custom Permissions,
Tabs, Flows, Layouts, etc.).

\`\`\`bash
# Retrieve all profiles from the target org
sf profiler retrieve -o <alias>

# Retrieve specific profiles (comma-separated)
sf profiler retrieve -o <alias> --name "Admin,Standard User"

# Fast mode: use local project metadata instead of listing from org
sf profiler retrieve -o <alias> --from-project

# Include Field Level Security
sf profiler retrieve -o <alias> --all-fields

# Exclude managed package metadata
sf profiler retrieve -o <alias> --exclude-managed

# Dry run: preview without writing files
sf profiler retrieve -o <alias> --dry-run
\`\`\`

**Best practice:** Always use \`--from-project\` when local metadata exists.
It skips the org describe call and is ~10x faster (~3s vs ~30s).

### Compare Profiles Across Environments

\`\`\`bash
# Compare local profiles vs a single org
sf profiler compare -o <alias>

# Compare across multiple orgs (dev, qa, prod)
sf profiler compare --sources "dev,qa,prod" --name "Admin"

# Export comparison as HTML matrix
sf profiler compare --sources "dev,qa,prod" --output-format html --output-file comparison.html

# JSON output for automation
sf profiler compare -o <alias> --output-format json
\`\`\`

### Generate Profile Documentation

\`\`\`bash
# Generate markdown docs for all profiles
sf profiler docs

# Specific profiles to a custom directory
sf profiler docs --name "Admin,Custom Profile" --output-dir profile-docs
\`\`\`

---

## 2. Smart Deployment (\`sf smart-deployment\`)

### Analyze Dependencies

Always analyze before deploying. This builds the dependency graph and identifies
optimal deployment waves.

\`\`\`bash
# Analyze only (no deploy)
sf smart-deployment analyze
\`\`\`

Review the output: it shows the dependency graph, wave breakdown, and any
circular dependencies that need manual resolution.

### Validate (Dry Run)

\`\`\`bash
# Validate the deployment plan without executing
sf smart-deployment validate --target-org <alias>
\`\`\`

**Never skip validation.** It catches missing dependencies and limit violations
before the actual deploy.

### Deploy in Waves

\`\`\`bash
# Full deploy: analyze + deploy in optimized waves
sf smart-deployment start --target-org <alias>
\`\`\`

### Resume from Failure

If a wave fails mid-deployment:

\`\`\`bash
sf smart-deployment resume --target-org <alias>
\`\`\`

This picks up from the last successful wave without re-deploying completed components.

### Salesforce Limits Awareness

The plugin respects these hard limits per wave:

| Limit | Value |
|-------|-------|
| Max components per wave | 300 |
| Max CMT records per wave | 200 |
| Max files per deployment | ~400-500 |
| Metadata types priority | 78 types in optimized order |

---

## 3. Combined Deployment Pipeline

For a complete deployment, follow this sequence:

### Step 1: Ensure Profiles Are Complete

\`\`\`bash
sf profiler retrieve -o <alias> --from-project --exclude-managed
\`\`\`

### Step 2: Analyze Dependencies

\`\`\`bash
sf smart-deployment analyze
\`\`\`

Review the wave breakdown. If circular dependencies are reported, resolve them
manually before proceeding.

### Step 3: Validate

\`\`\`bash
sf smart-deployment validate --target-org <alias>
\`\`\`

Share the validation result with the user. Only proceed if validation passes.

### Step 4: Deploy

\`\`\`bash
sf smart-deployment start --target-org <alias>
\`\`\`

Wait for all waves to complete. If any wave fails, report which components
failed and attempt \`sf smart-deployment resume --target-org <alias>\` before
escalating.

### Step 5: Post-Deployment Verification

\`\`\`bash
sf apex test run --target-org <alias> --test-level RunLocalTests --code-coverage --result-format human
\`\`\`

Report:
- Wave count and components per wave
- Total pass/fail test count
- Overall code coverage (must be >= 90%)
- Any classes below the 90% threshold

### Step 6: Profile Comparison (Optional)

After deploying to a new environment, verify profile parity:

\`\`\`bash
sf profiler compare --sources "<source-alias>,<target-alias>" --output-format html --output-file post-deploy-comparison.html
\`\`\`

---

## Quick Reference

| Task | Command |
|------|---------|
| Retrieve profiles (fast) | \`sf profiler retrieve -o <alias> --from-project\` |
| Compare envs | \`sf profiler compare --sources "dev,qa,prod"\` |
| Profile docs | \`sf profiler docs --output-dir profile-docs\` |
| Analyze deps | \`sf smart-deployment analyze\` |
| Validate deploy | \`sf smart-deployment validate -o <alias>\` |
| Deploy waves | \`sf smart-deployment start -o <alias>\` |
| Resume failed | \`sf smart-deployment resume -o <alias>\` |
`;
}
