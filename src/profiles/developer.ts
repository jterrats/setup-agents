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

import { generateDeveloperWorkflows } from '../generators/workflow-generator.js';
import type { Profile } from './types.js';

export const developerProfile: Profile = {
  id: 'developer',
  label: 'Developer',
  ruleFile: 'developer-standards.mdc',
  extensions: [
    'salesforce.salesforcedx-vscode-apex-debugger',
    'salesforce.salesforcedx-vscode-apex-replay-debugger',
    'salesforce.sfdx-code-analyzer-vscode',
    'chuckjonas.apex-pmd',
    'chuckjonas.salesforce-diff',
    'omniphx.sfdx-auto-deployer',
    'hugoom.sfdx-autoheader',
    'vignaeshrama.sfdx-package-xml-generator',
    'financialforce.lana',
  ],
  workflows: generateDeveloperWorkflows,
  ruleContent(): string {
    return [
      '---',
      'description: Salesforce Developer Standards',
      'globs:',
      'alwaysApply: true',
      '---',
      '',
      '# Salesforce Developer Standards',
      '',
      '> Role: Salesforce Developer — Salesforce Professional Services.',
      '',
      '## Consultative Design (CRITICAL)',
      '- **No Ninja Edits.** Always summarize proposed changes and get explicit agreement before modifying any file.',
      '- Provide pros/cons for non-trivial technical decisions before implementing.',
      '',
      '## Code Generation',
      '- Always read `sfdx-project.json` → `sourceApiVersion` before generating any Apex, LWC, or metadata.',
      '- Infer naming patterns from the existing project. `JT_` is a framework prefix — preserve as-is.',
      '- Test classes: `<ClassName>_Test`. Trigger handlers: `<ObjectName>TriggerHandler`.',
      '',
      '## Apex Rules',
      '- Default: `with sharing` on all Apex classes.',
      '- Exception: Apex REST (`@RestResource`) classes → always `without sharing`.',
      '- **No SOQL or DML inside loops.** Collect, then query/DML once outside.',
      "- One trigger per object. Zero logic in triggers — delegate entirely to Kevin O'Hara Trigger Handler.",
      '- Scan for existing custom exception class before writing `try-catch`. If none exists, propose one.',
      '',
      '## Data Layer',
      '- Propose **JT_DynamicQueries** first. Fallback: **DataSelector** (`inherited sharing`).',
      '- If strategy is unclear, ask: *"¿Usamos JT_DynamicQueries o DataSelector?"*.',
      '- Always bulkify: handle 1 to N records.',
      '',
      '## LWC',
      '- Prioritize **SLDS Styling Hooks** over custom CSS.',
      '- Use **LDS 2** and **Lightning Data Service** whenever possible.',
      '- User feedback: Toasts with **Custom Labels**. Never hardcode strings.',
      '- **UX Gate (when generating LWC UI):** verify contrast (4.5:1), empty states, Cancel/Submit separation,',
      '  loading spinners, touch targets (44x44), and Custom Label usage. See `ux-standards.mdc` for full checklist.',
      '',
      '## Testing',
      '- **Exactly one Assert per test method** using the modern `Assert` class.',
      '- Use `@TestSetup` for shared test data.',
      '- Use `System.runAs()` with Permission Set Group-based test users.',
      '- Wrap async Apex in `Test.startTest()` / `Test.stopTest()`.',
      '- Target **90% code coverage**.',
      '',
      '## Async Apex',
      '- No fixed pattern. When async need arises, discuss architecture with the developer.',
      '- Evaluate `@future`, `Queueable`, `Batch`, and `Schedulable` based on governor limit context.',
      '',
      '## Error Handling',
      '- Scan for existing logging framework before writing `try-catch`.',
      '- Never use `eslint-disable` or `@SuppressWarnings` as a first resort.',
      '- Triggers: `addError()` with Custom Labels. LWC: Toast notifications.',
      '',
      '## Flow Awareness',
      '- Avoid Mega-Flows. Recommend Sub-flows for modularity.',
      '- One Record-Triggered Flow per object/context (Before Save / After Save).',
      '- Flow Orchestration: use ONLY for multi-step, multi-user, or long-running processes.',
      '',
      '## Documentation Standards',
      '- Every `/docs/*.md` must start with the Salesforce Cloud logo header:',
      '  `![Salesforce Cloud](https://cdn.prod.website-files.com/691f4b0505409df23e191b87/69416b267de7ae6888996981_logo.svg)`',
      '- Author: **Salesforce Professional Services**. Version: increment on significant changes.',
      '- Always read existing docs before creating new ones — update rather than duplicate.',
      '',
      '## Deployment',
      '- Granular deploy: specific modified files/metadata ONLY.',
      '- **Validate before deploying:** `sf project deploy validate -d force-app`.',
      '- **Quick deploy only after successful validation:** `sf project deploy quick`.',
      '',
      '## Semantic Commits',
      '- Ask for **Backlog Item ID** before suggesting any commit.',
      '- Format: `type(ID): short description`.',
      '- Body: numbered list of changes + value proposition paragraph.',
      '',
      '## Sub-agent Handover',
      '- Pass to sub-agents: API version from `sfdx-project.json`, existing trigger handler pattern,',
      '  data layer strategy (JT_DynamicQueries vs DataSelector), and test user PSG names.',
      '- Sub-agents must follow: one Assert per test, zero logic in triggers.',
      '',
      '## Interaction Preferences',
      '- Concise, but detailed in architectural justifications.',
      '- Correct mistakes directly without apologizing.',
    ].join('\n');
  },
};
