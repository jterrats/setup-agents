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
import { fslProfile } from '../../../src/profiles/fsl.js';
import { generateFslWorkflows } from '../../../src/generators/workflows/fsl.js';

const VERSION = '0.1.0';

describe('fslProfile', () => {
  it('has id "fsl"', () => {
    expect(fslProfile.id).to.equal('fsl');
  });

  it('has label "Field Service (FSL)"', () => {
    expect(fslProfile.label).to.equal('Field Service (FSL)');
  });

  it('has ruleFile "fsl-standards.mdc"', () => {
    expect(fslProfile.ruleFile).to.equal('fsl-standards.mdc');
  });

  it('includes salesforcedx-vscode extension', () => {
    expect(fslProfile.extensions).to.include('salesforce.salesforcedx-vscode');
  });

  describe('ruleContent()', () => {
    const content = fslProfile.ruleContent();

    it('returns a non-empty string', () => {
      expect(content).to.be.a('string').and.not.be.empty;
    });

    it('includes alwaysApply frontmatter', () => {
      expect(content).to.include('alwaysApply: true');
    });

    it('contains Work Order Lifecycle section', () => {
      expect(content).to.include('## Work Order Lifecycle');
    });

    it('contains Service Appointments section', () => {
      expect(content).to.include('## Service Appointments');
    });

    it('contains Scheduling Policies section', () => {
      expect(content).to.include('## Scheduling Policies');
    });

    it('contains Territory & Service Resource Management section', () => {
      expect(content).to.include('## Territory & Service Resource Management');
    });

    it('contains Mobile App Configuration section', () => {
      expect(content).to.include('## Mobile App Configuration');
    });

    it('contains Parts & Inventory Management section', () => {
      expect(content).to.include('## Parts & Inventory Management');
    });

    it('contains Maintenance Plans section', () => {
      expect(content).to.include('## Maintenance Plans');
    });

    it('references Dispatcher Console', () => {
      expect(content).to.include('Dispatcher Console');
    });

    it('references scheduling constraints', () => {
      expect(content).to.include('constraints');
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
      tempDir = mkdtempSync(join(tmpdir(), 'fsl-detect-'));
    });

    afterEach(() => {
      rmSync(tempDir, { recursive: true, force: true });
    });

    it('returns true when objects/ServiceAppointment directory exists', () => {
      mkdirSync(join(tempDir, 'force-app/main/default/objects/ServiceAppointment'), { recursive: true });
      expect(fslProfile.detect!(tempDir)).to.equal(true);
    });

    it('returns true when objects/WorkOrder directory exists', () => {
      mkdirSync(join(tempDir, 'force-app/main/default/objects/WorkOrder'), { recursive: true });
      expect(fslProfile.detect!(tempDir)).to.equal(true);
    });

    it('returns false for an empty directory', () => {
      expect(fslProfile.detect!(tempDir)).to.equal(false);
    });
  });

  describe('workflows()', () => {
    it('returns work-order-setup, scheduling-policy, and mobile-configuration files', () => {
      expect(generateFslWorkflows(VERSION)).to.have.keys([
        'work-order-setup.md',
        'scheduling-policy.md',
        'mobile-configuration.md',
      ]);
    });

    it('each workflow includes the setup-agents version comment', () => {
      for (const content of Object.values(generateFslWorkflows(VERSION))) {
        expect(content).to.include(`<!-- setup-agents: ${VERSION} -->`);
      }
    });
  });
});
