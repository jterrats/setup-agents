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

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { generateTableauWorkflows } from '../generators/workflows/tableau.js';
import {
  consultativeDesign,
  documentationStandards,
  interactionPreferences,
  semanticCommits,
} from './shared-sections.js';
import type { Profile } from './types.js';

export const tableauProfile: Profile = {
  id: 'tableau',
  label: 'Tableau / Analytics Cloud',
  ruleFile: 'tableau-standards.mdc',
  extensions: ['tableau.tableau-viz-extension-sdk', 'dbaeumer.vscode-eslint', 'esbenp.prettier-vscode'],
  detect(cwd: string): boolean {
    return (
      existsSync(join(cwd, 'datasources')) ||
      existsSync(join(cwd, 'workbooks')) ||
      existsSync(join(cwd, 'tableau-project.json'))
    );
  },
  workflows: generateTableauWorkflows,
  ruleContent(): string {
    return [
      '---',
      'description: Tableau / Analytics Cloud Standards',
      'globs:',
      'alwaysApply: true',
      '---',
      '',
      '# Tableau / Analytics Cloud Standards',
      '',
      '> Role: Tableau / Analytics Cloud Developer — Salesforce Professional Services.',
      '',
      ...consultativeDesign('data source strategy and dashboard architecture decisions'),
      '',
      '## Codebase Contextualization',
      '- Scan existing `workbooks/`, `datasources/`, and `extensions/` before creating new ones.',
      '- Check for existing data source connections before adding new ones — reuse published datasources.',
      '- Identify the target Salesforce org alias and Tableau Server URL from environment variables.',
      '',
      '## Data Sources',
      '- Prefer **live connections** to Salesforce CRM Analytics or the Salesforce direct connector.',
      '- Use **extracts** only when live connection performance is unacceptable — document the reason.',
      '- Every published extract must have a **refresh schedule** defined and documented.',
      '- Limit each dashboard to a maximum of **3 data sources** to maintain performance.',
      '',
      '## Calculated Fields',
      '- Use **meaningful names** for all calculated fields — never accept Calculation_1 defaults.',
      '- Group related calculations into **folders** within the data pane.',
      '- Prefer **LOD expressions** (FIXED, INCLUDE, EXCLUDE) over table calculations for better performance.',
      '- Document complex calculations with a comment in the formula or in `/docs/`.',
      '',
      '## Dashboard Design',
      '- Follow **Salesforce Lightning design system colors** when embedding in Salesforce.',
      '- Design **mobile-first layouts** for embedded analytics — verify in the Phone layout view.',
      '- Maximum **3 data sources per dashboard**.',
      '- Use **blank containers** for visual spacing — avoid cramming views.',
      '- Every dashboard must have an empty state (no data scenario) handled gracefully.',
      '',
      '## Performance',
      '- Limit each dashboard view to **fewer than 10 marks** to ensure fast load times.',
      '- Use **set actions** and **parameter actions** instead of dashboard filter actions for performance.',
      '- Pre-aggregate data in the datasource or CRM Analytics recipe before connecting to Tableau.',
      '- Run the **Performance Recorder** before publishing any workbook to production.',
      '',
      '## Row-Level Security',
      '- Use **Salesforce SSO + User Attribute Functions** for row-level security.',
      '- Never bake security into the workbook via hardcoded filters — always use User Attributes.',
      '- Test RLS with a non-admin user before publishing to verify data isolation.',
      '- Document the RLS field name and the User Attribute mapping in `/docs/`.',
      '',
      '## CRM Analytics (Tableau CRM)',
      '- Use **recipes** for data transformation. Prefer recipes over legacy dataflows for new projects.',
      '- Document each dataflow/recipe step in the step description field.',
      '- **Einstein Discovery models:** always include prediction explanation columns in the output dataset.',
      '- Review dataset row count and column count after every recipe run.',
      '',
      '## Embedding',
      '- Use **Tableau Embedding API v3** for all new embedding implementations.',
      '- Always pass `src` and `token` as environment variables — never hardcode in component code.',
      '- Implement **Connected Apps JWT flow** for SSO. Never use username/password authentication.',
      '- Token lifetime must be short-lived (< 10 minutes). Regenerate tokens server-side on demand.',
      '',
      '## Salesforce Integration',
      '- Publish workbooks to **Tableau Cloud** connected to the target Salesforce org.',
      '- Use `tableau-server-client` (Python) or the Tableau REST API for automation and CI/CD.',
      '- Store `TABLEAU_SERVER_URL`, `TABLEAU_TOKEN_NAME`, and `TABLEAU_TOKEN_SECRET` as environment variables.',
      '- Never commit Tableau Personal Access Tokens to version control.',
      '',
      ...documentationStandards(),
      '',
      ...semanticCommits(),
      '',
      ...interactionPreferences('Tableau and analytics architecture'),
      '',
      '## Sub-agent Handover',
      '- Pass: Tableau Server URL (from `TABLEAU_SERVER_URL` env), workbook/datasource path, Salesforce org alias, and row-level security field name.',
    ].join('\n');
  },
};
