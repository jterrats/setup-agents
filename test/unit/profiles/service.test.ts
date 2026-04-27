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
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect } from 'chai';
import { serviceProfile } from '../../../src/profiles/service.js';
import { generateServiceWorkflows } from '../../../src/generators/workflows/service.js';

const VERSION = '0.1.0';

describe('serviceProfile', () => {
  it('has id "service"', () => {
    expect(serviceProfile.id).to.equal('service');
  });

  it('has label "Service Cloud"', () => {
    expect(serviceProfile.label).to.equal('Service Cloud');
  });

  it('has ruleFile "service-standards.mdc"', () => {
    expect(serviceProfile.ruleFile).to.equal('service-standards.mdc');
  });

  it('includes salesforcedx-vscode extension', () => {
    expect(serviceProfile.extensions).to.include('salesforce.salesforcedx-vscode');
  });

  describe('ruleContent()', () => {
    const content = serviceProfile.ruleContent();

    it('returns a non-empty string', () => {
      expect(content).to.be.a('string').and.not.be.empty;
    });

    it('includes alwaysApply frontmatter', () => {
      expect(content).to.include('alwaysApply: true');
    });

    it('contains Case Management section', () => {
      expect(content).to.include('## Case Management');
    });

    it('contains Entitlement Processes section', () => {
      expect(content).to.include('## Entitlement Processes & Milestones');
    });

    it('contains Knowledge Management section', () => {
      expect(content).to.include('## Knowledge Management');
    });

    it('contains Omni-Channel Routing section', () => {
      expect(content).to.include('## Omni-Channel Routing');
    });

    it('contains Einstein Bots section', () => {
      expect(content).to.include('## Einstein Bots');
    });

    it('contains Macros & Quick Text section', () => {
      expect(content).to.include('## Macros & Quick Text');
    });

    it('contains Messaging Channels section', () => {
      expect(content).to.include('## Messaging Channels');
    });

    it('references escalation rules', () => {
      expect(content).to.include('Escalation Rules');
    });

    it('references business hours', () => {
      expect(content).to.include('Business Hours');
    });

    it('references NLU intent training', () => {
      expect(content).to.include('NLU');
    });

    it('includes shared Consultative Design section', () => {
      expect(content).to.include('## Consultative Design (CRITICAL)');
    });

    it('includes shared Deployment section', () => {
      expect(content).to.include('## Deployment');
    });

    it('includes shared Semantic Commits section', () => {
      expect(content).to.include('## Semantic Commits');
    });
  });

  describe('detect()', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = mkdtempSync(join(tmpdir(), 'service-detect-'));
    });

    afterEach(() => {
      rmSync(tempDir, { recursive: true, force: true });
    });

    it('returns true when objects/Case directory exists', () => {
      mkdirSync(join(tempDir, 'force-app/main/default/objects/Case'), { recursive: true });
      expect(serviceProfile.detect!(tempDir)).to.equal(true);
    });

    it('returns true when entitlementProcesses directory exists', () => {
      mkdirSync(join(tempDir, 'force-app/main/default/entitlementProcesses'), { recursive: true });
      expect(serviceProfile.detect!(tempDir)).to.equal(true);
    });

    it('returns true when bots directory exists', () => {
      mkdirSync(join(tempDir, 'force-app/main/default/bots'), { recursive: true });
      expect(serviceProfile.detect!(tempDir)).to.equal(true);
    });

    it('returns false for an empty directory', () => {
      expect(serviceProfile.detect!(tempDir)).to.equal(false);
    });
  });

  describe('workflows()', () => {
    it('returns case-lifecycle-setup, knowledge-base-structure, and omni-channel-configuration files', () => {
      expect(generateServiceWorkflows(VERSION)).to.have.keys([
        'case-lifecycle-setup.md',
        'knowledge-base-structure.md',
        'omni-channel-configuration.md',
      ]);
    });

    it('each workflow includes the setup-agents version comment', () => {
      for (const content of Object.values(generateServiceWorkflows(VERSION))) {
        expect(content).to.include(`<!-- setup-agents: ${VERSION} -->`);
      }
    });
  });
});
