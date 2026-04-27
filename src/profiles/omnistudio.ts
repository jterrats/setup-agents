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
import { generateOmnistudioWorkflows } from '../generators/workflows/omnistudio.js';
import { consultativeDesign, deployment, interactionPreferences, semanticCommits } from './shared-sections.js';
import type { Profile } from './types.js';

export const omnistudioProfile: Profile = {
  id: 'omnistudio',
  label: 'OmniStudio / Vlocity',
  ruleFile: 'omnistudio-standards.mdc',
  extensions: ['salesforce.salesforcedx-vscode'],
  detect(cwd: string): boolean {
    return (
      existsSync(join(cwd, 'force-app/main/default/omniScripts')) ||
      existsSync(join(cwd, 'force-app/main/default/flexCards'))
    );
  },
  workflows: generateOmnistudioWorkflows,
  ruleContent(): string {
    return [
      '---',
      'description: OmniStudio / Vlocity Standards',
      'globs:',
      'alwaysApply: true',
      '---',
      '',
      '# OmniStudio / Vlocity Standards',
      '',
      '> Role: OmniStudio Developer — Salesforce Professional Services.',
      '',
      ...consultativeDesign('OmniStudio architecture and data model decisions'),
      '',
      '## OmniScript Design',
      '- **Type/SubType naming:** Use `<Object>/<Action>` (e.g., `Account/CreateAccount`, `Policy/RenewPolicy`). Type groups related scripts; SubType identifies the specific action.',
      '- **Step types and when to use them:**',
      '  - **Text Block:** display read-only instructions or dynamic field values to the user.',
      '  - **Input:** collect user data (text, picklist, date, lookup, file upload).',
      '  - **Navigation:** control flow — go to a step label, end the script, or open a URL.',
      '  - **Remote Action:** call an Apex `@RemoteAction` method for server-side logic or DML.',
      '  - **REST Action:** call an external HTTP endpoint; configure via named credential.',
      '- **Max 7 visible steps per screen** for usability. Use Conditional Views to hide irrelevant steps dynamically.',
      '- Use **Set Values** elements for intermediate calculations — never repeat a Remote Action call to derive the same value twice.',
      '- Avoid HTTP calls inside a Loop element; batch the input collection first, then make a single call outside the loop.',
      '- For complex UI within a single step, use a **Custom Lightning Web Component** step rather than stacking many Input elements.',
      '',
      '## DataRaptors',
      '- **Extract:** SOQL-based read. Define the SObject, query fields, and field mappings to the output JSON. Use for pre-populating OmniScript steps and FlexCard data sources.',
      '- **Transform:** JSON-to-JSON manipulation. Apply functions (Strings, Math, Date) to reshape data without DML. Use between an Extract and a Load when data normalization is needed.',
      '- **Load:** DML operation (Insert, Update, Upsert, Delete). Specify the upsert key for idempotent loads. Always bulkify: pass a collection and let the Load handle the loop.',
      '- **Turbo Extract:** faster than standard Extract for high-frequency reads; limited to simple single-object queries without complex transforms.',
      '- **Naming convention:** `DR_<Object>_<Action>` (e.g., `DR_Account_Extract`, `DR_Contact_Load`, `DR_Order_Transform`).',
      '- Add a description to every DataRaptor record explaining its purpose and the calling component.',
      '',
      '## Integration Procedures',
      '- **Element types:** DataRaptor Extract/Load, HTTP Action, Set Values, Decision Matrix, Loop — chain these to fulfill one business capability per IP.',
      '- **Design for reusability:** one IP per business capability (e.g., `IP_Account_FetchCreditScore`). OmniScripts, FlexCards, and Apex can all call the same IP.',
      '- **Error handling:** use Conditional logic on each element to detect empty or error responses. Route error paths to a Set Values element that populates a standard `errorMessage` output key. Callers must check this key.',
      '- **Logging:** add a **Debug** element (disabled in production) to log intermediate JSON state during development.',
      '- **Naming convention:** `IP_<Domain>_<Action>` (e.g., `IP_Policy_GetEligibility`, `IP_Order_SubmitToERP`).',
      '',
      '## FlexCards',
      '- **Data sources:** SOQL (simple field display), DataRaptor Extract (multi-object or transformed data), Integration Procedure (external API or assembled data), Apex (edge cases).',
      '- **Child FlexCard composition:** use Child FlexCards for repeating sub-sections (e.g., line items, related contacts) instead of duplicating layout elements.',
      '- **Action types:**',
      '  - **OmniScript Action:** pass the record Id and pre-populated fields as input JSON to the target OmniScript.',
      '  - **Navigation Action:** use standard navigation events to open record pages or custom URLs.',
      '  - **Apex Action:** call an Apex method directly for interactions neither OmniScript nor navigation can handle.',
      '- **Responsive layout:** use the column layout system (1–12 columns) for multi-device rendering. Create **States** for status-driven conditional rendering (e.g., Active, Inactive, Pending).',
      '- **Naming convention:** `FC_<Object>_<Purpose>` (e.g., `FC_Account_Summary`, `FC_Policy_StatusCard`).',
      '',
      '## Decision Matrices & Expression Sets',
      '- **Decision Matrix:** use for multi-condition lookup tables (e.g., pricing tiers, eligibility rules with N input columns). Version matrices — never edit a published version directly.',
      '- **Expression Sets:** use for calculated fields, eligibility scoring, and conditional rule evaluation. Group related expressions into one Expression Set per business domain.',
      '- **Version management:** always create a new version before editing. Test with representative sample inputs using the built-in **Run** panel before activating.',
      '- **Testing:** document expected inputs and outputs in a test matrix. Regression-test after any version update.',
      '',
      '## Performance & Governor Limits',
      '- Avoid SOQL queries in OmniScript Remote Actions inside loops — collect all required Ids first, then query once outside.',
      '- Use **DataRaptor Turbo Extract** for high-frequency read operations (FlexCard page loads, lookup steps) where the query is simple.',
      '- Cache DataRaptor results in **Set Values** elements — pass the cached value to downstream steps instead of re-invoking the DataRaptor.',
      '- For bulk DataRaptor Loads, pass a collection of records as input and let the Load handle the loop internally — do not call Load once per record.',
      '- Monitor governor limit consumption in Apex Remote Actions: enforce bulkification and avoid DML or SOQL inside loops.',
      '',
      '## Version Control with OmniStudio Export',
      '- Use the OmniStudio **Export / Import JSON** mechanism for source control — this is the only reliable way to capture the full component definition.',
      '- Store exported JSON files in the standard paths:',
      '  - OmniScripts: `force-app/main/default/omniScripts/`',
      '  - FlexCards: `force-app/main/default/flexCards/`',
      '  - DataRaptors: `force-app/main/default/dataRaptors/`',
      '  - Integration Procedures: `force-app/main/default/integrationProcedures/`',
      '- Never rely solely on UI deployment (drag-and-drop activation). Export → commit → deploy via JSON import to all orgs.',
      '- Use the `sf` CLI with OmniStudio metadata support (Industries CPQ package) where available for CI/CD pipelines.',
      '',
      '## Vlocity/Industries Namespace',
      '- For Vlocity-based projects (Industries CPQ managed package), prefix custom Apex classes and LWC with the project-level convention (e.g., `JT_` or client-specific prefix) — never modify managed package components.',
      '- Test all customizations (Remote Actions, LWC steps, Apex callouts) against each managed package upgrade in a sandbox before promoting to production.',
      '- Use the **Vlocity Build Tool** (`vlocity`) or OmniStudio CLI for automated deployment of Vlocity metadata in CI/CD.',
      '- Custom fields added to OmniStudio objects (OmniProcess, Element) must be tracked in the metadata package to survive org refreshes.',
      '',
      ...deployment(),
      '',
      ...semanticCommits(),
      '',
      ...interactionPreferences('OmniStudio configuration'),
    ].join('\n');
  },
};
