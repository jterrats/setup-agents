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
import { generateCommerceWorkflows } from '../generators/workflows/commerce.js';
import {
  consultativeDesign,
  deployment,
  documentationStandards,
  interactionPreferences,
  semanticCommits,
} from './shared-sections.js';
import type { Profile } from './types.js';

export const commerceProfile: Profile = {
  id: 'commerce',
  label: 'Commerce Cloud (B2B / B2C)',
  ruleFile: 'commerce-standards.mdc',
  extensions: [
    'SalesforceCommerceCloud.sfcc-studio',
    'nickreid.prophet-debugger',
    'salesforce.salesforcedx-vscode',
  ],
  workflows: generateCommerceWorkflows,
  detect(cwd: string): boolean {
    const hasB2CMarkers =
      existsSync(join(cwd, 'dw.json')) || existsSync(join(cwd, 'cartridges'));
    const hasB2BMarkers =
      existsSync(join(cwd, 'force-app', 'main', 'default', 'objects', 'WebStore__c')) ||
      existsSync(join(cwd, 'force-app', 'main', 'default', 'objects', 'WebCart__c'));
    return hasB2CMarkers || hasB2BMarkers;
  },
  ruleContent(): string {
    return [
      '---',
      'description: Commerce Cloud (B2B / B2C) Standards',
      'globs:',
      'alwaysApply: true',
      '---',
      '',
      '# Commerce Cloud (B2B / B2C) Standards',
      '',
      '> Role: Commerce Cloud Developer — Salesforce Professional Services.',
      '',
      ...consultativeDesign('commerce architecture decisions (B2B vs B2C, headless vs storefront)'),
      '',
      '---',
      '',
      '# B2C Commerce (SFCC / SFRA)',
      '',
      '## SFRA Controller Patterns',
      '- Controllers use `server.get()`, `server.post()` to register routes.',
      '- Always call `next()` at the end of every middleware step.',
      '- Use the middleware chain for cross-cutting concerns: `server.middleware.https`, `userLoggedIn`, `consentTracking`.',
      '- Never put business logic directly in controllers — delegate to helpers or models.',
      '- Export via `module.exports = server.exports()`.',
      '',
      '## ISML Templates',
      '- Use `<isloop>` for iteration, `<isset>` for variable assignment, `<isif>` for conditionals.',
      '- Include shared partials with `<isinclude template="..." />`.',
      '- Reference resource bundles: `${Resource.msg(\'key\',\'bundle\',null)}`.',
      '- Never embed business logic in ISML — keep templates presentation-only.',
      '- Use `<isdecorate>` for page layouts.',
      '',
      '## Hooks',
      '- Register hooks in `hooks.json` at the cartridge root.',
      '- Common hooks: `app.post` (post-processing), `dw.order.calculate` (pricing/tax/shipping),',
      '  `dw.ocapi.shop.order.afterPOST` (OCAPI order events).',
      '- Hook implementations must be idempotent — they may fire multiple times.',
      '',
      '## Cartridge Layering & Overlay',
      '- **Never modify `app_storefront_base` directly.** Always overlay in a custom cartridge.',
      '- Use `module.superModule` + `server.extend(base)` to override controller routes.',
      '- `server.replace()` fully replaces a route; `server.append()` / `server.prepend()` extend it.',
      '- Mirror the base cartridge directory structure for template overrides.',
      '- Cartridge path order determines precedence — custom cartridge must appear before base.',
      '',
      '## OCAPI / SCAPI (Headless Commerce)',
      '- Prefer **SCAPI** (Shopper APIs via Commerce SDK) for new headless implementations.',
      '- Use **OCAPI** only for legacy integrations or features not yet available in SCAPI.',
      '- Authenticate via SLAS (Shopper Login and API Security) for B2C headless storefronts.',
      '- Never expose OCAPI credentials client-side — proxy through a middleware layer.',
      '- Version OCAPI resources explicitly; pin to a stable version.',
      '',
      '## Job Framework',
      '- Define custom job steps in `steptypes.json` at the cartridge root.',
      '- Job step modules: `cartridge/scripts/jobsteps/<StepName>.js`.',
      '- Export `execute(params, stepExecution)` — handle chunk-based processing for large datasets.',
      '- Log progress via `stepExecution.getJobExecution()` — never use `print()` in production.',
      '- Schedule jobs in Business Manager; avoid hardcoded schedules in code.',
      '',
      '## Business Manager Configuration',
      '- Site Preferences: use for runtime toggles that differ per site.',
      '- Custom Objects: use for structured data that does not belong in the catalog.',
      '- System Object extensions: document every custom attribute added to system objects.',
      '- Import/Export: use Site Import/Export for sandbox seeding; never rely on manual configuration.',
      '',
      '## B2C Performance',
      '- Cache aggressively: use `dw.system.CacheMgr` for expensive computations.',
      '- Avoid unnecessary API calls in controllers — batch and reuse ContentSearchResult, ProductSearchModel.',
      '- Minimize ISML `<isloop>` nesting — flatten data in the model layer.',
      '- Use `dw.util.Iterator` for large collections instead of converting to arrays.',
      '- Profile slow pages with Pipeline Profiler in Business Manager.',
      '',
      '---',
      '',
      '# B2B Commerce (Lightning)',
      '',
      '## Apex Integrations for Checkout',
      '- Implement checkout steps as Apex classes registered via `StoreIntegratedService`.',
      '- Key APIs: `ConnectApi.CommerceCart`, `ConnectApi.CommerceCatalog`, `ConnectApi.CommerceStorePricing`.',
      '- Follow standard Apex rules: `with sharing`, bulkified, no SOQL/DML in loops.',
      '- Scan for existing custom exception class before writing `try-catch`.',
      '',
      '## Buyer Groups, Entitlements & Pricing',
      '- Assign products to **Entitlement Policies** linked to **Buyer Groups**.',
      '- Use **Pricebooks** for tiered pricing; assign pricebooks to buyer groups.',
      '- Test entitlement visibility with `System.runAs()` using buyer-profile test users.',
      '- Validate that unauthenticated users cannot see entitled products.',
      '',
      '## Custom LWC for Storefront',
      '- Extend the B2B storefront using LWC components exposed to the **Commerce Builder**.',
      '- Target `lightningCommunity__Page` and `commerce__Default` in `js-meta.xml`.',
      '- Use **SLDS Styling Hooks** — do not override Commerce theme tokens.',
      '- Wire to `@salesforce/apex` for custom data; prefer `lightning/uiRecordApi` for standard objects.',
      '',
      '## Cart & Checkout API',
      '- Use `ConnectApi.CommerceCart.getOrCreateActiveCartSummary()` for cart access.',
      '- Add/remove items via `ConnectApi.CommerceCart.addItemToCart()` and `deleteCartItem()`.',
      '- Checkout flow: Cart → Shipping → Tax Calculation → Payment → Order Creation.',
      '- Handle `CommerceCart.CartValidationOutput` to surface errors to the buyer.',
      '',
      '## B2B Search & Product Catalog',
      '- Use **Commerce Search** (powered by the search index) — do not query Product2 directly for storefront.',
      '- Rebuild the search index after catalog changes: Setup → Commerce → Search.',
      '- Configure searchable fields and facets in the Store Builder.',
      '- For programmatic search, use `ConnectApi.CommerceSearchResource.searchProducts()`.',
      '',
      '## Order Management Integration',
      '- For Salesforce Order Management: map B2B orders to `OrderSummary` via `ConnectApi.OrderSummaryCreation`.',
      '- Ensure `FulfillmentOrder` and `OrderItemSummary` records are created for downstream fulfillment.',
      '- Test the full cycle: cart → order → fulfillment → invoice.',
      '- For external OMS: integrate via Platform Events or MuleSoft APIs.',
      '',
      '---',
      '',
      '# Shared Standards',
      '',
      ...documentationStandards(),
      '',
      ...deployment(),
      '',
      ...semanticCommits(),
      '',
      '## Sub-agent Handover',
      '- Pass to sub-agents: commerce type (B2B / B2C), cartridge path or WebStore ID,',
      '  API version from `sfdx-project.json` (B2B) or `dw.json` compatibility mode (B2C).',
      '- Sub-agents must follow: cartridge overlay pattern (B2C), standard Apex rules (B2B).',
      '',
      ...interactionPreferences('commerce architecture'),
    ].join('\n');
  },
};
