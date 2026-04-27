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

export function generateOmnistudioWorkflows(version: string): Record<string, string> {
  return {
    'create-omniscript.md': workflow(
      version,
      'Create OmniScript',
      `
## 1. Gather Requirements

Ask:
- **Type / SubType:** Use \`<Object>/<Action>\` convention (e.g., \`Account/CreateAccount\`, \`Opportunity/RenewContract\`).
- **Entry point:** Is this launched from a FlexCard action, a quick action, a custom LWC, or a standalone app?
- **Data sources:** Which SObjects or Integration Procedures provide data to pre-populate steps?
- **Remote Actions:** Does any step require an Apex Remote Action or REST callout?

Check \`force-app/main/default/omniScripts/\` for an existing OmniScript with the same Type/SubType before creating a new one.

## 2. Design the Step Structure

- Keep visible steps to **7 or fewer** per screen for usability.
- Use **Set Values** elements to compute intermediate values — never rely on repeated Remote Actions for the same data.
- Order step types: Input → Validation → Remote Action / REST → Set Values → Navigation / Summary.
- For complex UI in a single step, use a **Custom Lightning Web Component** step instead of stacking many Input elements.
- Add **Conditional Views** to show/hide steps based on prior answers rather than duplicating step logic.

## 3. Configure Data Integration

- **Remote Action:** Apex class must be annotated with \`@RemoteAction\` and \`global\` scope. Pass input as JSON; return structured JSON.
- **REST Action:** Configure the HTTP method, endpoint, request/response mapping. Use named credentials for endpoint URLs — never hardcode.
- **DataRaptor Extract step:** Specify the DataRaptor name, input parameters (record Id), and map output fields to OmniScript elements.

## 4. Activate and Test

\`\`\`bash
# Export OmniScript JSON for source control after finalizing in the org
# Navigate: OmniStudio → OmniScripts → [Type/SubType] → Export
# Save exported JSON to: force-app/main/default/omniScripts/<Type>_<SubType>.json
\`\`\`

- Test each step individually using the **Preview** panel in OmniStudio Designer.
- Verify conditional logic by walking all branches with representative test data.
- Export the final version and commit the JSON to source control.
`
    ),
    'build-integration-procedure.md': workflow(
      version,
      'Build Integration Procedure',
      `
## 1. Define Scope and Naming

Ask:
- **Business capability:** One Integration Procedure per capability (e.g., \`IP_Account_FetchCreditScore\`, \`IP_Order_SubmitToERP\`).
- **Callers:** Which OmniScripts, FlexCards, or Apex classes will invoke this IP?
- **Input / output schema:** Define the expected JSON input keys and the response structure before building.

Naming convention: \`IP_<Domain>_<Action>\` (e.g., \`IP_Policy_GetEligibility\`).

## 2. Design the Element Chain

Build the element sequence in OmniStudio Integration Procedure Designer:

1. **DataRaptor Extract** — retrieve SObject data needed for the procedure.
2. **HTTP Action** (if external API) — configure endpoint, headers, request/response mapping.
3. **Set Values** — normalize data, compute derived fields, or build the output JSON.
4. **Decision Matrix** (optional) — branch logic based on eligibility or scoring rules.
5. **DataRaptor Load** (if DML) — persist results to Salesforce records.

- Use **Loop** elements for collections — never replicate sequential elements for each item.
- Add a **Debug** element (disabled in production) to log intermediate state during development.

## 3. Error Handling

- Use **Conditional logic** on each element to check for empty or error responses.
- Route error paths to a **Set Values** element that populates a standard \`errorMessage\` output key.
- Callers (OmniScripts, Apex) should check for \`errorMessage\` in the response and surface it via toast or screen element.

## 4. Activate and Export

\`\`\`bash
# After activating in the org, export the IP JSON:
# Navigate: OmniStudio → Integration Procedures → [IP Name] → Export
# Save to: force-app/main/default/integrationProcedures/<IPName>.json
\`\`\`

- Test with the built-in **Run** panel using representative input payloads.
- Verify the output JSON structure matches what callers expect before activating.
`
    ),
    'design-flexcard.md': workflow(
      version,
      'Design FlexCard',
      `
## 1. Gather Requirements

Ask:
- **Object:** What SObject or data source does this FlexCard display (e.g., Account, Custom Object, Integration Procedure result)?
- **Context:** Where is it embedded — Lightning Record Page, App Page, Community, or Experience Cloud?
- **Actions:** What user actions are needed (launch OmniScript, navigate to record, invoke Apex, custom LWC action)?
- **States:** Should the card display differently based on record field values (e.g., status-based states)?

Naming convention: \`FC_<Object>_<Purpose>\` (e.g., \`FC_Account_Summary\`, \`FC_Policy_StatusCard\`).

## 2. Configure the Data Source

Choose the appropriate data source in FlexCard Designer:

- **SOQL:** For simple field display from a single SObject. Use for read-only, low-complexity cards.
- **DataRaptor Extract:** For multi-object data or field transformations before display.
- **Integration Procedure:** For data that requires external API calls or complex assembly logic.
- **Apex:** For cases where DataRaptor or IP cannot express the required logic.

Set the **Object Id** input parameter from the Lightning Record Page context variable (\`{recordId}\`).

## 3. Build the Layout

- Use the **column layout** system (1–12 columns) for responsive rendering.
- Create **States** for conditional rendering: one state per significant status variant (e.g., Active, Inactive, Pending).
- Use **Child FlexCards** for repeating sub-sections (e.g., line items, related contacts) rather than duplicating elements.
- Apply **SLDS utility classes** for spacing and typography — avoid inline styles.

## 4. Configure Actions and Activate

- **OmniScript Action:** Pass the record Id and any pre-populated field values as input JSON.
- **Navigation Action:** Use standard navigation events to open record pages or custom URLs.
- **Custom LWC Action:** Wire a custom component for interactions FlexCard natively cannot handle.

\`\`\`bash
# Export FlexCard JSON after finalizing:
# Navigate: OmniStudio → FlexCards → [Card Name] → Export
# Save to: force-app/main/default/flexCards/<CardName>.json
\`\`\`

- Activate the FlexCard, then add it to the target Lightning Page via App Builder.
- Test on both desktop and mobile form factors to verify responsive layout.
`
    ),
  };
}
