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
