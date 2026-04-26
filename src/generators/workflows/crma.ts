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
