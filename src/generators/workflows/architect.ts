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

import { workflow } from '../workflow-generator.js';

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
