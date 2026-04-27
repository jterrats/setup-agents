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

import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { generateCpqWorkflows } from '../generators/workflows/cpq.js';
import { consultativeDesign, deployment, interactionPreferences, semanticCommits } from './shared-sections.js';
import type { Profile } from './types.js';

function hasSbqqMetadata(dir: string): boolean {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (hasSbqqMetadata(join(dir, entry.name))) return true;
      } else if (entry.isFile() && entry.name.startsWith('SBQQ__') && entry.name.endsWith('.object-meta.xml')) {
        return true;
      }
    }
  } catch {
    // directory not accessible — skip
  }
  return false;
}

export const cpqProfile: Profile = {
  id: 'cpq',
  label: 'CPQ Specialist',
  ruleFile: 'cpq-standards.mdc',
  extensions: ['salesforce.salesforcedx-vscode'],
  detect(cwd: string): boolean {
    if (existsSync(join(cwd, 'force-app/main/default/objects/SBQQ__Quote__c'))) {
      return true;
    }
    const forceApp = join(cwd, 'force-app');
    return hasSbqqMetadata(forceApp);
  },
  workflows: generateCpqWorkflows,
  ruleContent(): string {
    return [
      '---',
      'description: Salesforce CPQ Specialist Standards',
      'globs:',
      'alwaysApply: true',
      '---',
      '',
      '# Salesforce CPQ Specialist Standards',
      '',
      '> Role: Salesforce CPQ Specialist — Salesforce Professional Services.',
      '',
      ...consultativeDesign('CPQ pricing and bundling decisions'),
      '',
      '## Product & Price Book Structure',
      '- **Standard vs. Custom Price Books:** always maintain a Standard Price Book as the canonical list price reference. Create custom Price Books for partner, distributor, or regional pricing — never modify the Standard Price Book list prices to reflect discounted rates.',
      '- **Product Hierarchy:** organize products using Product Family for high-level grouping (e.g., Hardware, Software, Services). Use Product Categories (CPQ) for finer-grained taxonomy used in bundle configuration.',
      '- **List Price vs. Discount Schedules:** list price in the Price Book entry is the ceiling price before any schedule or rule applies. Do not encode discounts into list prices — use Discount Schedules and Price Rules for all price modifications.',
      '- **Multi-Currency Considerations:** enable Advanced Currency Management if exchange rates fluctuate. Dated exchange rates ensure historical quotes do not reprice when rates change. Test all pricing rules in each active currency.',
      '',
      '## Product Bundles & Options',
      '- **Bundle Types:** Static bundles have fixed contents with no rep choice — use for pre-configured SKUs. Configurable bundles allow reps to select from option groups — use for solutions with variation. Dynamic bundles populate options via a Product Rule lookup — use when option availability depends on quote context.',
      '- **Option Constraints — Dependency:** if selecting Product A requires Product B to also be selected, create a Dependency constraint. Dependency constraints enforce logical pairing (e.g., a support plan requires the base product).',
      '- **Option Constraints — Exclusion:** if Product A and Product B cannot coexist in the same bundle, create an Exclusion constraint. Review exclusions whenever new products are added to existing bundles.',
      '- **Min/Max Quantities:** set `SBQQ__MinOptionCount__c` and `SBQQ__MaxOptionCount__c` on Feature records to enforce selection rules. Use `SBQQ__MinQuantity__c` and `SBQQ__MaxQuantity__c` on Product Option records for individual line quantity limits.',
      '- **Default Quantities:** set `SBQQ__Quantity__c` on Product Option records to pre-populate the configurator. Reps should only need to change quantities for non-standard orders.',
      '',
      '## Pricing Rules',
      '- **Condition-Based vs. Summary Variable:** use condition-based rules for single-line field comparisons (e.g., discount % when product family = Software). Use Summary Variables when the condition depends on aggregated data across multiple lines (e.g., total quote value > $50,000).',
      '- **Lookup Tables:** define lookup tables as Custom Metadata Types for values that change infrequently (e.g., tier discount matrix). Use Custom Objects for lookup data that changes at runtime and cannot be deployed via metadata.',
      '- **Price Actions — Types:** Override replaces the target field value entirely. Discount applies a percentage reduction. Markup applies a percentage increase. Use Override only when a flat price must be enforced regardless of list price.',
      "- **Evaluation Order (0–10):** Price Rules fire in ascending evaluation order. Rules that establish a baseline price should have lower order numbers than rules that apply discounts on top of that baseline. Document the order rationale in each rule's Description field.",
      '',
      '## Discount Schedules',
      '- **Slab vs. Range:** Slab discounts apply the rate for the tier the total quantity falls in. Range discounts apply a blended rate across tiers. Use Range for volume-sensitive products; use Slab for simple tiered pricing.',
      "- **Volume Discounts:** create Discount Schedule tiers that reward higher quantities. Validate that the tier breakpoints align with the sales team's standard deal sizes.",
      '- **Contracted Pricing:** use Contract Price records on the Account or Contract to override list price for specific customers. Contracted prices take precedence over standard Discount Schedules when `SBQQ__ContractingMethod__c` is set.',
      '- **Partner Discounts:** use separate custom Price Books per partner tier rather than encoding partner discounts in Discount Schedules. This approach keeps the audit trail clean and simplifies multi-partner orgs.',
      '',
      '## Quote Templates',
      '- **Line Item Column Configuration:** limit visible columns to those the customer needs to see (Description, Quantity, Unit Price, Total). Remove internal fields (Discount %, Cost) from customer-facing templates.',
      '- **Grouping and Sorting:** group line items by Product Family or Bundle to improve readability. Set sort order within groups alphabetically or by Quantity descending.',
      '- **Subtotal Display:** show subtotals per group when the quote has more than two product families. Always show a grand total at the bottom with taxes and fees broken out.',
      '- **Conditional Sections:** use conditional content sections to show or hide legal terms, payment schedules, or regional addenda based on quote field values (e.g., `Billing_Country__c`).',
      '',
      '## Approval Chains',
      '- **CPQ Native vs. Salesforce Approvals:** use CPQ Native Approvals for simple threshold-based chains (discount > X% → manager). Use Salesforce Standard Approval Processes for complex routing, parallel approvals, or recall scenarios.',
      '- **Approval Steps:** define steps in ascending order. Each step should have a clear approver formula and a rejection behavior (reject quote or reject step only).',
      "- **Delegated Approvers:** configure delegated approvers in each user's profile or via Approval Process settings. Test delegation before go-live — improperly configured delegation blocks quotes silently.",
      '- **Advanced Approvals Integration:** if the Approvals for Salesforce CPQ (AA) package is installed, use AA for all chains. Do not mix AA and native CPQ approvals on the same object — it causes unpredictable behavior.',
      '',
      '## Contract & Subscription Management',
      '- **Quote to Contract:** when a quote is marked Won, CPQ generates a Contract from the quote. Ensure `SBQQ__Contracted__c` is set to true on the Opportunity to trigger contract generation.',
      '- **Subscription Term:** set `SBQQ__SubscriptionTerm__c` on each subscription product. The term drives proration and renewal quoting. Validate term alignment between the product and the contract end date.',
      '- **Renewal Quoting:** configure CPQ to auto-generate renewal quotes 90 days before contract end (adjust per business process). Renewal quotes must inherit contracted pricing from the original contract.',
      '- **Amendment Quotes:** amendments modify an active contract mid-term. CPQ calculates co-termination prorations automatically. Never manually adjust amendment line prices — let CPQ calculate them to avoid revenue recognition errors.',
      '- **Co-termination:** when adding products mid-term, CPQ pro-rates the new lines to the contract end date. Verify the co-termination method (`SBQQ__CoTerminationEvent__c`) on the account matches the business expectation (Anniversary, End of Month, or Contract End Date).',
      '',
      '## CPQ Apex Plugins',
      "- **Quote Calculator Plugin (`SBQQ.QuoteCalculatorPlugin`):** implement this interface to override CPQ's pricing engine at specific calculation hooks (`onBeforeCalculate`, `onAfterCalculate`, `onBeforePriceRules`, `onAfterPriceRules`). Use it only when pricing logic cannot be achieved with Price Rules or Discount Schedules — the plugin bypasses declarative CPQ tools.",
      '- **Product Search Plugin:** implement `SBQQ.ProductSearchPlugin` to customize which products appear in the Quote Line Editor product catalog. Use it when product availability depends on quote header fields, account attributes, or external API lookups not accessible via standard CPQ filter criteria.',
      '- **Usage Consumption Plugin:** implement `SBQQ.UsagePlugin` to integrate external usage metering data (e.g., telemetry, billing platforms) into CPQ subscription lines. Use it only for genuine consumption-based billing — do not use it as a workaround for standard pricing complexity.',
      '',
      '## Trigger Coexistence',
      '- **SBQQ Managed Package Triggers:** CPQ ships with its own triggers on Quote, Quote Line, Product Option, and other objects. These managed triggers fire alongside any custom triggers you deploy.',
      "- **Kevin O'Hara Trigger Handler Pattern:** follow the single-trigger-per-object rule and delegate logic entirely to a handler class. For objects where CPQ already has a managed trigger, your custom trigger coexists — ensure your handler logic does not conflict with CPQ's managed trigger actions (e.g., do not set `SBQQ__CalculationStatus__c` manually in a trigger).",
      '- **Coexistence Documentation:** add a comment block at the top of each trigger handler that touches a CPQ object listing which SBQQ managed triggers also fire on that object and any known interaction risks.',
      '- **Testing:** always run CPQ-specific test scenarios (quote calculation, bundle configuration, approval submission) after deploying custom trigger handlers on CPQ objects to catch managed package conflicts early.',
      '',
      ...deployment(),
      '',
      ...semanticCommits(),
      '',
      ...interactionPreferences('CPQ configuration'),
    ].join('\n');
  },
};
