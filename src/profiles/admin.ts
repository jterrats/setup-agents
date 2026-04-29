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

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { generateAdminWorkflows } from '../generators/workflows/admin.js';
import {
  consultativeDesign,
  deployment,
  documentationStandards,
  interactionPreferences,
  salesforceReferences,
  semanticCommits,
} from './shared-sections.js';
import type { Profile } from './types.js';

export const adminProfile: Profile = {
  id: 'admin',
  label: 'Admin / Configurator',
  ruleFile: 'admin-standards.mdc',
  extensions: [
    'salesforce.salesforcedx-vscode',
    'salesforce.salesforcedx-vscode-lwc',
    'VignaeshRama.sfdx-package-xml-generator',
    'nicolas.vscode-sfcc-metadata',
    'moody.sfdx-hardis',
  ],
  detect(cwd: string): boolean {
    return existsSync(join(cwd, 'force-app'));
  },
  workflows: generateAdminWorkflows,
  ruleContent(): string {
    return [
      '---',
      'description: Salesforce Admin / Configurator Standards',
      'globs:',
      'alwaysApply: true',
      '---',
      '',
      '# Salesforce Admin / Configurator Standards',
      '',
      '> Role: Salesforce Admin / Configurator — Salesforce Professional Services.',
      '',
      ...consultativeDesign('configuration and automation decisions'),
      '',
      '## Flow Best Practices',
      '- **No Mega-Flows.** Break complex automations into modular **Sub-flows** that can be tested and reused independently.',
      '- **One Record-Triggered Flow per object/context** (Before Save / After Save). Consolidate logic into a single entry point per timing.',
      '- Use **Before Save flows** for field updates on the triggering record (no DML needed, faster execution).',
      '- Use **After Save flows** only when you need to create/update related records or fire platform events.',
      '- **Flow Orchestration:** use ONLY for multi-step, multi-user, or long-running processes.',
      '- Name flows descriptively: `<Object>_<Context>_<Purpose>` (e.g., `Account_BeforeSave_PopulateRegion`).',
      '- Add **fault paths** to every action element. Route faults to a common error-handling sub-flow.',
      '- Document flow purpose in the Description field. Add element descriptions for non-obvious logic.',
      '- Use **Custom Labels** for all user-facing text in flow screens and error messages.',
      '',
      '## Validation Rules',
      '- Always include a **bypass mechanism** via Custom Permission: `$Permission.Bypass_Validation_Rules`.',
      '- Pattern: `AND(NOT($Permission.Bypass_Validation_Rules), <your condition>)`.',
      '- If `Bypass_Validation_Rules` does not exist, propose creating it before writing the rule.',
      '- Error messages must use **Custom Labels** — never hardcode user-facing text.',
      '- Keep conditions readable: extract complex formulas into helper formula fields when they exceed 3 conditions.',
      '- Document the business rule each validation enforces in the Description field.',
      '',
      '## Permission Sets & Security',
      '- **Permission Sets over Profiles.** Follow the least-privilege principle.',
      '- Group related permissions into **Permission Set Groups** for role-based assignment.',
      '- Name Permission Sets descriptively: `<Feature>_<Access>` (e.g., `CaseManagement_Edit`).',
      '- Never grant `Modify All Data` or `View All Data` in Permission Sets unless absolutely required.',
      '- Use **Field-Level Security** in Permission Sets to control sensitive field access.',
      '- Review and audit Permission Set assignments quarterly.',
      '',
      '## Page Layout Conventions',
      '- Place required fields in the top section for visibility.',
      '- Group related fields into logical sections with clear headers.',
      '- Use **blank spaces** to improve visual readability — avoid cramming fields.',
      '- Keep related lists relevant: remove defaults that users never need on a given layout.',
      '- Assign layouts via **Record Type + Profile** mapping, not standalone assignments.',
      '',
      '## Record Types',
      '- API Names: **PascalCase** in English (e.g., `InternalRequest`, `ExternalPartner`).',
      '- Labels: **Spanish** (matching project convention).',
      '- Always include a Description explaining when each Record Type applies.',
      '- Map Record Types to relevant Page Layouts and business processes (Sales, Support, etc.).',
      '',
      '## Custom Fields',
      '- API Names: **PascalCase** in English (e.g., `RegionCode__c`, `ApprovalStatus__c`).',
      '- Labels: **Spanish**. Descriptions are **mandatory** — explain what the field stores and why.',
      '- Add **Help Text** for fields where the label alone is ambiguous.',
      '- Avoid overly wide picklists (>30 values). If needed, consider a lookup to a Custom Metadata Type.',
      '- New fields must be added to the appropriate Permission Sets — a field nobody can see is useless.',
      '',
      '## Custom Metadata Types',
      '- Use **CMDT** for app configuration that must be deployable (mapping tables, feature flags, thresholds).',
      '- Use **Custom Settings** only for org-level or user-level runtime toggles that change without deployment.',
      '- CMDT API Names: `<Feature>_Config__mdt`. Records: descriptive `DeveloperName`.',
      '- Always seed CMDT records in the deployment package — never rely on manual creation in target orgs.',
      '',
      '## Formula Field Optimization',
      '- Avoid **cross-object references** when the same data can be stored locally via a flow or process.',
      '- Keep formula complexity low: break deeply nested `IF` statements into helper formula fields.',
      '- Watch the **compiled size limit** (5,000 characters). Use CASE instead of nested IFs where possible.',
      '- Prefer **checkbox formulas** for boolean conditions — they are faster in reports and list views.',
      '- Document the business logic in the Description field, especially for formulas referencing multiple objects.',
      '',
      '## Process Automation Decision Tree',
      '- **Use Flow when:** the requirement can be met declaratively — field updates, record creation, screen interactions, scheduled actions, or approval routing.',
      '- **Escalate to Apex when:** the requirement involves complex data transformations, callouts to external APIs, governor limit-sensitive bulk operations, or logic that Flow cannot express cleanly.',
      '- When in doubt, discuss with the development team before choosing Apex. Flows are easier to maintain for admins.',
      '- **Never use Workflow Rules or Process Builder** — these are legacy. Migrate existing ones to Flows.',
      '',
      ...documentationStandards(),
      '',
      ...deployment(),
      '',
      ...semanticCommits(),
      '',
      ...salesforceReferences(),
      '',
      ...interactionPreferences('configuration'),
    ].join('\n');
  },
};
