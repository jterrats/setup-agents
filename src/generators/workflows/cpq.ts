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

export function generateCpqWorkflows(version: string): Record<string, string> {
  return {
    'product-bundle-setup.md': workflow(
      version,
      'Product Bundle Setup',
      `
## 1. Define Bundle Architecture

Ask:
- **Bundle type:** Static (fixed contents, no user choice), Configurable (rep selects options), or Dynamic (options driven by lookup or rules)?
- **Product hierarchy:** Is this a standalone bundle or a nested bundle (bundle containing bundles)?
- **Required vs. optional features:** Which option groups are mandatory? Which allow substitution?

Check the existing Product2 records in the org — reuse existing base products rather than duplicating.

## 2. Create the Bundle Product

In the Product2 object, create the parent bundle product:
1. Set \`SBQQ__Component__c = false\` (this is the sellable parent, not a component).
2. Set \`SBQQ__ConfigurationType__c\` to Allowed, Required, or Disabled based on whether reps must configure it.
3. Enable \`SBQQ__AssetAmendmentBehavior__c\` if the bundle will be amended in contracts.
4. Add the bundle to the relevant Price Book with its list price.

## 3. Create Option Groups and Options

Navigate to the bundle product's CPQ Configuration:
1. Create **Feature** records (option groups) to organize related options (e.g., Hardware, Software, Support).
2. For each feature, set \`SBQQ__MinOptionCount__c\` and \`SBQQ__MaxOptionCount__c\` to enforce selection rules.
3. Create **Product Option** records linking child products to the bundle:
   - Set \`SBQQ__Quantity__c\` for the default quantity.
   - Set \`SBQQ__Required__c = true\` for mandatory components.
   - Set \`SBQQ__Selected__c = true\` to pre-select defaults.

## 4. Add Option Constraints

If options are mutually exclusive or dependent:
1. Create **Option Constraint** records with \`SBQQ__Type__c = Dependency\` (selecting A requires B) or \`Exclusion\` (selecting A disallows B).
2. Test constraint logic in the CPQ Quote Line Editor by building a test quote — add the bundle and verify the configurator enforces constraints correctly.

## 5. Deploy and Validate

\`\`\`bash
sf project deploy start --source-dir force-app/main/default/objects/Product2 --target-org <alias>
sf project deploy start --source-dir force-app/main/default/objects/SBQQ__ProductOption__c --target-org <alias>
\`\`\`

Create a test quote, add the bundle, configure all option groups, and confirm the line total matches the expected list price before applying any discounts.
`
    ),
    'pricing-rule.md': workflow(
      version,
      'Pricing Rule',
      `
## 1. Identify Pricing Requirement

Ask:
- **Rule type:** Should the rule modify the price of a single line (Price Rule) or summarize values across lines (Summary Variable + Price Rule)?
- **Trigger condition:** When should the rule fire — always, or only when specific product, quote field, or segment conditions are met?
- **Price action:** Override list price, apply a discount percentage, apply a fixed discount amount, or add a markup?
- **Evaluation order:** What is the sequence (0–10) relative to other active pricing rules? Lower numbers fire first.

## 2. Create Lookup Tables (if condition-based)

If pricing depends on a matrix (e.g., volume × segment → discount %):
1. Create a **Price Rule Lookup Object** as a Custom Metadata Type or Custom Object containing the matrix columns.
2. Define lookup columns matching the quote/quote line fields you will use as lookup keys (e.g., Quantity, Customer_Segment__c).
3. Define a result column (e.g., Discount_Pct__c) that the Price Action will read.

## 3. Configure the Price Rule

Navigate to the CPQ Price Rules tab:
1. **Conditions:** Add one or more Price Condition records. Set the tested field (quote line field), operator, and value. Set \`SBQQ__TestedVariable__c\` for Summary Variable-based conditions.
2. **Actions:** Add one Price Action record:
   - \`SBQQ__TargetField__c\`: the quote line field to update (e.g., \`SBQQ__Discount__c\`).
   - \`SBQQ__Type__c\`: Field Reference, Fixed Price, Formula, or Lookup.
   - For Lookup type: reference the Lookup Object and map input/output columns.
3. Set \`SBQQ__EvaluationOrder__c\` and \`SBQQ__Active__c = true\`.

## 4. Test the Rule on a Quote

1. Create a test quote with products that should trigger the rule.
2. Open the Quote Line Editor. Confirm the rule fires and updates the target field as expected.
3. Verify the rule does NOT fire for products or conditions outside its scope.
4. Check the CPQ Pricing Rule Log (enable debug mode in CPQ Settings) if the rule does not behave as expected.

## 5. Deploy

\`\`\`bash
sf project deploy start --source-dir force-app/main/default/objects/SBQQ__PriceRule__c --target-org <alias>
sf project deploy start --source-dir force-app/main/default/objects/SBQQ__PriceAction__c --target-org <alias>
sf project deploy start --source-dir force-app/main/default/objects/SBQQ__PriceCondition__c --target-org <alias>
\`\`\`
`
    ),
    'approval-chain.md': workflow(
      version,
      'Approval Chain',
      `
## 1. Determine Approval Strategy

Ask:
- **Approval engine:** Use CPQ Native Approvals (simpler, quota/discount-threshold driven) or Salesforce Standard Approvals (flexible, supports parallel steps)?
- **Advanced Approvals:** Is the Approvals for Salesforce CPQ managed package installed? If yes, prefer it for complex multi-level, delegated, or parallel approval chains.
- **Thresholds:** What discount or price thresholds trigger each approval level?
- **Delegated approvers:** Can approvers delegate to a backup? How long before auto-escalation?

## 2. Configure Approval Rules (CPQ Native)

Navigate to CPQ Setup → Approval Rules:
1. Create an Approval Rule for each threshold tier (e.g., Discount > 20% → Manager Approval).
2. Set \`SBQQ__ApprovalStep__c\` to define the sequence within a multi-step chain.
3. Assign the approver: a specific user, a queue, or a formula referencing the quote owner's manager.
4. Set \`SBQQ__RejectsBehavior__c\` to Reject Quote or Reject Step Only.

## 3. Configure Approval Steps (Salesforce Standard Approvals)

If using standard Approval Processes:
1. Navigate to Setup → Approval Processes → SBQQ__Quote__c.
2. Create an Approval Process with entry criteria matching the discount threshold.
3. Add Approval Steps in sequence; each step can have a different approver formula.
4. Add approval/rejection email templates using Custom Labels for user-facing text.
5. Configure the initial submission action to lock the quote record.

## 4. Test the Approval Chain

1. Create a test quote that meets the first approval threshold.
2. Submit for approval and confirm the correct approver receives the email notification.
3. Approve the first step and confirm the chain advances to the next step (if multi-level).
4. Test rejection: confirm the quote is unlocked and the owner receives a rejection notification.

## 5. Deploy

\`\`\`bash
sf project deploy start --source-dir force-app/main/default/approvalProcesses/SBQQ__Quote__c.approvalProcess-meta.xml --target-org <alias>
\`\`\`

After deployment, activate the Approval Process in Setup → Approval Processes if it is not already active.
`
    ),
  };
}
