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

export function generateDeveloperWorkflows(version: string): Record<string, string> {
  return {
    'create-apex-class.md': workflow(
      version,
      'Create Apex Class',
      `
## 1. Gather Requirements

Ask:
- Class name (PascalCase, infer prefix from project)
- Purpose (service, handler, utility, REST, batch, etc.)
- Sharing model (\`with sharing\` default; \`without sharing\` for REST)

Read \`sfdx-project.json\` to confirm the API version.

## 2. Generate Class

Create the Apex class following project naming conventions.
Check for an existing exception class; if none exists, propose one first.

Scan for existing patterns in \`force-app/main/default/classes/\` before generating.

## 3. Create Test Class

Generate \`<ClassName>_Test.cls\` with:
- One Assert per test method (modern \`Assert\` class)
- \`@TestSetup\` for shared data
- \`System.runAs()\` with PSG-based test users where relevant
- Target 90% coverage

## 4. Deploy

\`\`\`bash
sf project deploy start --source-dir force-app/main/default/classes/<ClassName>.cls --target-org <alias>
sf project deploy start --source-dir force-app/main/default/classes/<ClassName>_Test.cls --target-org <alias>
\`\`\`
`
    ),
    'create-lwc.md': workflow(
      version,
      'Create Lightning Web Component',
      `
## 1. Gather Requirements

Ask:
- Component name (camelCase for API, kebab-case for directory)
- Purpose and data it needs to display
- Whether it needs a controller Apex class

## 2. Generate Component Files

Create:
- \`<name>.html\` — SLDS-based template using Styling Hooks
- \`<name>.js\` — LWC controller using LDS 2 / wire adapters
- \`<name>.css\` — only if custom styling is truly needed
- \`<name>.js-meta.xml\` — metadata with appropriate targets

## 3. Generate Apex Controller (if needed)

Follow Apex rules: one Assert per test, JT_DynamicQueries or DataSelector.

## 4. Deploy

\`\`\`bash
sf project deploy start --source-dir force-app/main/default/lwc/<name> --target-org <alias>
\`\`\`
`
    ),
    'create-trigger.md': workflow(
      version,
      'Create Apex Trigger + Handler',
      `
## 1. Confirm Object

Ask which SObject needs the trigger. Check \`force-app/main/default/triggers/\`
to verify no trigger already exists for that object (one trigger per object rule).

## 2. Generate Trigger (Logic-free)

\`\`\`apex
trigger <ObjectName>Trigger on <ObjectName> (before insert, before update, after insert, after update) {
    new <ObjectName>TriggerHandler().run();
}
\`\`\`

## 3. Generate Handler

Create \`<ObjectName>TriggerHandler.cls\` following the Kevin O'Hara pattern:
- Extend \`TriggerHandler\`
- Override only the needed context methods (beforeInsert, afterUpdate, etc.)
- Delegate immediately to service/selector classes — zero business logic inline

## 4. Deploy

\`\`\`bash
sf project deploy start --source-dir force-app/main/default/triggers/<ObjectName>Trigger.trigger --target-org <alias>
sf project deploy start --source-dir force-app/main/default/classes/<ObjectName>TriggerHandler.cls --target-org <alias>
\`\`\`
`
    ),
  };
}
