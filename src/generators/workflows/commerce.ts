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

export function generateCommerceWorkflows(version: string): Record<string, string> {
  return {
    'create-sfra-controller.md': workflow(
      version,
      'Create SFRA Controller (B2C)',
      `
## 1. Gather Requirements

Ask:
- Controller name (PascalCase, e.g. \`MyFeature\`)
- Target cartridge (custom overlay cartridge, never \`app_storefront_base\`)
- Routes needed (GET / POST / Show / Submit)
- Middleware chain (\`server.middleware.https\`, \`userLoggedIn\`, \`consentTracking\`, etc.)

Check the cartridge path in \`dw.json\` or Business Manager to confirm layering order.

## 2. Generate Controller

Create \`<CartridgeName>/cartridge/controllers/<ControllerName>.js\`:

\`\`\`javascript
'use strict';

var server = require('server');
var page = server.forms.getForm('myform');

server.get('Show', server.middleware.https, function (req, res, next) {
    res.render('path/to/template', { myData: {} });
    next();
});

server.post('Submit', server.middleware.https, function (req, res, next) {
    // process form data
    res.json({ success: true });
    next();
});

module.exports = server.exports();
\`\`\`

Always call \`next()\` at the end of every middleware step.

## 3. Create ISML Template

Create the corresponding \`.isml\` template in \`<CartridgeName>/cartridge/templates/default/\`:
- Use \`<isinclude>\` for shared partials
- Use \`<isloop>\` for collections, \`<isset>\` for variables
- Reference resource bundles via \`\${Resource.msg('key','bundle',null)}\`

## 4. Register & Test

- Verify the cartridge appears in the cartridge path (Business Manager → Sites → Manage Sites → Settings)
- Test the route at \`https://<sandbox>/on/demandware.store/Sites-<SiteID>-Site/default/<ControllerName>-Show\`
`
    ),
    'configure-b2b-checkout.md': workflow(
      version,
      'Configure B2B Checkout Flow',
      `
## 1. Gather Requirements

Ask:
- Which checkout steps are needed (shipping, payment, order summary, custom)
- Payment gateway integration (Salesforce Payments, custom gateway adapter)
- Tax calculation approach (native tax engine, external service)
- Whether to extend the default checkout or build a custom flow

## 2. Review Existing Configuration

Inspect:
- \`force-app/main/default/objects/WebStore__c/\` or standard WebStore metadata
- Existing checkout-related Apex classes in \`force-app/main/default/classes/\`
- Active \`StoreIntegratedService\` records linking services to the store

## 3. Implement Checkout Apex

Create or extend the checkout integration classes:

\`\`\`apex
public with sharing class CustomCheckoutService {
    public static void processCheckout(Id cartId, Id webStoreId) {
        // 1. Validate cart items and inventory
        // 2. Calculate taxes via ConnectApi.CommerceCart
        // 3. Apply pricing rules and entitlements
        // 4. Create order from cart
    }
}
\`\`\`

Key APIs:
- \`ConnectApi.CommerceCart\` — cart operations
- \`ConnectApi.CommerceCatalog\` — product resolution
- \`ConnectApi.CommerceStorePricing\` — price calculations

Follow standard Apex rules: \`with sharing\`, bulkified, one Assert per test method.

## 4. Create Test Class

Generate \`CustomCheckoutService_Test.cls\`:
- Use \`@TestSetup\` to create WebStore, BuyerGroup, Pricebook, and Product data
- Test the happy path and at least one error scenario
- Target 90% coverage

## 5. Deploy & Verify

\`\`\`bash
sf project deploy start --source-dir force-app/main/default/classes/CustomCheckoutService.cls --target-org <alias>
sf project deploy start --source-dir force-app/main/default/classes/CustomCheckoutService_Test.cls --target-org <alias>
\`\`\`

Verify checkout flow in the storefront by adding items to cart and completing a test purchase.
`
    ),
    'cartridge-overlay.md': workflow(
      version,
      'Cartridge Overlay Pattern (B2C)',
      `
## 1. Identify the Extension Point

Ask:
- Which base cartridge file needs modification (\`app_storefront_base\`, \`plugin_*\`)
- What behavior needs to change or extend
- Whether the change is a controller override, template override, or model extension

**CRITICAL:** Never modify \`app_storefront_base\` directly. Always overlay in a custom cartridge.

## 2. Set Up the Overlay Cartridge

Ensure the custom cartridge exists and is registered:
1. Cartridge directory: \`<custom_cartridge>/cartridge/\`
2. \`.project\` and \`package.json\` are present
3. Cartridge path order in Business Manager: custom cartridge **before** base

## 3. Apply the Overlay

### Controller Override
Copy the route, not the entire controller. Use \`module.superModule\`:

\`\`\`javascript
'use strict';

var server = require('server');
var base = module.superModule;
server.extend(base);

server.replace('Show', server.middleware.https, function (req, res, next) {
    // custom logic
    res.render('custom/template', { customData: {} });
    next();
});

module.exports = server.exports();
\`\`\`

- \`server.replace()\` — fully replaces the route
- \`server.append()\` — runs after the original route
- \`server.prepend()\` — runs before the original route

### Template Override
Mirror the directory structure in your custom cartridge:
\`<custom_cartridge>/cartridge/templates/default/<same/path/as/base>.isml\`

### Model Extension
Extend or decorate the model in your custom cartridge:
\`<custom_cartridge>/cartridge/models/<ModelName>.js\`

## 4. Verify Layering

- Confirm cartridge path order in Business Manager
- Test that the base behavior is overridden, not duplicated
- Verify that removing the custom cartridge from the path restores original behavior
`
    ),
  };
}
