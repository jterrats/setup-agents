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
import { mkdtempSync, readdirSync, rmSync, existsSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TestContext } from '@salesforce/core/testSetup';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import Local from '../../../src/commands/setup-agents/local.js';
import { PLUGIN_VERSION } from '../../../src/version.js';

describe('setup-agents local', () => {
  const $$ = new TestContext();
  let sfCommandStubs: ReturnType<typeof stubSfCommandUx>;
  let tmpDir: string;
  let originalCwd: string;
  let originalIsTTY: boolean | undefined;

  beforeEach(() => {
    sfCommandStubs = stubSfCommandUx($$.SANDBOX);
    tmpDir = mkdtempSync(join(tmpdir(), 'setup-agents-test-'));
    originalCwd = process.cwd();
    process.chdir(tmpDir);
    // Force non-interactive mode so resolveProfiles never opens a prompt.
    // Tests that need a specific profile pass --profile explicitly.
    originalIsTTY = process.stdin.isTTY;
    (process.stdin as { isTTY: boolean | undefined }).isTTY = false;
  });

  afterEach(() => {
    process.chdir(originalCwd);
    (process.stdin as { isTTY: boolean | undefined }).isTTY = originalIsTTY;
    rmSync(tmpDir, { recursive: true, force: true });
    $$.restore();
  });

  it('creates cursor rules file when --rules cursor is provided', async () => {
    await Local.run(['--rules', 'cursor']);

    expect(existsSync(join(tmpDir, '.cursor', 'rules', 'agent-guidelines.mdc'))).to.be.true;
  });

  it('creates copilot instructions file when --rules vscode is provided', async () => {
    await Local.run(['--rules', 'vscode']);

    expect(existsSync(join(tmpDir, '.github', 'copilot-instructions.md'))).to.be.true;
  });

  it('creates AGENTS.md when --rules codex is provided', async () => {
    await Local.run(['--rules', 'codex']);

    expect(existsSync(join(tmpDir, 'AGENTS.md'))).to.be.true;
  });

  it('creates CLAUDE.md when --rules claude is provided', async () => {
    await Local.run(['--rules', 'claude']);

    expect(existsSync(join(tmpDir, 'CLAUDE.md'))).to.be.true;
  });

  it('returns configured tools including claude', async () => {
    const result = await Local.run(['--rules', 'claude']);

    expect(result.configured).to.deep.equal(['claude']);
  });

  it('returns configured tools in result', async () => {
    const result = await Local.run(['--rules', 'cursor']);

    expect(result.configured).to.deep.equal(['cursor']);
  });

  it('warns when file already exists and does not overwrite it', async () => {
    await Local.run(['--rules', 'codex']);
    await Local.run(['--rules', 'codex']);

    const warnCalls = sfCommandStubs.warn
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(warnCalls).to.include('AGENTS.md');
  });

  it('configures all tools when no --rules flag is provided and no tools are detected', async () => {
    const result = await Local.run([]);

    expect(result.configured).to.include('cursor');
    expect(result.configured).to.include('vscode');
    expect(result.configured).to.include('codex');
    expect(result.configured).to.include('claude');
  });

  describe('tool auto-detection', () => {
    it('auto-detects vscode when .vscode/ directory exists', async () => {
      mkdirSync(join(tmpDir, '.vscode'));

      const result = await Local.run([]);

      expect(result.configured).to.include('vscode');
      expect(result.configured).to.not.include('cursor');
      expect(result.configured).to.not.include('codex');
      expect(existsSync(join(tmpDir, '.github', 'copilot-instructions.md'))).to.be.true;
    });

    it('auto-detects cursor when .cursor/ directory exists', async () => {
      mkdirSync(join(tmpDir, '.cursor'), { recursive: true });

      const result = await Local.run([]);

      expect(result.configured).to.include('cursor');
      expect(result.configured).to.not.include('vscode');
      expect(result.configured).to.not.include('codex');
      expect(existsSync(join(tmpDir, '.cursor', 'rules', 'agent-guidelines.mdc'))).to.be.true;
    });

    it('auto-detects both cursor and vscode when both directories exist', async () => {
      mkdirSync(join(tmpDir, '.cursor'), { recursive: true });
      mkdirSync(join(tmpDir, '.vscode'));

      const result = await Local.run([]);

      expect(result.configured).to.include('cursor');
      expect(result.configured).to.include('vscode');
      expect(result.configured).to.not.include('codex');
    });

    it('auto-detects claude when CLAUDE.md exists', async () => {
      writeFileSync(join(tmpDir, 'CLAUDE.md'), '# CLAUDE.md');

      const result = await Local.run([]);

      expect(result.configured).to.include('claude');
    });
  });

  describe('--force flag', () => {
    it('overwrites existing files when --force is provided', async () => {
      await Local.run(['--rules', 'codex']);
      writeFileSync(join(tmpDir, 'AGENTS.md'), 'old content');

      await Local.run(['--rules', 'codex', '--force']);

      const content = readFileSync(join(tmpDir, 'AGENTS.md'), 'utf8');
      expect(content).to.not.equal('old content');
    });

    it('does not warn about existing files when --force is provided', async () => {
      await Local.run(['--rules', 'codex']);

      sfCommandStubs.warn.resetHistory();

      await Local.run(['--rules', 'codex', '--force']);

      const warnCalls = sfCommandStubs.warn
        .getCalls()
        .flatMap((c) => c.args)
        .join('\n');
      expect(warnCalls).to.not.include('AGENTS.md');
    });
  });

  describe('version embedding', () => {
    it('embeds pluginVersion in agent-guidelines.mdc frontmatter', async () => {
      await Local.run(['--rules', 'cursor']);

      const content = readFileSync(join(tmpDir, '.cursor', 'rules', 'agent-guidelines.mdc'), 'utf8');
      expect(content).to.include(`pluginVersion: "${PLUGIN_VERSION}"`);
    });

    it('embeds setup-agents comment in AGENTS.md', async () => {
      await Local.run(['--rules', 'codex']);

      const content = readFileSync(join(tmpDir, 'AGENTS.md'), 'utf8');
      expect(content).to.include(`<!-- setup-agents: ${PLUGIN_VERSION} -->`);
    });

    it('embeds setup-agents comment in copilot-instructions.md', async () => {
      await Local.run(['--rules', 'vscode']);

      const content = readFileSync(join(tmpDir, '.github', 'copilot-instructions.md'), 'utf8');
      expect(content).to.include(`<!-- setup-agents: ${PLUGIN_VERSION} -->`);
    });

    it('embeds setup-agents comment in CLAUDE.md', async () => {
      await Local.run(['--rules', 'claude']);

      const content = readFileSync(join(tmpDir, 'CLAUDE.md'), 'utf8');
      expect(content).to.include(`<!-- setup-agents: ${PLUGIN_VERSION} -->`);
    });
  });

  describe('profile-aware content', () => {
    it('injects developer profile content into AGENTS.md', async () => {
      await Local.run(['--rules', 'codex', '--profile', 'developer']);

      const content = readFileSync(join(tmpDir, 'AGENTS.md'), 'utf8');
      expect(content).to.include('Developer');
    });

    it('injects developer profile content into CLAUDE.md', async () => {
      await Local.run(['--rules', 'claude', '--profile', 'developer']);

      const content = readFileSync(join(tmpDir, 'CLAUDE.md'), 'utf8');
      expect(content).to.include('Developer');
    });

    it('injects multiple profile sections into copilot-instructions.md', async () => {
      await Local.run(['--rules', 'vscode', '--profile', 'developer,qa']);

      const content = readFileSync(join(tmpDir, '.github', 'copilot-instructions.md'), 'utf8');
      expect(content).to.include('---');
    });
  });

  describe('agentforce tool', () => {
    it('creates .a4drules/ directory when --rules agentforce is provided', async () => {
      await Local.run(['--rules', 'agentforce']);

      expect(existsSync(join(tmpDir, '.a4drules'))).to.be.true;
    });

    it('creates 00-base-guidelines.md in .a4drules/', async () => {
      await Local.run(['--rules', 'agentforce']);

      expect(existsSync(join(tmpDir, '.a4drules', '00-base-guidelines.md'))).to.be.true;
    });

    it('creates salesforce-standards.md for Salesforce projects', async () => {
      writeFileSync(join(tmpDir, 'sfdx-project.json'), JSON.stringify({ sourceApiVersion: '62.0' }));

      await Local.run(['--rules', 'agentforce']);

      expect(existsSync(join(tmpDir, '.a4drules', '01-salesforce-standards.md'))).to.be.true;
    });

    it('creates numbered profile files in .a4drules/', async () => {
      await Local.run(['--rules', 'agentforce', '--profile', 'developer']);

      expect(existsSync(join(tmpDir, '.a4drules', '02-developer-standards.md'))).to.be.true;
    });

    it('creates 99-sub-agent-protocol.md in .a4drules/', async () => {
      await Local.run(['--rules', 'agentforce', '--profile', 'developer']);

      expect(existsSync(join(tmpDir, '.a4drules', '99-sub-agent-protocol.md'))).to.be.true;
    });

    it('embeds setup-agents version comment in .a4drules files', async () => {
      await Local.run(['--rules', 'agentforce']);

      const content = readFileSync(join(tmpDir, '.a4drules', '00-base-guidelines.md'), 'utf8');
      expect(content).to.include(`<!-- setup-agents: ${PLUGIN_VERSION} -->`);
    });

    it('strips .mdc frontmatter from profile content in .a4drules files', async () => {
      await Local.run(['--rules', 'agentforce', '--profile', 'developer']);

      const content = readFileSync(join(tmpDir, '.a4drules', '02-developer-standards.md'), 'utf8');
      expect(content).to.not.match(/^---\n/);
    });

    it('detects existing .a4drules directory and includes agentforce in configured tools', async () => {
      mkdirSync(join(tmpDir, '.a4drules'));

      const result = await Local.run([]);

      expect(result.configured).to.include('agentforce');
    });

    it('creates .a4drules/workflows/ with base workflows for Salesforce project', async () => {
      writeFileSync(join(tmpDir, 'sfdx-project.json'), JSON.stringify({ sourceApiVersion: '62.0' }));

      await Local.run(['--rules', 'agentforce', '--profile', 'developer']);

      expect(existsSync(join(tmpDir, '.a4drules', 'workflows', 'deploy.md'))).to.be.true;
      expect(existsSync(join(tmpDir, '.a4drules', 'workflows', 'run-tests.md'))).to.be.true;
      expect(existsSync(join(tmpDir, '.a4drules', 'workflows', 'validate.md'))).to.be.true;
    });

    it('creates developer-specific workflows when developer profile is active', async () => {
      writeFileSync(join(tmpDir, 'sfdx-project.json'), JSON.stringify({ sourceApiVersion: '62.0' }));
      await Local.run(['--rules', 'agentforce', '--profile', 'developer']);

      expect(existsSync(join(tmpDir, '.a4drules', 'workflows', 'create-apex-class.md'))).to.be.true;
      expect(existsSync(join(tmpDir, '.a4drules', 'workflows', 'create-lwc.md'))).to.be.true;
      expect(existsSync(join(tmpDir, '.a4drules', 'workflows', 'create-trigger.md'))).to.be.true;
    });

    it('creates devops-specific workflows when devops profile is active', async () => {
      writeFileSync(join(tmpDir, 'sfdx-project.json'), JSON.stringify({ sourceApiVersion: '62.0' }));
      await Local.run(['--rules', 'agentforce', '--profile', 'devops']);

      expect(existsSync(join(tmpDir, '.a4drules', 'workflows', 'release.md'))).to.be.true;
      expect(existsSync(join(tmpDir, '.a4drules', 'workflows', 'create-scratch-org.md'))).to.be.true;
    });

    it('creates qa-specific workflows when qa profile is active', async () => {
      writeFileSync(join(tmpDir, 'sfdx-project.json'), JSON.stringify({ sourceApiVersion: '62.0' }));
      await Local.run(['--rules', 'agentforce', '--profile', 'qa']);

      expect(existsSync(join(tmpDir, '.a4drules', 'workflows', 'run-playwright.md'))).to.be.true;
    });

    it('creates crma-specific workflows when crma profile is active', async () => {
      writeFileSync(join(tmpDir, 'sfdx-project.json'), JSON.stringify({ sourceApiVersion: '62.0' }));
      await Local.run(['--rules', 'agentforce', '--profile', 'crma']);

      expect(existsSync(join(tmpDir, '.a4drules', 'workflows', 'deploy-analytics.md'))).to.be.true;
    });
  });

  describe('--profile flag', () => {
    it('creates developer-standards.mdc when --profile developer is provided', async () => {
      await Local.run(['--rules', 'cursor', '--profile', 'developer']);

      expect(existsSync(join(tmpDir, '.cursor', 'rules', 'developer-standards.mdc'))).to.be.true;
    });

    it('creates architect-standards.mdc when --profile architect is provided', async () => {
      await Local.run(['--rules', 'cursor', '--profile', 'architect']);

      expect(existsSync(join(tmpDir, '.cursor', 'rules', 'architect-standards.mdc'))).to.be.true;
    });

    it('creates multiple profile rule files when comma-separated profiles are provided', async () => {
      await Local.run(['--rules', 'cursor', '--profile', 'developer,qa']);

      expect(existsSync(join(tmpDir, '.cursor', 'rules', 'developer-standards.mdc'))).to.be.true;
      expect(existsSync(join(tmpDir, '.cursor', 'rules', 'qa-standards.mdc'))).to.be.true;
    });

    it('returns profile ids in result', async () => {
      const result = await Local.run(['--rules', 'cursor', '--profile', 'developer,architect']);

      expect(result.profiles).to.include('developer');
      expect(result.profiles).to.include('architect');
    });

    it('uses developer as default profile in non-TTY and warns the user', async () => {
      await Local.run(['--rules', 'cursor']);

      const warnCalls = sfCommandStubs.warn
        .getCalls()
        .flatMap((c) => c.args)
        .join('\n');
      expect(warnCalls).to.include('developer');
    });

    it('creates cgcloud-standards.mdc when cgcloud profile is selected', async () => {
      await Local.run(['--rules', 'cursor', '--profile', 'cgcloud']);

      expect(existsSync(join(tmpDir, '.cursor', 'rules', 'cgcloud-standards.mdc'))).to.be.true;
    });

    it('auto-detects cgcloud profile from package.xml containing cgcloud__ namespace', async () => {
      writeFileSync(
        join(tmpDir, 'package.xml'),
        '<?xml version="1.0"?><Package><types><members>cgcloud__PromotionType__c</members></types></Package>'
      );
      writeFileSync(join(tmpDir, 'sfdx-project.json'), JSON.stringify({ sourceApiVersion: '62.0' }));

      await Local.run(['--rules', 'cursor', '--profile', 'cgcloud']);

      expect(existsSync(join(tmpDir, '.cursor', 'rules', 'cgcloud-standards.mdc'))).to.be.true;
    });

    it('creates extensions.json with profile extensions for Salesforce project with vscode', async () => {
      writeFileSync(join(tmpDir, 'sfdx-project.json'), JSON.stringify({ sourceApiVersion: '62.0' }));
      mkdirSync(join(tmpDir, '.vscode'));

      await Local.run(['--rules', 'vscode', '--profile', 'devops']);

      expect(existsSync(join(tmpDir, '.vscode', 'extensions.json'))).to.be.true;
    });

    it('creates analytics-standards.mdc when --profile crma is provided', async () => {
      await Local.run(['--rules', 'cursor', '--profile', 'crma']);

      expect(existsSync(join(tmpDir, '.cursor', 'rules', 'analytics-standards.mdc'))).to.be.true;
    });

    it('creates data360-standards.mdc when --profile data360 is provided', async () => {
      await Local.run(['--rules', 'cursor', '--profile', 'data360']);

      expect(existsSync(join(tmpDir, '.cursor', 'rules', 'data360-standards.mdc'))).to.be.true;
    });

    it('auto-detects crma profile from package.xml containing WaveDashboard', async () => {
      writeFileSync(
        join(tmpDir, 'package.xml'),
        '<?xml version="1.0"?><Package><types><members>SalesDashboard</members><name>WaveDashboard</name></types></Package>'
      );

      await Local.run(['--rules', 'cursor', '--profile', 'crma']);

      expect(existsSync(join(tmpDir, '.cursor', 'rules', 'analytics-standards.mdc'))).to.be.true;
    });

    it('auto-detects data360 profile from package.xml containing DataStream', async () => {
      writeFileSync(
        join(tmpDir, 'package.xml'),
        '<?xml version="1.0"?><Package><types><members>ContactsStream</members><name>DataStream</name></types></Package>'
      );

      await Local.run(['--rules', 'cursor', '--profile', 'data360']);

      expect(existsSync(join(tmpDir, '.cursor', 'rules', 'data360-standards.mdc'))).to.be.true;
    });
  });

  describe('sub-agent-protocol.mdc', () => {
    it('always generates sub-agent-protocol.mdc when configuring cursor', async () => {
      await Local.run(['--rules', 'cursor', '--profile', 'developer']);

      expect(existsSync(join(tmpDir, '.cursor', 'rules', 'sub-agent-protocol.mdc'))).to.be.true;
    });

    it('includes active profiles in sub-agent-protocol.mdc content', async () => {
      await Local.run(['--rules', 'cursor', '--profile', 'developer,crma']);

      const content = readFileSync(join(tmpDir, '.cursor', 'rules', 'sub-agent-protocol.mdc'), 'utf8');
      expect(content).to.include('developer-standards.mdc');
      expect(content).to.include('analytics-standards.mdc');
    });

    it('includes task routing for all active profiles', async () => {
      await Local.run(['--rules', 'cursor', '--profile', 'developer,data360,qa']);

      const content = readFileSync(join(tmpDir, '.cursor', 'rules', 'sub-agent-protocol.mdc'), 'utf8');
      expect(content).to.include('developer-standards.mdc');
      expect(content).to.include('data360-standards.mdc');
      expect(content).to.include('qa-standards.mdc');
    });

    it('skips sub-agent-protocol.mdc if it already exists (without --force)', async () => {
      mkdirSync(join(tmpDir, '.cursor', 'rules'), { recursive: true });
      writeFileSync(join(tmpDir, '.cursor', 'rules', 'sub-agent-protocol.mdc'), 'existing content');

      await Local.run(['--rules', 'cursor', '--profile', 'developer']);

      const content = readFileSync(join(tmpDir, '.cursor', 'rules', 'sub-agent-protocol.mdc'), 'utf8');
      expect(content).to.equal('existing content');
    });

    it('overwrites sub-agent-protocol.mdc when --force is provided', async () => {
      mkdirSync(join(tmpDir, '.cursor', 'rules'), { recursive: true });
      writeFileSync(join(tmpDir, '.cursor', 'rules', 'sub-agent-protocol.mdc'), 'existing content');

      await Local.run(['--rules', 'cursor', '--profile', 'developer', '--force']);

      const content = readFileSync(join(tmpDir, '.cursor', 'rules', 'sub-agent-protocol.mdc'), 'utf8');
      expect(content).to.not.equal('existing content');
    });

    it('embeds pluginVersion in sub-agent-protocol.mdc frontmatter', async () => {
      await Local.run(['--rules', 'cursor', '--profile', 'developer']);

      const content = readFileSync(join(tmpDir, '.cursor', 'rules', 'sub-agent-protocol.mdc'), 'utf8');
      expect(content).to.include(`pluginVersion: "${PLUGIN_VERSION}"`);
    });
  });

  describe('unknown --profile warning (GAP-L-02)', () => {
    it('emits a warning when an unknown profile id is provided', async () => {
      await Local.run(['--rules', 'cursor', '--profile', 'totally-wrong']);

      const warnCalls = sfCommandStubs.warn
        .getCalls()
        .flatMap((c) => c.args)
        .join('\n');
      expect(warnCalls).to.include('totally-wrong');
    });

    it('still runs with valid profiles when mixed with an invalid one', async () => {
      await Local.run(['--rules', 'cursor', '--profile', 'developer,bad-profile']);

      expect(existsSync(join(tmpDir, '.cursor', 'rules', 'developer-standards.mdc'))).to.be.true;
      const warnCalls = sfCommandStubs.warn
        .getCalls()
        .flatMap((c) => c.args)
        .join('\n');
      expect(warnCalls).to.include('bad-profile');
    });
  });

  describe('vscode non-Salesforce project (GAP-V-01)', () => {
    it('does NOT create extensions.json for a non-Salesforce project', async () => {
      await Local.run(['--rules', 'vscode', '--profile', 'developer']);

      expect(existsSync(join(tmpDir, '.vscode', 'extensions.json'))).to.be.false;
    });

    it('still creates copilot-instructions.md for a non-Salesforce project', async () => {
      await Local.run(['--rules', 'vscode', '--profile', 'developer']);

      expect(existsSync(join(tmpDir, '.github', 'copilot-instructions.md'))).to.be.true;
    });
  });

  describe('agentforce — profiles without workflows() (GAP-A-01)', () => {
    beforeEach(() => {
      // Create sfdx-project.json so Salesforce-specific files are generated
      writeFileSync(join(tmpDir, 'sfdx-project.json'), '{"packageDirectories":[]}');
    });

    it('does not create profile-specific workflow files for ba profile', async () => {
      await Local.run(['--rules', 'agentforce', '--profile', 'ba']);

      const workflowsDir = join(tmpDir, '.a4drules', 'workflows');
      const baseFiles = ['deploy.md', 'run-tests.md', 'validate.md', 'code-quality.md'];
      const allFiles = existsSync(workflowsDir) ? readdirSync(workflowsDir) : [];
      const nonBaseFiles = allFiles.filter((f) => !baseFiles.includes(f));
      expect(nonBaseFiles).to.be.empty;
    });

    it('does not create profile-specific workflow files for mulesoft profile', async () => {
      await Local.run(['--rules', 'agentforce', '--profile', 'mulesoft']);

      const workflowsDir = join(tmpDir, '.a4drules', 'workflows');
      const baseFiles = ['deploy.md', 'run-tests.md', 'validate.md', 'code-quality.md'];
      const allFiles = existsSync(workflowsDir) ? readdirSync(workflowsDir) : [];
      const nonBaseFiles = allFiles.filter((f) => !baseFiles.includes(f));
      expect(nonBaseFiles).to.be.empty;
    });

    it('does not create profile-specific workflow files for ux profile', async () => {
      await Local.run(['--rules', 'agentforce', '--profile', 'ux']);

      const workflowsDir = join(tmpDir, '.a4drules', 'workflows');
      const baseFiles = ['deploy.md', 'run-tests.md', 'validate.md', 'code-quality.md'];
      const allFiles = existsSync(workflowsDir) ? readdirSync(workflowsDir) : [];
      const nonBaseFiles = allFiles.filter((f) => !baseFiles.includes(f));
      expect(nonBaseFiles).to.be.empty;
    });
  });

  describe('agentforce — non-Salesforce project (GAP-A-02)', () => {
    it('does NOT create 01-salesforce-standards.md for non-Salesforce project', async () => {
      await Local.run(['--rules', 'agentforce', '--profile', 'developer']);

      expect(existsSync(join(tmpDir, '.a4drules', '01-salesforce-standards.md'))).to.be.false;
    });

    it('does NOT create the workflows/ directory for non-Salesforce project', async () => {
      await Local.run(['--rules', 'agentforce', '--profile', 'developer']);

      expect(existsSync(join(tmpDir, '.a4drules', 'workflows'))).to.be.false;
    });

    it('still creates 00-base-guidelines.md for non-Salesforce project', async () => {
      await Local.run(['--rules', 'agentforce', '--profile', 'developer']);

      expect(existsSync(join(tmpDir, '.a4drules', '00-base-guidelines.md'))).to.be.true;
    });

    it('still creates profile rule files for non-Salesforce project', async () => {
      await Local.run(['--rules', 'agentforce', '--profile', 'developer']);

      expect(existsSync(join(tmpDir, '.a4drules', '02-developer-standards.md'))).to.be.true;
    });
  });
});
