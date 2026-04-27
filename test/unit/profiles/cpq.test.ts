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
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect } from 'chai';
import { cpqProfile } from '../../../src/profiles/cpq.js';
import { generateCpqWorkflows } from '../../../src/generators/workflows/cpq.js';

const VERSION = '0.1.0';

describe('cpqProfile', () => {
  it('has id "cpq"', () => {
    expect(cpqProfile.id).to.equal('cpq');
  });

  it('has label "CPQ Specialist"', () => {
    expect(cpqProfile.label).to.equal('CPQ Specialist');
  });

  it('has ruleFile "cpq-standards.mdc"', () => {
    expect(cpqProfile.ruleFile).to.equal('cpq-standards.mdc');
  });

  it('includes salesforcedx-vscode extension', () => {
    expect(cpqProfile.extensions).to.include('salesforce.salesforcedx-vscode');
  });

  describe('ruleContent()', () => {
    const content = cpqProfile.ruleContent();

    it('returns a non-empty string', () => {
      expect(content).to.be.a('string').and.not.be.empty;
    });

    it('includes alwaysApply frontmatter', () => {
      expect(content).to.include('alwaysApply: true');
    });

    it('contains Product & Price Book Structure section', () => {
      expect(content).to.include('## Product & Price Book Structure');
    });

    it('contains Product Bundles & Options section', () => {
      expect(content).to.include('## Product Bundles & Options');
    });

    it('contains Pricing Rules section', () => {
      expect(content).to.include('## Pricing Rules');
    });

    it('contains Discount Schedules section', () => {
      expect(content).to.include('## Discount Schedules');
    });

    it('contains Quote Templates section', () => {
      expect(content).to.include('## Quote Templates');
    });

    it('contains Approval Chains section', () => {
      expect(content).to.include('## Approval Chains');
    });

    it('contains Contract & Subscription Management section', () => {
      expect(content).to.include('## Contract & Subscription Management');
    });

    it('contains CPQ Apex Plugins section', () => {
      expect(content).to.include('## CPQ Apex Plugins');
    });

    it('contains Trigger Coexistence section', () => {
      expect(content).to.include('## Trigger Coexistence');
    });

    it('references SBQQ namespace', () => {
      expect(content).to.include('SBQQ');
    });

    it('includes shared Consultative Design section', () => {
      expect(content).to.include('## Consultative Design (CRITICAL)');
    });

    it('includes shared Semantic Commits section', () => {
      expect(content).to.include('## Semantic Commits');
    });
  });

  describe('detect()', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = mkdtempSync(join(tmpdir(), 'cpq-detect-'));
    });

    afterEach(() => {
      rmSync(tempDir, { recursive: true, force: true });
    });

    it('returns true when SBQQ__Quote__c object directory exists', () => {
      mkdirSync(join(tempDir, 'force-app/main/default/objects/SBQQ__Quote__c'), { recursive: true });
      expect(cpqProfile.detect!(tempDir)).to.equal(true);
    });

    it('returns true when SBQQ object-meta.xml exists under force-app', () => {
      mkdirSync(join(tempDir, 'force-app/main/default/objects'), { recursive: true });
      writeFileSync(join(tempDir, 'force-app/main/default/objects/SBQQ__Product2.object-meta.xml'), '<CustomObject/>');
      expect(cpqProfile.detect!(tempDir)).to.equal(true);
    });

    it('returns false for an empty directory', () => {
      expect(cpqProfile.detect!(tempDir)).to.equal(false);
    });
  });

  describe('workflows()', () => {
    it('returns product-bundle-setup, pricing-rule, and approval-chain files', () => {
      expect(generateCpqWorkflows(VERSION)).to.have.keys([
        'product-bundle-setup.md',
        'pricing-rule.md',
        'approval-chain.md',
      ]);
    });

    it('each workflow includes the setup-agents version comment', () => {
      for (const content of Object.values(generateCpqWorkflows(VERSION))) {
        expect(content).to.include(`<!-- setup-agents: ${VERSION} -->`);
      }
    });
  });
});
