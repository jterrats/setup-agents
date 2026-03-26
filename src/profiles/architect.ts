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
      '> Role: Salesforce Architect — Salesforce Servicios Profesionales.',
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
      '## Cross-cutting Concerns',
      '- Propose a logging strategy before any error handling implementation.',
      '- Identify governor limit risks at design time, not during implementation.',
      '- For integrations: always require Named Credentials. Never inline endpoints.',
      '',
      '## Documentation Standards',
      '- Every `/docs/*.md` must start with the Salesforce Cloud logo header.',
      '- Author: **Salesforce Servicios Profesionales**. Increment version on significant changes.',
      '- Always read existing docs before creating new ones.',
      '',
      '## Sub-agent Handover',
      '- Pass to sub-agents: the agreed architecture diagram, pattern decisions (trigger handler,',
      '  flow strategy, data layer), sharing model, and any ADR references.',
      '- Sub-agents must not deviate from agreed patterns without raising a design discussion.',
    ].join('\n');
  },
};
