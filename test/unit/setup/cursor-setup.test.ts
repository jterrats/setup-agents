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
import { mkdtempSync, rmSync, existsSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect } from 'chai';
import { baProfile } from '../../../src/profiles/ba.js';
import { developerProfile } from '../../../src/profiles/developer.js';
import { qaProfile } from '../../../src/profiles/qa.js';
import { FileWriter } from '../../../src/services/file-writer.js';
import { setupCursor } from '../../../src/setup/cursor-setup.js';

function makeWriter(force = false): FileWriter {
  return new FileWriter({ force, log: () => {}, warn: () => {} });
}

describe('setupCursor()', () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'setup-cursor-test-'));
    originalCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('scope: project', () => {
    it('writes agent-guidelines.mdc and sub-agent-protocol.mdc', async () => {
      await setupCursor({
        cwd: tmpDir,
        profiles: [developerProfile],
        writer: makeWriter(),
        isSalesforceProject: false,
        promptScope: async () => 'project',
        logInfo: () => {},
      });

      expect(existsSync(join(tmpDir, '.cursor', 'rules', 'agent-guidelines.mdc'))).to.be.true;
      expect(existsSync(join(tmpDir, '.cursor', 'rules', 'sub-agent-protocol.mdc'))).to.be.true;
    });

    it('writes salesforce-standards.mdc for Salesforce projects', async () => {
      writeFileSync(join(tmpDir, 'sfdx-project.json'), '{}');

      await setupCursor({
        cwd: tmpDir,
        profiles: [developerProfile],
        writer: makeWriter(),
        isSalesforceProject: true,
        promptScope: async () => 'project',
        logInfo: () => {},
      });

      expect(existsSync(join(tmpDir, '.cursor', 'rules', 'salesforce-standards.mdc'))).to.be.true;
    });

    it('writes profile rule file for Salesforce project with scope project', async () => {
      writeFileSync(join(tmpDir, 'sfdx-project.json'), '{}');

      await setupCursor({
        cwd: tmpDir,
        profiles: [developerProfile],
        writer: makeWriter(),
        isSalesforceProject: true,
        promptScope: async () => 'project',
        logInfo: () => {},
      });

      expect(existsSync(join(tmpDir, '.cursor', 'rules', developerProfile.ruleFile))).to.be.true;
    });
  });

  describe('scope: user', () => {
    const userRulesDir = join(homedir(), '.cursor', 'rules');

    it('writes salesforce-standards.mdc to ~/.cursor/rules/', async () => {
      writeFileSync(join(tmpDir, 'sfdx-project.json'), '{}');

      await setupCursor({
        cwd: tmpDir,
        profiles: [developerProfile],
        writer: makeWriter(),
        isSalesforceProject: true,
        promptScope: async () => 'user',
        logInfo: () => {},
      });

      expect(existsSync(join(userRulesDir, 'salesforce-standards.mdc'))).to.be.true;
    });

    it('writes profile rule file to ~/.cursor/rules/', async () => {
      writeFileSync(join(tmpDir, 'sfdx-project.json'), '{}');

      await setupCursor({
        cwd: tmpDir,
        profiles: [developerProfile],
        writer: makeWriter(),
        isSalesforceProject: true,
        promptScope: async () => 'user',
        logInfo: () => {},
      });

      expect(existsSync(join(userRulesDir, developerProfile.ruleFile))).to.be.true;
    });

    it('does NOT write salesforce-standards.mdc to project directory', async () => {
      writeFileSync(join(tmpDir, 'sfdx-project.json'), '{}');

      await setupCursor({
        cwd: tmpDir,
        profiles: [developerProfile],
        writer: makeWriter(),
        isSalesforceProject: true,
        promptScope: async () => 'user',
        logInfo: () => {},
      });

      expect(existsSync(join(tmpDir, '.cursor', 'rules', 'salesforce-standards.mdc'))).to.be.false;
    });

    it('still writes agent-guidelines.mdc and sub-agent-protocol.mdc to project directory', async () => {
      writeFileSync(join(tmpDir, 'sfdx-project.json'), '{}');

      await setupCursor({
        cwd: tmpDir,
        profiles: [developerProfile],
        writer: makeWriter(),
        isSalesforceProject: true,
        promptScope: async () => 'user',
        logInfo: () => {},
      });

      expect(existsSync(join(tmpDir, '.cursor', 'rules', 'agent-guidelines.mdc'))).to.be.true;
      expect(existsSync(join(tmpDir, '.cursor', 'rules', 'sub-agent-protocol.mdc'))).to.be.true;
    });

    it('logs the user-level directory path', async () => {
      writeFileSync(join(tmpDir, 'sfdx-project.json'), '{}');
      const logged: string[] = [];

      await setupCursor({
        cwd: tmpDir,
        profiles: [developerProfile],
        writer: makeWriter(),
        isSalesforceProject: true,
        promptScope: async () => 'user',
        logInfo: (msg) => logged.push(msg),
      });

      expect(logged.some((m) => m.includes('.cursor/rules'))).to.be.true;
    });
  });

  describe('skills', () => {
    it('generates sf-deploy skill for developer profile', async () => {
      await setupCursor({
        cwd: tmpDir,
        profiles: [developerProfile],
        writer: makeWriter(),
        isSalesforceProject: false,
        promptScope: async () => 'project',
        logInfo: () => {},
      });

      expect(existsSync(join(tmpDir, '.cursor', 'skills', 'sf-deploy', 'SKILL.md'))).to.be.true;
    });

    it('generates story-mapping skill for ba profile', async () => {
      await setupCursor({
        cwd: tmpDir,
        profiles: [baProfile],
        writer: makeWriter(),
        isSalesforceProject: false,
        promptScope: async () => 'project',
        logInfo: () => {},
      });

      expect(existsSync(join(tmpDir, '.cursor', 'skills', 'story-mapping', 'SKILL.md'))).to.be.true;
      expect(existsSync(join(tmpDir, '.cursor', 'skills', 'story-mapping', 'scripts', 'render-pdf.sh'))).to.be.true;
      expect(existsSync(join(tmpDir, '.cursor', 'skills', 'story-mapping', 'assets', 'mermaid-pdf.css'))).to.be.true;
    });

    it('does NOT generate story-mapping skill for profiles that do not need it', async () => {
      await setupCursor({
        cwd: tmpDir,
        profiles: [qaProfile],
        writer: makeWriter(),
        isSalesforceProject: false,
        promptScope: async () => 'project',
        logInfo: () => {},
      });

      expect(existsSync(join(tmpDir, '.cursor', 'skills', 'story-mapping'))).to.be.false;
    });

    it('does NOT generate sf-deploy skill for profiles that do not need it', async () => {
      await setupCursor({
        cwd: tmpDir,
        profiles: [qaProfile],
        writer: makeWriter(),
        isSalesforceProject: false,
        promptScope: async () => 'project',
        logInfo: () => {},
      });

      expect(existsSync(join(tmpDir, '.cursor', 'skills', 'sf-deploy'))).to.be.false;
    });
  });
});
