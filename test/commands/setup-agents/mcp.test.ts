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
import { mkdtempSync, mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TestContext } from '@salesforce/core/testSetup';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import Mcp from '../../../src/commands/setup-agents/mcp.js';

describe('setup-agents mcp', () => {
  const $$ = new TestContext();
  let sfCommandStubs: ReturnType<typeof stubSfCommandUx>;
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(() => {
    sfCommandStubs = stubSfCommandUx($$.SANDBOX);
    tmpDir = mkdtempSync(join(tmpdir(), 'setup-agents-mcp-test-'));
    originalCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tmpDir, { recursive: true, force: true });
    $$.restore();
  });

  it('creates .cursor/mcp.json with a server entry when --target-org is provided', async () => {
    await Mcp.run(['--target-org', 'myOrg']);

    expect(existsSync(join(tmpDir, '.cursor', 'mcp.json'))).to.be.true;
  });

  it('adds salesforce-<alias> key to mcpServers', async () => {
    await Mcp.run(['--target-org', 'myOrg']);

    const config = JSON.parse(readFileSync(join(tmpDir, '.cursor', 'mcp.json'), 'utf8')) as {
      mcpServers: Record<string, { command: string; args: string[] }>;
    };
    expect(config.mcpServers['salesforce-myOrg']).to.exist;
  });

  it('uses npx @salesforce/mcp@latest as the MCP command', async () => {
    await Mcp.run(['--target-org', 'myOrg']);

    const config = JSON.parse(readFileSync(join(tmpDir, '.cursor', 'mcp.json'), 'utf8')) as {
      mcpServers: Record<string, { command: string; args: string[] }>;
    };
    expect(config.mcpServers['salesforce-myOrg'].command).to.equal('npx');
    expect(config.mcpServers['salesforce-myOrg'].args).to.include('@salesforce/mcp@latest');
  });

  it('passes --orgs flag with the org alias', async () => {
    await Mcp.run(['--target-org', 'myOrg']);

    const config = JSON.parse(readFileSync(join(tmpDir, '.cursor', 'mcp.json'), 'utf8')) as {
      mcpServers: Record<string, { command: string; args: string[] }>;
    };
    const args = config.mcpServers['salesforce-myOrg'].args;
    const orgsIndex = args.indexOf('--orgs');
    expect(orgsIndex).to.be.greaterThan(-1);
    expect(args[orgsIndex + 1]).to.equal('myOrg');
  });

  it('enables all toolsets with --all-toolsets flag', async () => {
    await Mcp.run(['--target-org', 'myOrg', '--all-toolsets']);

    const config = JSON.parse(readFileSync(join(tmpDir, '.cursor', 'mcp.json'), 'utf8')) as {
      mcpServers: Record<string, { command: string; args: string[] }>;
    };
    const args = config.mcpServers['salesforce-myOrg'].args;
    const toolsetsIndex = args.indexOf('--toolsets');
    expect(args[toolsetsIndex + 1]).to.equal('all');
  });

  it('maps developer profile to valid Salesforce MCP toolsets', async () => {
    await Mcp.run(['--target-org', 'myOrg', '--profile', 'developer']);

    const config = JSON.parse(readFileSync(join(tmpDir, '.cursor', 'mcp.json'), 'utf8')) as {
      mcpServers: Record<string, { command: string; args: string[] }>;
    };
    const args = config.mcpServers['salesforce-myOrg'].args;
    const toolsetsIndex = args.indexOf('--toolsets');
    expect(args[toolsetsIndex + 1]).to.equal('metadata,data,testing,users');
  });

  it('merges new org into existing mcp.json without overwriting other servers', async () => {
    await Mcp.run(['--target-org', 'org1']);
    await Mcp.run(['--target-org', 'org2']);

    const config = JSON.parse(readFileSync(join(tmpDir, '.cursor', 'mcp.json'), 'utf8')) as {
      mcpServers: Record<string, unknown>;
    };
    expect(config.mcpServers['salesforce-org1']).to.exist;
    expect(config.mcpServers['salesforce-org2']).to.exist;
  });

  it('returns added server names in result', async () => {
    const result = await Mcp.run(['--target-org', 'myOrg']);

    expect(result.serversAdded).to.deep.equal(['salesforce-myOrg']);
  });

  it('warns and returns empty when no org is provided in non-interactive mode', async () => {
    const result = await Mcp.run([]);

    const warnCalls = sfCommandStubs.warn
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(warnCalls).to.include('org');
    expect(result.serversAdded).to.be.empty;
  });

  describe('corrupt mcp.json handling (GAP-M-04)', () => {
    it('warns when mcp.json contains invalid JSON', async () => {
      const cursorDir = join(tmpDir, '.cursor');
      mkdirSync(cursorDir, { recursive: true });
      writeFileSync(join(cursorDir, 'mcp.json'), 'INVALID JSON {{{');

      await Mcp.run(['--target-org', 'myOrg']);

      const warnCalls = sfCommandStubs.warn
        .getCalls()
        .flatMap((c) => c.args)
        .join('\n');
      expect(warnCalls).to.include('mcp.json');
    });

    it('falls back to empty structure and continues when mcp.json is corrupt', async () => {
      const cursorDir = join(tmpDir, '.cursor');
      mkdirSync(cursorDir, { recursive: true });
      writeFileSync(join(cursorDir, 'mcp.json'), 'INVALID JSON {{{');

      const result = await Mcp.run(['--target-org', 'myOrg']);

      expect(result.serversAdded).to.deep.equal(['salesforce-myOrg']);
    });

    it('overwrites corrupt mcp.json with valid content', async () => {
      const cursorDir = join(tmpDir, '.cursor');
      mkdirSync(cursorDir, { recursive: true });
      writeFileSync(join(cursorDir, 'mcp.json'), '{ this is not valid json }');

      await Mcp.run(['--target-org', 'myOrg']);

      const written = JSON.parse(readFileSync(join(cursorDir, 'mcp.json'), 'utf8')) as {
        mcpServers: Record<string, unknown>;
      };
      expect(written.mcpServers['salesforce-myOrg']).to.exist;
    });

    it('warns when mcp.json is an empty file', async () => {
      const cursorDir = join(tmpDir, '.cursor');
      mkdirSync(cursorDir, { recursive: true });
      writeFileSync(join(cursorDir, 'mcp.json'), '');

      await Mcp.run(['--target-org', 'myOrg']);

      const warnCalls = sfCommandStubs.warn
        .getCalls()
        .flatMap((c) => c.args)
        .join('\n');
      expect(warnCalls).to.include('mcp.json');
    });
  });

  describe('valid JSON without mcpServers key (Bug fix)', () => {
    it('does not crash when mcp.json is valid JSON but missing mcpServers', async () => {
      const cursorDir = join(tmpDir, '.cursor');
      mkdirSync(cursorDir, { recursive: true });
      writeFileSync(join(cursorDir, 'mcp.json'), JSON.stringify({}));

      const result = await Mcp.run(['--target-org', 'myOrg']);

      expect(result.serversAdded).to.deep.equal(['salesforce-myOrg']);
    });

    it('writes a valid server entry when mcp.json had no mcpServers key', async () => {
      const cursorDir = join(tmpDir, '.cursor');
      mkdirSync(cursorDir, { recursive: true });
      writeFileSync(join(cursorDir, 'mcp.json'), JSON.stringify({ other: 'data' }));

      await Mcp.run(['--target-org', 'myOrg']);

      const written = JSON.parse(readFileSync(join(cursorDir, 'mcp.json'), 'utf8')) as {
        mcpServers: Record<string, unknown>;
        other: string;
      };
      expect(written.mcpServers['salesforce-myOrg']).to.exist;
    });
  });

  describe('resolveNpxCommand()', () => {
    it('returns "npx" when npx is available in PATH', () => {
      const result = Mcp.resolveNpxCommand();
      expect(result).to.not.be.null;
    });

    it('returns a non-empty string when npx is resolvable', () => {
      const result = Mcp.resolveNpxCommand();
      if (result !== null) {
        expect(result.length).to.be.greaterThan(0);
      }
    });

    it('uses resolved npx path (or fallback) in written MCP config', async () => {
      const npxCmd = Mcp.resolveNpxCommand() ?? 'npx';

      await Mcp.run(['--target-org', 'myOrg']);

      const config = JSON.parse(readFileSync(join(tmpDir, '.cursor', 'mcp.json'), 'utf8')) as {
        mcpServers: Record<string, { command: string }>;
      };
      expect(config.mcpServers['salesforce-myOrg'].command).to.equal(npxCmd);
    });

    it('warns when npx cannot be resolved and writes "npx" as fallback', async () => {
      $$.SANDBOX.stub(Mcp, 'resolveNpxCommand').returns(null);

      await Mcp.run(['--target-org', 'myOrg']);

      const warnCalls = sfCommandStubs.warn
        .getCalls()
        .flatMap((c) => c.args)
        .join('\n');
      expect(warnCalls).to.include('npx');

      const config = JSON.parse(readFileSync(join(tmpDir, '.cursor', 'mcp.json'), 'utf8')) as {
        mcpServers: Record<string, { command: string }>;
      };
      expect(config.mcpServers['salesforce-myOrg'].command).to.equal('npx');
    });
  });

  describe('--global flag', () => {
    let fakeHome: string;
    let originalHome: string | undefined;
    let originalUserProfile: string | undefined;

    beforeEach(() => {
      fakeHome = mkdtempSync(join(tmpdir(), 'setup-agents-home-'));
      // os.homedir() reads HOME on POSIX and USERPROFILE on Windows — set both.
      originalHome = process.env.HOME;
      originalUserProfile = process.env.USERPROFILE;
      process.env.HOME = fakeHome;
      process.env.USERPROFILE = fakeHome;
    });

    afterEach(() => {
      if (originalHome === undefined) {
        delete process.env.HOME;
      } else {
        process.env.HOME = originalHome;
      }
      if (originalUserProfile === undefined) {
        delete process.env.USERPROFILE;
      } else {
        process.env.USERPROFILE = originalUserProfile;
      }
      rmSync(fakeHome, { recursive: true, force: true });
    });

    it('writes mcp.json to ~/.cursor/mcp.json when --global is provided', async () => {
      await Mcp.run(['--target-org', 'myOrg', '--global']);

      const globalMcpFile = join(fakeHome, '.cursor', 'mcp.json');
      expect(existsSync(globalMcpFile)).to.be.true;
    });

    it('does NOT write to the project .cursor/mcp.json when --global is provided', async () => {
      await Mcp.run(['--target-org', 'myOrg', '--global']);

      expect(existsSync(join(tmpDir, '.cursor', 'mcp.json'))).to.be.false;
    });

    it('returns the global mcp.json path in result.mcpFile', async () => {
      const result = await Mcp.run(['--target-org', 'myOrg', '--global']);

      expect(result.mcpFile).to.equal(join(fakeHome, '.cursor', 'mcp.json'));
    });

    it('global mcp.json contains the expected server entry', async () => {
      await Mcp.run(['--target-org', 'prodOrg', '--global']);

      const config = JSON.parse(readFileSync(join(fakeHome, '.cursor', 'mcp.json'), 'utf8')) as {
        mcpServers: Record<string, unknown>;
      };
      expect(config.mcpServers['salesforce-prodOrg']).to.exist;
    });
  });

  describe('login flow edge cases', () => {
    it('warns and returns empty in non-TTY mode when no orgs exist', async () => {
      const result = await Mcp.run([]);

      const warnCalls = sfCommandStubs.warn
        .getCalls()
        .flatMap((c) => c.args)
        .join('\n');
      expect(warnCalls).to.include('org');
      expect(result.serversAdded).to.be.empty;
    });

    it('still configures MCP when --target-org is provided even without authenticated orgs', async () => {
      const result = await Mcp.run(['--target-org', 'manualOrg']);

      expect(result.serversAdded).to.deep.equal(['salesforce-manualOrg']);
      expect(existsSync(join(tmpDir, '.cursor', 'mcp.json'))).to.be.true;
    });

    it('spawnWebLogin is a static method on Mcp', () => {
      expect(typeof (Mcp as unknown as Record<string, unknown>)['spawnWebLogin']).to.equal('function');
    });
  });
});
