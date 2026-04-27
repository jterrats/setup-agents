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
    'destructive-deploy.md': workflow(
      version,
      'Deploy Destructive Changes',
      `
## Overview

Destructive changes permanently delete metadata from an org.
Two XML files control when deletion happens relative to the deploy:

| File | Timing | Use when |
|------|--------|----------|
| \`preDestructiveChanges.xml\` | Before the deploy | The component blocks incoming changes (e.g. delete a field before renaming it, remove a validation rule that would reject new data) |
| \`postDestructiveChanges.xml\` | After the deploy | Clean up obsolete components once new code is live (e.g. remove old trigger after new handler is deployed) |

> ⚠️ **Always get explicit sign-off before proceeding.** Present the list of
> components to be deleted and the chosen timing (pre/post) and wait for approval.

## 1. Identify Components to Delete

Ask:
- **What** metadata type and API name must be deleted?
- **Why** is it being deleted? (retired feature, rename, refactor)
- **Timing:** Does anything in the incoming deploy depend on this component
  being gone *first* (pre), or can it be cleaned up *after* (post)?

## 2. Create the Destructive XML File(s)

Create \`manifest/preDestructiveChanges.xml\` and/or
\`manifest/postDestructiveChanges.xml\` as needed:

\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>ObjectName.FieldName</members>
        <name>CustomField</name>
    </types>
    <version>62.0</version>
</Package>
\`\`\`

Common metadata type names: \`CustomField\`, \`CustomObject\`, \`ApexClass\`,
\`ApexTrigger\`, \`Flow\`, \`ValidationRule\`, \`Layout\`, \`PermissionSet\`.

## 3. Validate Before Deleting (Mandatory)

\`\`\`bash
sf project deploy validate \\
  -x manifest/package.xml \\
  --pre-destructive-changes manifest/preDestructiveChanges.xml \\
  --post-destructive-changes manifest/postDestructiveChanges.xml \\
  --target-org <alias> \\
  --test-level RunLocalTests
\`\`\`

Wait for validation to complete. Never proceed to step 4 if validation fails.

## 4. Deploy with Destructive Changes

\`\`\`bash
sf project deploy start \\
  -x manifest/package.xml \\
  --pre-destructive-changes manifest/preDestructiveChanges.xml \\
  --post-destructive-changes manifest/postDestructiveChanges.xml \\
  --target-org <alias> \\
  --purge-on-delete
\`\`\`

> ⚠️ **\`--purge-on-delete\` is for sandboxes only.** Never use it against
> production — deleted records are not sent to the recycle bin and cannot
> be recovered. Omit the flag on production deploys.

## 5. Verify Deletion

After deploy completes, confirm the component no longer exists:

\`\`\`bash
sf org open --target-org <alias>
\`\`\`

Navigate to Setup and verify the deleted metadata is gone.
Report the result before closing the task.
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
