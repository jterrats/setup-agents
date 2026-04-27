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
import { adminProfile } from '../../../src/profiles/admin.js';

describe('adminProfile', () => {
  it('has id "admin"', () => {
    expect(adminProfile.id).to.equal('admin');
  });

  it('has label "Admin / Configurator"', () => {
    expect(adminProfile.label).to.equal('Admin / Configurator');
  });

  it('has ruleFile "admin-standards.mdc"', () => {
    expect(adminProfile.ruleFile).to.equal('admin-standards.mdc');
  });

  it('includes salesforcedx-vscode extension', () => {
    expect(adminProfile.extensions).to.include('salesforce.salesforcedx-vscode');
  });

  it('includes sfdx-hardis extension', () => {
    expect(adminProfile.extensions).to.include('moody.sfdx-hardis');
  });

  describe('ruleContent()', () => {
    const content = adminProfile.ruleContent();

    it('returns a non-empty string', () => {
      expect(content).to.be.a('string').and.not.be.empty;
    });

    it('contains Flow Best Practices section', () => {
      expect(content).to.include('## Flow Best Practices');
    });

    it('contains Validation Rules section', () => {
      expect(content).to.include('## Validation Rules');
    });

    it('contains Permission Sets section', () => {
      expect(content).to.include('## Permission Sets & Security');
    });

    it('contains Custom Fields section', () => {
      expect(content).to.include('## Custom Fields');
    });

    it('contains Custom Metadata Types section', () => {
      expect(content).to.include('## Custom Metadata Types');
    });

    it('contains Formula Field Optimization section', () => {
      expect(content).to.include('## Formula Field Optimization');
    });

    it('contains Process Automation Decision Tree section', () => {
      expect(content).to.include('## Process Automation Decision Tree');
    });

    it('references Bypass_Validation_Rules Custom Permission', () => {
      expect(content).to.include('$Permission.Bypass_Validation_Rules');
    });

    it('includes shared Consultative Design section', () => {
      expect(content).to.include('## Consultative Design (CRITICAL)');
    });

    it('includes shared Documentation Standards section', () => {
      expect(content).to.include('## Documentation Standards');
    });

    it('includes shared Deployment section', () => {
      expect(content).to.include('## Deployment');
    });

    it('includes shared Semantic Commits section', () => {
      expect(content).to.include('## Semantic Commits');
    });

    it('includes shared Interaction Preferences section', () => {
      expect(content).to.include('## Interaction Preferences');
    });

    it('includes frontmatter with alwaysApply', () => {
      expect(content).to.include('alwaysApply: true');
    });
  });

  describe('detect()', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = mkdtempSync(join(tmpdir(), 'admin-detect-'));
    });

    afterEach(() => {
      rmSync(tempDir, { recursive: true, force: true });
    });

    it('returns true when force-app directory exists', () => {
      mkdirSync(join(tempDir, 'force-app'));
      expect(adminProfile.detect!(tempDir)).to.equal(true);
    });

    it('returns false when force-app directory does not exist', () => {
      expect(adminProfile.detect!(tempDir)).to.equal(false);
    });
  });

  describe('workflows()', () => {
    it('returns create-flow, create-validation-rule, permission-set-setup and destructive-deploy files', () => {
      const workflows = adminProfile.workflows!('0.1.0');
      expect(workflows).to.have.keys([
        'create-flow.md',
        'create-validation-rule.md',
        'permission-set-setup.md',
        'destructive-deploy.md',
      ]);
    });
  });
});
