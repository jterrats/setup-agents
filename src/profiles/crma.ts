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

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateCrmaWorkflows } from '../generators/workflows/crma.js';
import type { Profile } from './types.js';
import { documentationStandards, interactionPreferences, semanticCommits } from './shared-sections.js';

const CRMA_METADATA_TYPES = [
  'WaveApplication',
  'WaveDashboard',
  'WaveDataflow',
  'WaveRecipe',
  'WaveDataset',
  'WaveLens',
];

function hasCRMAMetadata(cwd: string): boolean {
  const packageXml = join(cwd, 'package.xml');
  if (existsSync(packageXml)) {
    const content = readFileSync(packageXml, 'utf8');
    if (CRMA_METADATA_TYPES.some((t) => content.includes(t))) return true;
  }
  return false;
}

export const crmaProfile: Profile = {
  id: 'crma',
  label: 'CRM Analytics Engineer (CRMA)',
  ruleFile: 'analytics-standards.mdc',
  extensions: [
    'salesforce.analyticsdx-vscode',
    'salesforce.analyticsdx-vscode-core',
    'salesforce.analyticsdx-vscode-templates',
  ],
  detect(cwd: string): boolean {
    return hasCRMAMetadata(cwd);
  },
  workflows: generateCrmaWorkflows,
  ruleContent(): string {
    return [
      '---',
      'description: CRM Analytics (CRMA / Tableau CRM) Standards',
      'globs:',
      'alwaysApply: true',
      '---',
      '',
      '# CRM Analytics Standards (CRMA)',
      '',
      '> Role: Analytics Engineer — Salesforce Professional Services.',
      '> Inherits base rules from: salesforce-standards.mdc',
      '',
      '## Codebase Contextualization',
      '- **Always scan existing recipes, dataflows, dashboards, and SAQL queries** before creating new ones.',
      '- Reuse existing dataset schemas, security predicates, and dashboard patterns.',
      '',
      '## Consultative Design (CRITICAL)',
      '- **No Ninja Edits.** Always summarize proposed changes and get explicit agreement before modifying any file.',
      '- Discuss data architecture (lineage, security predicates) before building dashboards or recipes.',
      '',
      '## Design Before Build',
      '- Before creating any dashboard or recipe, produce a data lineage diagram (Mermaid).',
      '- Document dataset dependencies: which dataflows/recipes produce each dataset.',
      '- Agree on the data model and field naming before building any lens or dashboard.',
      '',
      '## Data Architecture',
      '- **Recipe vs Dataflow:** Use Recipes (Data Prep) for new implementations. Dataflows are legacy.',
      '- Recipes run on a schedule — design with incremental loads in mind, not full refreshes.',
      '- Never load data that is not consumed by at least one dashboard or Calculated Insight.',
      '- Dataset names: **PascalCase**, descriptive, include the source system prefix (e.g., `SF_Opportunities`).',
      '',
      '## SAQL',
      '- Write SAQL queries with explicit `group by` and `order by` to avoid non-deterministic results.',
      '- Avoid `foreach` on large datasets — prefer `group` with aggregations.',
      '- Always test SAQL in the lens editor before embedding in a dashboard.',
      '- Filter early in the query pipeline — never load all records and filter at render time.',
      '',
      '## Row-Level Security',
      '- Every dataset that contains sensitive data **must** have a Security Predicate defined.',
      '- Test security predicates under each user persona before deploying.',
      '- Document the predicate logic in `/docs/analytics/security-predicates.md`.',
      '',
      '## Dashboard Design',
      '- Follow SLDS color guidelines for chart palettes — no custom hex colors without UX approval.',
      '- Every dashboard must have a documented "primary question" it answers.',
      '- Limit dashboard widgets to 12 per page — split into multiple pages if needed.',
      '- Always test dashboards on mobile viewport before release.',
      '',
      '## Deployment',
      '- Analytics metadata deployment order: Datasets → Dataflows/Recipes → Lenses → Dashboards → Apps.',
      '- Always validate recipe runs in sandbox before promoting to production.',
      '- Document manual post-deployment steps (schedule recipe runs, app sharing) in the release note.',
      '- Include `WaveApplication`, `WaveDashboard`, `WaveDataflow`, `WaveRecipe` in `package.xml`.',
      '',
      '## Testing',
      '- Validate dataset row counts before and after recipe runs.',
      '- Test each dashboard filter combination that appears in acceptance criteria.',
      '- Verify security predicates return correct data for at least 3 distinct user profiles.',
      '',
      '## Dashboard Embedding',
      '- Embed analytics dashboards in Lightning pages using the **CRM Analytics Dashboard** component.',
      '- When embedding in a record page: pass the record ID as a filter to scope the dashboard to the current record.',
      '- For custom LWC containers: use the `wave:waveDashboard` base component with `openLinksInNewWindow` for better UX.',
      '- Test embedded dashboards at all three responsive breakpoints (320px, 768px, 1280px).',
      '',
      '## Einstein Discovery Integration',
      '- Use Einstein Discovery for predictive models that surface insights inside Salesforce records.',
      '- Story creation: define the outcome variable, candidate predictors, and the dataset. Review the generated story.',
      '- Deploy models to Flows via **Einstein Prediction Builder** for real-time scoring on record save.',
      '- Document model performance metrics (R², RMSE) and retrain cadence in `/docs/analytics/models.md`.',
      '',
      ...documentationStandards(),
      '',
      ...semanticCommits(),
      '',
      '## Sub-agent Handover',
      '- Pass to sub-agents: dataset lineage diagram, security predicate definitions,',
      '  recipe schedule, dashboard primary question, and the user personas being tested.',
      '',
      ...interactionPreferences(),
    ].join('\n');
  },
};
