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

export function generateDevopsWorkflows(version: string): Record<string, string> {
  return {
    'release.md': workflow(
      version,
      'Create Release',
      `
## 1. Gather Release Scope

Ask:
- Target environment (sandbox / staging / production)
- Version number (semantic versioning: MAJOR.MINOR.PATCH)

Check merged branches since last release:

\`\`\`bash
git log --oneline <last-tag>..HEAD --merges
\`\`\`

## 2. Build Changelog

Extract commit messages grouped by type (feat, fix, chore):

\`\`\`bash
git log --oneline <last-tag>..HEAD
\`\`\`

Create or update \`CHANGELOG.md\` with the new version section.

## 3. Bump Version

Update \`sfdx-project.json\` → \`sourceApiVersion\` if needed, and version in \`package.json\`.

\`\`\`bash
npm version <major|minor|patch> --no-git-tag-version
\`\`\`

## 4. Validate and Tag

\`\`\`bash
sf project deploy validate -d force-app --target-org <staging-alias> --test-level RunLocalTests
\`\`\`

**IMPORTANT — Active Monitoring:** Wait for validation to complete before tagging.
Poll with \`sf project deploy report\` if needed. Only tag after successful validation.

\`\`\`bash
git tag -a v<version> -m "Release v<version>"
git push origin v<version>
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
Report the result to the developer/configurator before closing the task.
`
    ),
    'create-scratch-org.md': workflow(
      version,
      'Create and Setup Scratch Org',
      `
## 1. Confirm Definition File

Read \`config/project-scratch-def.json\` and confirm settings with the developer.

## 2. Create Scratch Org

\`\`\`bash
sf org create scratch --definition-file config/project-scratch-def.json --alias <alias> --duration-days 7
\`\`\`

## 3. Deploy Source

\`\`\`bash
sf project deploy start -d force-app --target-org <alias>
\`\`\`

**Active Monitoring:** Wait for the deployment to complete and report the result
before moving to the next step.

## 4. Assign Permission Sets

\`\`\`bash
sf org assign permset --name <PermSetName> --target-org <alias>
\`\`\`

## 5. Load Sample Data (if applicable)

\`\`\`bash
sf data import tree --plan data/sample-data-plan.json --target-org <alias>
\`\`\`

Report the scratch org URL:

\`\`\`bash
sf org open --target-org <alias>
\`\`\`
`
    ),
  };
}
