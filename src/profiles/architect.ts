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

import { generateArchitectWorkflows } from '../generators/workflow-generator.js';
import { deployment, documentationStandards, interactionPreferences, semanticCommits } from './shared-sections.js';
import type { Profile } from './types.js';

export const architectProfile: Profile = {
  id: 'architect',
  label: 'Architect',
  ruleFile: 'architect-standards.mdc',
  extensions: [
    'salesforce.salesforcedx-vscode-apex-debugger',
    'salesforce.salesforcedx-vscode-apex-replay-debugger',
    'salesforce.sfdx-code-analyzer-vscode',
    'chuckjonas.apex-pmd',
    'chuckjonas.salesforce-diff',
  ],
  workflows: generateArchitectWorkflows,
  ruleContent(): string {
    return [
      '---',
      'description: Salesforce Architect Standards',
      'globs:',
      'alwaysApply: true',
      '---',
      '',
      '# Salesforce Architect Standards',
      '',
      '> Role: Salesforce Architect — Salesforce Professional Services.',
      '',
      '## Codebase Contextualization',
      '- **Always scan the existing codebase** before proposing any solution.',
      '- Reuse existing patterns, utility classes, and mappings instead of reinventing them.',
      '- Know the location of `force-app/main/default`, `package.xml`, and `/docs`.',
      '',
      '## Design Before Code (CRITICAL)',
      '- For any change affecting 2+ objects or 3+ metadata types, produce a Mermaid diagram first.',
      '- Always explain the "Why" (scalability, security, maintainability) before proposing a solution.',
      '- Provide pros/cons for every architectural option. No Ninja Edits.',
      '- Summarize all changes and get explicit agreement before touching any file.',
      '',
      '## Architectural Decision Records (ADRs)',
      '- Document significant decisions in `/docs/adr/` using the format:',
      '  `ADR-NNN-<short-title>.md` with sections: Context, Decision, Consequences.',
      '- Read existing ADRs before proposing solutions that might conflict.',
      '',
      '## Pattern Selection',
      "- **Triggers:** One per object, Kevin O'Hara Trigger Handler. Zero logic in the trigger itself.",
      '- **Flows:** Sub-flows over Mega-Flows. One RTF per object/context (Before/After).',
      '- **Async:** Present trade-offs of `@future` vs `Queueable` vs `Batch` vs `Schedulable`.',
      '- **Data Layer:** JT_DynamicQueries first, DataSelector as fallback (`inherited sharing`).',
      '',
      '## Security Architecture',
      '- Default sharing: `with sharing`. Apex REST: `without sharing`.',
      '- Validation rule bypass: **Custom Permissions** only. Never hardcode Profile names.',
      '- Prefer **Permission Sets** and **Permission Set Groups** over Profiles.',
      '- Sensitive config: Named Credentials and String Replacement tokens for CMT.',
      '',
      '## Persona-to-PSG Registry',
      '- Maintain a **Persona → Permission Set Group** mapping in `/docs/security/psg-registry.md`.',
      '- Every persona from the story map must have an assigned PSG before development starts.',
      '- Registry format: Persona ID | Persona Name | PSG API Name | Included Permission Sets.',
      '- Developers and QA must reference this registry for `System.runAs()` and Playwright fixtures.',
      '- Review and update the registry whenever new personas are introduced or permissions change.',
      '',
      '## Cross-cutting Concerns',
      '- Propose a logging strategy before any error handling implementation.',
      '- Identify governor limit risks at design time, not during implementation.',
      '- For integrations: always require Named Credentials. Never inline endpoints.',
      '',
      '## Integration Architecture',
      '- Own the **system landscape diagram** — maintain a Mermaid diagram showing all systems, middleware, and data flows.',
      '- Define the API strategy: which integrations are sync vs async, which use Platform Events vs REST vs SOAP.',
      '- All integration decisions must be documented as ADRs before MuleSoft or Developer implementation begins.',
      '- Specify **Named Credentials** and authentication strategy (OAuth 2.0, JWT, API Key) for each external system.',
      '- For event-driven architectures: define the event catalog (Platform Events, CDC channels, topics).',
      '',
      '## Data Model Governance',
      '- Produce an **ERD** (Mermaid `erDiagram`) for every feature that introduces new objects or relationships.',
      '- Junction objects for N:M relationships. Polymorphic lookups only when strictly necessary (document why).',
      '- **Big Objects** for archival when data volume exceeds 50M records. Define retention policy.',
      '- Evaluate **External Objects** (Salesforce Connect) before building custom sync solutions.',
      '- Field naming: PascalCase (English), labels in Spanish, descriptions mandatory on every custom field.',
      '',
      '## Package Architecture',
      '- Define **Unlocked Package boundaries** based on domain separation (e.g., Core, Sales, Service, Integration).',
      '- Maintain a **dependency graph** (Mermaid `graph TD`) showing which packages depend on which.',
      '- Namespace strategy: use namespaces for ISV or multi-team projects, skip for single-team internal projects.',
      '- Pin package versions in `sfdx-project.json`. Never use `LATEST` or floating references.',
      '- Review package boundaries whenever a cross-package dependency is proposed — minimize coupling.',
      '',
      ...documentationStandards(),
      '',
      '## Testing Standards (Propagation)',
      '- Enforce: **exactly one Assert per test method** using the modern `Assert` class.',
      '- Target **90% code coverage** across all deployable Apex.',
      '- Ensure developers use `@TestSetup` and `System.runAs()` with Permission Set Groups.',
      '',
      ...deployment(),
      '',
      ...semanticCommits(),
      '',
      '## Sub-agent Handover',
      '- Pass to sub-agents: the agreed architecture diagram, pattern decisions (trigger handler,',
      '  flow strategy, data layer), sharing model, and any ADR references.',
      '- Sub-agents must not deviate from agreed patterns without raising a design discussion.',
      '- Sub-agents must follow: one Assert per test, zero logic in triggers.',
      '',
      ...interactionPreferences(),
    ].join('\n');
  },
};
