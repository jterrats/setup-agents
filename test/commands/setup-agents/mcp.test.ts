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
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
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
    expect(args[toolsetsIndex + 1]).to.include('metadata');
    expect(args[toolsetsIndex + 1]).to.include('apex');
    expect(args[toolsetsIndex + 1]).to.include('sobjects');
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
});
