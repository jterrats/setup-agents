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

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateData360Workflows } from '../generators/workflows/data360.js';
import { documentationStandards, interactionPreferences, semanticCommits } from './shared-sections.js';
import type { Profile } from './types.js';

const DATA_CLOUD_METADATA_TYPES = [
  'DataStream',
  'DataModelObject',
  'DataSalesforceObject',
  'DataConnectorS3',
  'DataTransform',
];

function hasDataCloudMetadata(cwd: string): boolean {
  const packageXml = join(cwd, 'package.xml');
  if (existsSync(packageXml)) {
    const content = readFileSync(packageXml, 'utf8');
    if (DATA_CLOUD_METADATA_TYPES.some((t) => content.includes(t))) return true;
  }
  return false;
}

export const data360Profile: Profile = {
  id: 'data360',
  label: 'Data Cloud Architect / Engineer (Data 360)',
  ruleFile: 'data360-standards.mdc',
  extensions: ['redhat.vscode-xml', 'redhat.vscode-yaml', 'humao.rest-client'],
  detect(cwd: string): boolean {
    return hasDataCloudMetadata(cwd);
  },
  workflows: generateData360Workflows,
  ruleContent(): string {
    return [
      '---',
      'description: Salesforce Data Cloud (Data 360) Standards',
      'globs:',
      'alwaysApply: true',
      '---',
      '',
      '# Salesforce Data Cloud Standards (Data 360)',
      '',
      '> Role: Data Cloud Architect / Engineer — Salesforce Professional Services.',
      '> Inherits base rules from: salesforce-standards.mdc',
      '',
      '## Codebase Contextualization',
      '- **Always scan existing Data Streams, DMOs, IR rulesets, and segment definitions** before proposing changes.',
      '- Reuse existing field mappings, reconciliation rules, and activation target patterns.',
      '',
      '## Consultative Design (CRITICAL)',
      '- **No Ninja Edits.** Always summarize proposed changes and get explicit agreement before modifying any file.',
      '- Discuss data lineage and IR strategy before any implementation.',
      '',
      '## Architecture First',
      '- Before any implementation, produce a data lineage diagram showing:',
      '  Source → Data Stream → Data Lake Object → Data Model Object → Segment → Activation.',
      '- Document Identity Resolution strategy before building any Data Stream.',
      '- Agree on the unified individual / account model before creating custom DMOs.',
      '',
      '## Data Streams',
      '- Name convention: `<Source>_<Object>_Stream` (e.g., `SF_Contact_Stream`, `S3_Orders_Stream`).',
      '- Always configure refresh frequency based on SLA — never leave it at default.',
      '- For Salesforce CRM sources, prefer **Salesforce CRM Connector** over Ingestion API when possible.',
      '- Document the field mappings from source to DLO in `/docs/datacloud/stream-mappings.md`.',
      '',
      '## Data Model Objects (DMOs)',
      '- Map all custom DMOs to a standard Data Cloud subject area (Individual, Sales Order, etc.).',
      '- Every DMO must have a documented primary key strategy.',
      '- Avoid creating custom DMOs when a standard one can be extended.',
      '- Field names in DMOs: **snake_case** to align with Data Cloud conventions.',
      '',
      '## Identity Resolution',
      '- Define a written IR strategy before configuring rules: which fields, which priority order.',
      '- Always test IR with a representative sample dataset before enabling in production.',
      '- Document reconciliation rules (most recent, most frequent, source priority) per field.',
      '- IR rulesets must be reviewed by the Architect before activation.',
      '',
      '## Calculated Insights',
      '- Write CI SQL with explicit aliases on all output fields.',
      '- Validate CI output cardinality — unbounded growth breaks segment performance.',
      '- Always specify a refresh schedule aligned with the upstream Data Stream refresh.',
      '- Test CI with at least 3 months of historical data in sandbox before production.',
      '',
      '## Segments & Activation',
      '- Every segment must have a documented business purpose and owner.',
      '- Segment criteria must be reviewed for PII compliance before activation.',
      '- Activation Targets must use Named Credentials — never hardcode endpoints.',
      '- Document estimated segment size and refresh frequency in the segment definition.',
      '',
      '## Deployment Limitations (CRITICAL)',
      '- Data Cloud metadata API support is **partial** — many configurations require manual UI steps.',
      '- Always document manual post-deployment steps in the release note.',
      '- IR rulesets, Activation Targets, and Consent settings typically cannot be deployed via metadata API.',
      '- Validate in a Data Cloud-enabled sandbox before any production change.',
      '',
      '## Privacy & Compliance',
      '- Every Data Stream that ingests PII must be documented in the Data Inventory.',
      '- Apply Data Cloud consent rules for any segment used in marketing activation.',
      '- Never activate segments containing PII to external targets without legal review.',
      '',
      '## Data Cloud Connect',
      '- Use **Data Cloud Connect** to surface DMO fields in CRM formulas, validation rules, and Flow conditions.',
      '- Reference DMO fields using the `DataCloud__` prefix in formula syntax.',
      '- Test Data Cloud Connect fields in both Lightning page layouts and reports to verify data availability.',
      '- Document which DMO fields are exposed via Connect in `/docs/datacloud/connect-fields.md`.',
      '',
      '## Data Actions & Triggers',
      '- Use **Data Actions** to trigger Flows or Platform Events when segment membership changes.',
      '- Define activation targets for each Data Action: Flow, Apex, or external webhook.',
      '- Test Data Actions with a small segment first — verify the trigger fires and the downstream action executes correctly.',
      '- Document Data Actions in `/docs/datacloud/data-actions.md`: action name, trigger condition, target, expected behavior.',
      '',
      ...documentationStandards(),
      '',
      ...semanticCommits(),
      '',
      '## Sub-agent Handover',
      '- Pass to sub-agents: data lineage diagram, IR strategy document, DMO mapping,',
      '  segment business purpose, target activation system, and any known manual deployment steps.',
      '',
      ...interactionPreferences(),
    ].join('\n');
  },
};
