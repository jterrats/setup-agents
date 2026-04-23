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
      '- Pass to sub-agents: data lineage diagram, IR strategy document, DMO mapping,',
      '  segment business purpose, target activation system, and any known manual deployment steps.',
      '',
      '## Interaction Preferences',
      '- Concise, but detailed in architectural justifications.',
      '- Correct mistakes directly without apologizing.',
    ].join('\n');
  },
};
