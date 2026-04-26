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
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { expect } from 'chai';
import { commerceProfile } from '../../../src/profiles/commerce.js';
import { generateCommerceWorkflows } from '../../../src/generators/workflows/commerce.js';

const VERSION = '0.1.0';

describe('commerceProfile', () => {
  it('has id "commerce"', () => {
    expect(commerceProfile.id).to.equal('commerce');
  });

  it('has label "Commerce Cloud (B2B / B2C)"', () => {
    expect(commerceProfile.label).to.equal('Commerce Cloud (B2B / B2C)');
  });

  it('has ruleFile "commerce-standards.mdc"', () => {
    expect(commerceProfile.ruleFile).to.equal('commerce-standards.mdc');
  });

  it('includes sfcc-studio extension', () => {
    expect(commerceProfile.extensions).to.include('SalesforceCommerceCloud.sfcc-studio');
  });

  it('includes prophet-debugger extension', () => {
    expect(commerceProfile.extensions).to.include('nickreid.prophet-debugger');
  });

  it('includes salesforcedx-vscode extension', () => {
    expect(commerceProfile.extensions).to.include('salesforce.salesforcedx-vscode');
  });

  describe('ruleContent()', () => {
    const content = commerceProfile.ruleContent();

    it('includes alwaysApply frontmatter', () => {
      expect(content).to.include('alwaysApply: true');
    });

    it('includes B2C SFRA Controller Patterns section', () => {
      expect(content).to.include('## SFRA Controller Patterns');
    });

    it('includes B2C ISML Templates section', () => {
      expect(content).to.include('## ISML Templates');
    });

    it('includes B2C Hooks section', () => {
      expect(content).to.include('## Hooks');
    });

    it('includes B2C Cartridge Layering section', () => {
      expect(content).to.include('## Cartridge Layering & Overlay');
    });

    it('includes B2C OCAPI / SCAPI section', () => {
      expect(content).to.include('## OCAPI / SCAPI');
    });

    it('includes B2C Job Framework section', () => {
      expect(content).to.include('## Job Framework');
    });

    it('includes B2C Business Manager section', () => {
      expect(content).to.include('## Business Manager Configuration');
    });

    it('includes B2C Performance section', () => {
      expect(content).to.include('## B2C Performance');
    });

    it('includes B2B Apex Integrations section', () => {
      expect(content).to.include('## Apex Integrations for Checkout');
    });

    it('includes B2B Buyer Groups section', () => {
      expect(content).to.include('## Buyer Groups, Entitlements & Pricing');
    });

    it('includes B2B Custom LWC section', () => {
      expect(content).to.include('## Custom LWC for Storefront');
    });

    it('includes B2B Cart & Checkout API section', () => {
      expect(content).to.include('## Cart & Checkout API');
    });

    it('includes B2B Search section', () => {
      expect(content).to.include('## B2B Search & Product Catalog');
    });

    it('includes B2B Order Management section', () => {
      expect(content).to.include('## Order Management Integration');
    });

    it('includes shared Documentation Standards', () => {
      expect(content).to.include('## Documentation Standards');
    });

    it('includes shared Deployment section', () => {
      expect(content).to.include('## Deployment');
    });

    it('includes shared Semantic Commits section', () => {
      expect(content).to.include('## Semantic Commits');
    });

    it('includes Sub-agent Handover section', () => {
      expect(content).to.include('## Sub-agent Handover');
    });

    it('includes shared Interaction Preferences section', () => {
      expect(content).to.include('## Interaction Preferences');
    });
  });

  describe('detect()', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = join(tmpdir(), `commerce-detect-${Date.now()}`);
      mkdirSync(tempDir, { recursive: true });
    });

    afterEach(() => {
      rmSync(tempDir, { recursive: true, force: true });
    });

    it('returns true when dw.json exists (B2C)', () => {
      writeFileSync(join(tempDir, 'dw.json'), '{}');
      expect(commerceProfile.detect!(tempDir)).to.equal(true);
    });

    it('returns true when cartridges/ directory exists (B2C)', () => {
      mkdirSync(join(tempDir, 'cartridges'));
      expect(commerceProfile.detect!(tempDir)).to.equal(true);
    });

    it('returns true when B2B commerce metadata exists', () => {
      mkdirSync(join(tempDir, 'force-app', 'main', 'default', 'objects', 'WebStore__c'), {
        recursive: true,
      });
      expect(commerceProfile.detect!(tempDir)).to.equal(true);
    });

    it('returns false for an empty directory', () => {
      expect(commerceProfile.detect!(tempDir)).to.equal(false);
    });
  });
});

describe('generateCommerceWorkflows()', () => {
  it('returns create-sfra-controller, configure-b2b-checkout, and cartridge-overlay files', () => {
    expect(generateCommerceWorkflows(VERSION)).to.have.keys([
      'create-sfra-controller.md',
      'configure-b2b-checkout.md',
      'cartridge-overlay.md',
    ]);
  });

  it('sfra-controller workflow references server.get', () => {
    expect(generateCommerceWorkflows(VERSION)['create-sfra-controller.md']).to.include('server.get');
  });

  it('sfra-controller workflow references middleware chain', () => {
    expect(generateCommerceWorkflows(VERSION)['create-sfra-controller.md']).to.include(
      'server.middleware.https'
    );
  });

  it('b2b-checkout workflow references ConnectApi', () => {
    expect(generateCommerceWorkflows(VERSION)['configure-b2b-checkout.md']).to.include(
      'ConnectApi.CommerceCart'
    );
  });

  it('b2b-checkout workflow references StoreIntegratedService', () => {
    expect(generateCommerceWorkflows(VERSION)['configure-b2b-checkout.md']).to.include(
      'StoreIntegratedService'
    );
  });

  it('cartridge-overlay workflow references module.superModule', () => {
    expect(generateCommerceWorkflows(VERSION)['cartridge-overlay.md']).to.include(
      'module.superModule'
    );
  });

  it('cartridge-overlay workflow references server.replace', () => {
    expect(generateCommerceWorkflows(VERSION)['cartridge-overlay.md']).to.include('server.replace');
  });

  it('each workflow includes the setup-agents version comment', () => {
    for (const content of Object.values(generateCommerceWorkflows(VERSION))) {
      expect(content).to.include(`<!-- setup-agents: ${VERSION} -->`);
    }
  });
});
