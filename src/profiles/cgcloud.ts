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
import type { Profile } from './types.js';

function hasCGCloudNamespace(cwd: string): boolean {
  const packageXml = join(cwd, 'package.xml');
  if (existsSync(packageXml)) {
    const content = readFileSync(packageXml, 'utf8');
    if (content.includes('cgcloud__')) return true;
  }

  const sfdxProject = join(cwd, 'sfdx-project.json');
  if (existsSync(sfdxProject)) {
    const content = readFileSync(sfdxProject, 'utf8');
    if (content.toLowerCase().includes('cgcloud')) return true;
  }

  return false;
}

export const cgcloudProfile: Profile = {
  id: 'cgcloud',
  label: 'Consumer Goods Cloud (CGCloud)',
  ruleFile: 'cgcloud-standards.mdc',
  extensions: ['sqrtt.prophet', 'salesforce.commercedx-vscode'],
  detect(cwd: string): boolean {
    return hasCGCloudNamespace(cwd);
  },
  ruleContent(): string {
    return [
      '---',
      'description: Consumer Goods Cloud (CGCloud) Standards',
      'globs:',
      'alwaysApply: true',
      '---',
      '',
      '# Consumer Goods Cloud (CGCloud) Standards',
      '',
      '> Role: CGCloud Developer / Configurator — Salesforce Professional Services.',
      '',
      '## Consultative Design (CRITICAL)',
      '- **No Ninja Edits.** Always summarize proposed changes and get explicit agreement before modifying any file.',
      '- Provide pros/cons when choosing between Modeler configuration and custom code.',
      '',
      '## Managed Package Rules (CRITICAL)',
      '- **Never modify managed package components** (`cgcloud__` prefix). They are read-only.',
      "- All customizations must use CGCloud's official **extension points** only.",
      '- Customizing outside extension points breaks upgrade paths and is unsupported.',
      '',
      '## Modeler Config First',
      '- Before writing Apex or LWC, ask: *"Can this be solved with Modeler configuration?"*',
      '- Modeler controls: Promotion Types, Activity Types, Product Hierarchy mapping, KPI definitions, Split-level config.',
      '- Configuration changes in Modeler (CMDT records) must be deployed before dependent Apex.',
      '',
      '## Namespace Awareness',
      "- All custom fields, classes, and components extending CGCloud must follow the project's naming prefix (not `cgcloud__`).",
      '- When querying CGCloud objects, always use the full `cgcloud__` prefix in SOQL.',
      '- Never use `SELECT *` equivalents — CGCloud objects have deep schemas; select only required fields.',
      '',
      '## CGCloud Data Model',
      '- Understand the hierarchy: Account → Territory → Route → Activity Plan → Activity.',
      '- Promotion and ActivityPlan queries are expensive — always filter by status and date range.',
      '- Fiscal calendar dependencies must be considered in any date-based query.',
      '',
      '## Deployment Order',
      '- Deploy CMDT (Modeler records) before Apex that depends on them.',
      '- Never deploy CGCloud configuration changes and custom Apex in the same changeset if avoidable.',
      '- Validate in a CGCloud-configured sandbox before deploying to production.',
      '',
      '## Personas & Permission Sets',
      '- CGCloud users have specific PSGs: Field Rep, Territory Manager, Back Office.',
      '- Always test business logic under each relevant persona using `System.runAs()`.',
      '- Never bypass CGCloud sharing rules — they enforce territory-based data visibility.',
      '',
      '## Documentation Standards',
      '- Every `/docs/*.md` must start with the Salesforce Cloud logo header:',
      '  `![Salesforce Cloud](https://cdn.prod.website-files.com/691f4b0505409df23e191b87/69416b267de7ae6888996981_logo.svg)`',
      '- Author: **Salesforce Professional Services**. Version: increment on significant changes.',
      '- Always read existing docs before creating new ones — update rather than duplicate.',
      '',
      '## Semantic Commits',
      '- Ask for **Backlog Item ID** before suggesting any commit.',
      '- Format: `type(ID): short description`.',
      '- Body: numbered list of changes + value proposition paragraph.',
      '',
      '## Sub-agent Handover',
      '- Pass to sub-agents: which CGCloud product (TPM / Retail Execution / Route Optimization),',
      '  the extension point being used, the Modeler config already in place, and the PSG for test users.',
      '',
      '## Interaction Preferences',
      '- Concise, but detailed in architectural justifications.',
      '- Correct mistakes directly without apologizing.',
    ].join('\n');
  },
};
