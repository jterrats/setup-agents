/*
 * Copyright 2026, Salesforce, Inc.
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
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect } from 'chai';
import { FileWriter } from '../../../src/services/file-writer.js';
import { setupCursor } from '../../../src/setup/cursor-setup.js';
import { developerProfile } from '../../../src/profiles/developer.js';

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
        printToConsole: () => {},
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
        printToConsole: () => {},
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
        printToConsole: () => {},
      });

      expect(existsSync(join(tmpDir, '.cursor', 'rules', developerProfile.ruleFile))).to.be.true;
    });
  });

  describe('scope: user', () => {
    it('does NOT write salesforce-standards.mdc to disk', async () => {
      writeFileSync(join(tmpDir, 'sfdx-project.json'), '{}');

      await setupCursor({
        cwd: tmpDir,
        profiles: [developerProfile],
        writer: makeWriter(),
        isSalesforceProject: true,
        promptScope: async () => 'user',
        printToConsole: () => {},
      });

      expect(existsSync(join(tmpDir, '.cursor', 'rules', 'salesforce-standards.mdc'))).to.be.false;
    });

    it('does NOT write profile rule file to disk', async () => {
      writeFileSync(join(tmpDir, 'sfdx-project.json'), '{}');

      await setupCursor({
        cwd: tmpDir,
        profiles: [developerProfile],
        writer: makeWriter(),
        isSalesforceProject: true,
        promptScope: async () => 'user',
        printToConsole: () => {},
      });

      expect(existsSync(join(tmpDir, '.cursor', 'rules', developerProfile.ruleFile))).to.be.false;
    });

    it('still writes agent-guidelines.mdc and sub-agent-protocol.mdc', async () => {
      writeFileSync(join(tmpDir, 'sfdx-project.json'), '{}');

      await setupCursor({
        cwd: tmpDir,
        profiles: [developerProfile],
        writer: makeWriter(),
        isSalesforceProject: true,
        promptScope: async () => 'user',
        printToConsole: () => {},
      });

      expect(existsSync(join(tmpDir, '.cursor', 'rules', 'agent-guidelines.mdc'))).to.be.true;
      expect(existsSync(join(tmpDir, '.cursor', 'rules', 'sub-agent-protocol.mdc'))).to.be.true;
    });

    it('calls printToConsole with salesforce-standards content', async () => {
      writeFileSync(join(tmpDir, 'sfdx-project.json'), '{}');
      const printed: string[] = [];

      await setupCursor({
        cwd: tmpDir,
        profiles: [developerProfile],
        writer: makeWriter(),
        isSalesforceProject: true,
        promptScope: async () => 'user',
        printToConsole: (content) => printed.push(content),
      });

      expect(printed).to.have.lengthOf(1);
      expect(printed[0]).to.include('Salesforce');
    });

    it('includes profile content in the printToConsole output', async () => {
      writeFileSync(join(tmpDir, 'sfdx-project.json'), '{}');
      const printed: string[] = [];

      await setupCursor({
        cwd: tmpDir,
        profiles: [developerProfile],
        writer: makeWriter(),
        isSalesforceProject: true,
        promptScope: async () => 'user',
        printToConsole: (content) => printed.push(content),
      });

      expect(printed[0]).to.include('Developer');
    });

    it('includes paste instructions in the printToConsole output', async () => {
      writeFileSync(join(tmpDir, 'sfdx-project.json'), '{}');
      const printed: string[] = [];

      await setupCursor({
        cwd: tmpDir,
        profiles: [developerProfile],
        writer: makeWriter(),
        isSalesforceProject: true,
        promptScope: async () => 'user',
        printToConsole: (content) => printed.push(content),
      });

      expect(printed[0]).to.include('Cursor Settings');
    });
  });
});
