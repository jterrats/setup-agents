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
import { mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { expect } from 'chai';
import { securityProfile } from '../../../src/profiles/security.js';

const VERSION = '0.1.0';

describe('securityProfile', () => {
  it('has id "security"', () => {
    expect(securityProfile.id).to.equal('security');
  });

  it('has label "Security / Compliance"', () => {
    expect(securityProfile.label).to.equal('Security / Compliance');
  });

  it('has ruleFile "security-standards.mdc"', () => {
    expect(securityProfile.ruleFile).to.equal('security-standards.mdc');
  });

  it('includes salesforcedx-vscode extension', () => {
    expect(securityProfile.extensions).to.include('salesforce.salesforcedx-vscode');
  });

  it('includes sfdx-code-analyzer extension', () => {
    expect(securityProfile.extensions).to.include('salesforce.sfdx-code-analyzer-vscode');
  });

  it('includes lana extension', () => {
    expect(securityProfile.extensions).to.include('financialforce.lana');
  });

  describe('detect()', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = mkdtempSync(join(tmpdir(), 'security-detect-'));
    });

    afterEach(() => {
      rmSync(tempDir, { recursive: true, force: true });
    });

    it('returns true when force-app directory exists', () => {
      mkdirSync(join(tempDir, 'force-app'));
      expect(securityProfile.detect!(tempDir)).to.equal(true);
    });

    it('returns false when force-app directory does not exist', () => {
      expect(securityProfile.detect!(tempDir)).to.equal(false);
    });
  });

  describe('ruleContent()', () => {
    const content = securityProfile.ruleContent();

    it('includes FLS enforcement section', () => {
      expect(content).to.include('Field-Level Security (FLS) Enforcement');
    });

    it('includes CRUD checks section', () => {
      expect(content).to.include('CRUD Checks Before DML');
    });

    it('includes Platform Encryption section', () => {
      expect(content).to.include('Platform Encryption (Shield)');
    });

    it('includes OWD and sharing model section', () => {
      expect(content).to.include('Organization-Wide Defaults (OWD)');
    });

    it('includes OWASP Top 10 mapping', () => {
      expect(content).to.include('OWASP Top 10');
    });

    it('includes WITH SECURITY_ENFORCED rule', () => {
      expect(content).to.include('WITH SECURITY_ENFORCED');
    });

    it('includes stripInaccessible rule', () => {
      expect(content).to.include('Security.stripInaccessible()');
    });

    it('includes Health Check score target', () => {
      expect(content).to.include('Health Check score of 90+');
    });

    it('includes Named Credentials rule', () => {
      expect(content).to.include('Named Credentials');
    });

    it('includes Custom Permissions for feature gates', () => {
      expect(content).to.include('Custom Permissions for Feature Gates');
    });

    it('includes CSP section', () => {
      expect(content).to.include('Content Security Policy (CSP)');
    });

    it('includes Connected App security section', () => {
      expect(content).to.include('Connected App Security');
    });

    it('includes Permission Set Groups strategy', () => {
      expect(content).to.include('Permission Set Groups Strategy');
    });

    it('includes sensitive data classification', () => {
      expect(content).to.include('Sensitive Data Classification');
    });

    it('includes Event Monitoring section', () => {
      expect(content).to.include('Event Monitoring');
    });

    it('includes Login Flows section', () => {
      expect(content).to.include('Login Flows');
    });

    it('includes deterministic vs probabilistic encryption guidance', () => {
      expect(content).to.include('Deterministic encryption');
    });

    it('includes SOQL injection prevention', () => {
      expect(content).to.include('SOQL injection');
    });

    it('includes alwaysApply frontmatter', () => {
      expect(content).to.include('alwaysApply: true');
    });

    it('includes shared Consultative Design section', () => {
      expect(content).to.include('Consultative Design (CRITICAL)');
    });

    it('includes shared Documentation Standards section', () => {
      expect(content).to.include('## Documentation Standards');
    });

    it('includes shared Semantic Commits section', () => {
      expect(content).to.include('## Semantic Commits');
    });

    it('includes shared Deployment section', () => {
      expect(content).to.include('## Deployment');
    });
  });

  describe('workflows()', () => {
    it('returns sharing-model-review, fls-audit and encryption-strategy files', () => {
      const workflows = securityProfile.workflows!(VERSION);
      expect(workflows).to.have.keys([
        'sharing-model-review.md',
        'fls-audit.md',
        'encryption-strategy.md',
      ]);
    });

    it('each workflow includes the setup-agents version comment', () => {
      for (const content of Object.values(securityProfile.workflows!(VERSION))) {
        expect(content).to.include(`<!-- setup-agents: ${VERSION} -->`);
      }
    });
  });
});
