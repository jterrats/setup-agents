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
import { mkdtempSync, rmSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Config } from '@oclif/core';
import { TestContext } from '@salesforce/core/testSetup';
import { expect } from 'chai';
import type sinon from 'sinon';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import Update from '../../../src/commands/setup-agents/update.js';
import { PLUGIN_VERSION } from '../../../src/version.js';

describe('setup-agents update', () => {
  const $$ = new TestContext();
  let sfCommandStubs: ReturnType<typeof stubSfCommandUx>;
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(() => {
    sfCommandStubs = stubSfCommandUx($$.SANDBOX);
    tmpDir = mkdtempSync(join(tmpdir(), 'setup-agents-update-test-'));
    originalCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tmpDir, { recursive: true, force: true });
    $$.restore();
  });

  it('reports nothing to update when all files have current version', async () => {
    const rulesDir = join(tmpDir, '.cursor', 'rules');
    mkdirSync(rulesDir, { recursive: true });
    writeFileSync(
      join(rulesDir, 'agent-guidelines.mdc'),
      `---\npluginVersion: "${PLUGIN_VERSION}"\n---\n# Agent Guidelines\n`
    );

    const result = await Update.run(['--yes']);

    expect(result.updated).to.be.empty;
  });

  it('detects stale .mdc files with old pluginVersion', async () => {
    const rulesDir = join(tmpDir, '.cursor', 'rules');
    mkdirSync(rulesDir, { recursive: true });
    writeFileSync(join(rulesDir, 'agent-guidelines.mdc'), '---\npluginVersion: "0.0.1"\n---\n# Agent Guidelines\n');

    const result = await Update.run(['--dry-run']);

    expect(result.updated).to.have.lengthOf(1);
    expect(result.updated[0]).to.include('agent-guidelines.mdc');
  });

  it('detects stale AGENTS.md with old setup-agents comment', async () => {
    writeFileSync(join(tmpDir, 'AGENTS.md'), '# Agent Guidelines\n<!-- setup-agents: 0.0.1 -->\n');

    const result = await Update.run(['--dry-run']);

    expect(result.updated).to.have.lengthOf(1);
  });

  it('detects stale CLAUDE.md with old setup-agents comment', async () => {
    writeFileSync(join(tmpDir, 'CLAUDE.md'), '# CLAUDE.md\n<!-- setup-agents: 0.0.1 -->\n');

    const result = await Update.run(['--dry-run']);

    expect(result.updated).to.have.lengthOf(1);
  });

  it('detects stale copilot-instructions.md', async () => {
    const githubDir = join(tmpDir, '.github');
    mkdirSync(githubDir, { recursive: true });
    writeFileSync(join(githubDir, 'copilot-instructions.md'), '# Instructions\n<!-- setup-agents: 0.0.1 -->\n');

    const result = await Update.run(['--dry-run']);

    expect(result.updated).to.have.lengthOf(1);
  });

  it('detects stale .a4drules files', async () => {
    const a4dDir = join(tmpDir, '.a4drules');
    mkdirSync(a4dDir, { recursive: true });
    writeFileSync(join(a4dDir, '00-base-guidelines.md'), '<!-- setup-agents: 0.0.1 -->\n# Base Guidelines\n');

    const result = await Update.run(['--dry-run']);

    expect(result.updated).to.have.lengthOf(1);
  });

  it('detects stale files inside .a4drules/workflows/', async () => {
    const workflowsDir = join(tmpDir, '.a4drules', 'workflows');
    mkdirSync(workflowsDir, { recursive: true });
    writeFileSync(join(workflowsDir, 'deploy.md'), '<!-- setup-agents: 0.0.1 -->\n# Deploy\n');

    const result = await Update.run(['--dry-run']);

    expect(result.updated).to.have.lengthOf(1);
    expect(result.updated[0]).to.include('deploy.md');
  });

  it('detects stale files in both .a4drules/ and .a4drules/workflows/', async () => {
    const a4dDir = join(tmpDir, '.a4drules');
    const workflowsDir = join(a4dDir, 'workflows');
    mkdirSync(workflowsDir, { recursive: true });
    writeFileSync(join(a4dDir, '00-base-guidelines.md'), '<!-- setup-agents: 0.0.1 -->\n# Base\n');
    writeFileSync(join(workflowsDir, 'deploy.md'), '<!-- setup-agents: 0.0.1 -->\n# Deploy\n');

    const result = await Update.run(['--dry-run']);

    expect(result.updated).to.have.lengthOf(2);
  });

  it('does not flag up-to-date workflow files as stale', async () => {
    const workflowsDir = join(tmpDir, '.a4drules', 'workflows');
    mkdirSync(workflowsDir, { recursive: true });
    writeFileSync(join(workflowsDir, 'deploy.md'), `<!-- setup-agents: ${PLUGIN_VERSION} -->\n# Deploy\n`);

    const result = await Update.run(['--dry-run']);

    expect(result.updated).to.be.empty;
  });

  it('returns stale files in dry-run result without executing update', async () => {
    writeFileSync(join(tmpDir, 'AGENTS.md'), '# Agent Guidelines\n<!-- setup-agents: 0.0.1 -->\n');

    const result = await Update.run(['--dry-run']);

    expect(result.updated).to.have.lengthOf(1);
    expect(result.skipped).to.be.empty;
  });

  it('logs nothing-to-update message when all files are current', async () => {
    const result = await Update.run(['--yes']);

    const logCalls = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(logCalls).to.include(PLUGIN_VERSION);
    expect(result.updated).to.be.empty;
  });

  it('reports dry-run results without modifying files', async () => {
    const rulesDir = join(tmpDir, '.cursor', 'rules');
    mkdirSync(rulesDir, { recursive: true });
    writeFileSync(join(rulesDir, 'developer-standards.mdc'), '---\npluginVersion: "0.0.1"\n---\n# Dev\n');

    const result = await Update.run(['--dry-run']);

    expect(result.updated).to.have.lengthOf(1);
    expect(existsSync(join(rulesDir, 'developer-standards.mdc'))).to.be.true;
  });

  describe('--yes flag (actual execution)', () => {
    let runCommandStub: sinon.SinonStub;

    beforeEach(() => {
      runCommandStub = $$.SANDBOX.stub(Config.prototype, 'runCommand').resolves(undefined);
    });

    it('calls runCommand for each stale tool when --yes is provided', async () => {
      const rulesDir = join(tmpDir, '.cursor', 'rules');
      mkdirSync(rulesDir, { recursive: true });
      writeFileSync(join(rulesDir, 'agent-guidelines.mdc'), '---\npluginVersion: "0.0.1"\n---\n# Agent\n');

      await Update.run(['--yes']);

      expect(runCommandStub.calledOnce).to.be.true;
    });

    it('passes --rules cursor when a cursor .mdc file is stale', async () => {
      const rulesDir = join(tmpDir, '.cursor', 'rules');
      mkdirSync(rulesDir, { recursive: true });
      writeFileSync(join(rulesDir, 'agent-guidelines.mdc'), '---\npluginVersion: "0.0.1"\n---\n# Agent\n');

      await Update.run(['--yes']);

      const callArgs = runCommandStub.firstCall.args as [string, string[]];
      expect(callArgs[0]).to.equal('setup-agents:local');
      expect(callArgs[1]).to.include('--rules');
      expect(callArgs[1]).to.include('cursor');
    });

    it('passes --force in the runCommand args', async () => {
      writeFileSync(join(tmpDir, 'AGENTS.md'), '<!-- setup-agents: 0.0.1 -->\n# Agents\n');

      await Update.run(['--yes']);

      const callArgs = runCommandStub.firstCall.args as [string, string[]];
      expect(callArgs[1]).to.include('--force');
    });

    it('returns updated files list after --yes execution', async () => {
      writeFileSync(join(tmpDir, 'AGENTS.md'), '<!-- setup-agents: 0.0.1 -->\n# Agents\n');

      const result = await Update.run(['--yes']);

      expect(result.updated).to.have.lengthOf(1);
      expect(result.updated[0]).to.include('AGENTS.md');
    });

    it('calls runCommand once per unique stale tool', async () => {
      const rulesDir = join(tmpDir, '.cursor', 'rules');
      mkdirSync(rulesDir, { recursive: true });
      writeFileSync(join(rulesDir, 'agent-guidelines.mdc'), '---\npluginVersion: "0.0.1"\n---\n');
      writeFileSync(join(rulesDir, 'developer-standards.mdc'), '---\npluginVersion: "0.0.1"\n---\n');
      writeFileSync(join(tmpDir, 'AGENTS.md'), '<!-- setup-agents: 0.0.1 -->\n');

      await Update.run(['--yes']);

      // cursor + codex = 2 distinct tools → 2 runCommand calls
      expect(runCommandStub.callCount).to.equal(2);
    });

    it('does not call runCommand when there are no stale files', async () => {
      const rulesDir = join(tmpDir, '.cursor', 'rules');
      mkdirSync(rulesDir, { recursive: true });
      writeFileSync(join(rulesDir, 'agent-guidelines.mdc'), `---\npluginVersion: "${PLUGIN_VERSION}"\n---\n# Agent\n`);

      await Update.run(['--yes']);

      expect(runCommandStub.called).to.be.false;
    });
  });

  describe('non-TTY auto-update (GAP-U-08)', () => {
    let runCommandStub: sinon.SinonStub;
    let originalIsTTY: boolean | undefined;

    beforeEach(() => {
      runCommandStub = $$.SANDBOX.stub(Config.prototype, 'runCommand').resolves(undefined);
      originalIsTTY = process.stdin.isTTY;
      (process.stdin as { isTTY: boolean | undefined }).isTTY = false;
    });

    afterEach(() => {
      (process.stdin as { isTTY: boolean | undefined }).isTTY = originalIsTTY;
    });

    it('auto-updates without --yes in non-TTY mode when stale files exist', async () => {
      writeFileSync(join(tmpDir, 'AGENTS.md'), '<!-- setup-agents: 0.0.1 -->\n# Agents\n');

      const result = await Update.run([]);

      expect(runCommandStub.calledOnce).to.be.true;
      expect(result.updated).to.have.lengthOf(1);
    });

    it('does not prompt for confirmation in non-TTY mode', async () => {
      writeFileSync(join(tmpDir, 'AGENTS.md'), '<!-- setup-agents: 0.0.1 -->\n# Agents\n');

      // Should complete without hanging on a TTY prompt
      await Update.run([]);

      expect(runCommandStub.called).to.be.true;
    });

    it('skips runCommand in non-TTY mode when no stale files exist', async () => {
      writeFileSync(join(tmpDir, 'AGENTS.md'), `<!-- setup-agents: ${PLUGIN_VERSION} -->\n# Agents\n`);

      await Update.run([]);

      expect(runCommandStub.called).to.be.false;
    });
  });
});
