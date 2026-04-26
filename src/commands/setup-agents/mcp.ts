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

import { execSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { join } from 'node:path';
import { Messages } from '@salesforce/core';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { getRelevantIntegrations, buildMcpEntry } from '../../integrations/index.js';
import type { McpIntegration, McpServerEntry } from '../../integrations/index.js';
import { PROFILE_TOOLSETS } from '../../profiles/toolsets.js';
import type { ProfileId } from '../../profiles/index.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@jterrats/setup-agents', 'setup-agents.mcp');

export type SetupMcpResult = {
  mcpFile: string;
  serversAdded: string[];
  cwd: string;
};

type McpServerConfig = {
  command: string;
  args: string[];
  env?: Record<string, string>;
  type?: string;
};

type McpConfig = {
  mcpServers: Record<string, McpServerConfig>;
};

const ALL_TOOLSETS = ['all'] as const;

/* eslint-disable no-await-in-loop -- credential prompts must be sequential */
async function collectCredentialsAndBuild(integration: McpIntegration): Promise<McpServerEntry> {
  const credentials: Record<string, string> = {};

  for (const envVar of integration.envVars) {
    const { input } = await import('@inquirer/prompts');
    const value = await input({
      message: `${envVar.label}: ${envVar.description}`,
      validate: (v: string) => (v.trim().length > 0 ? true : `${envVar.label} is required`),
    });
    credentials[envVar.name] = value.trim();
  }

  return buildMcpEntry(integration, credentials);
}
/* eslint-enable no-await-in-loop */

export default class Mcp extends SfCommand<SetupMcpResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    'target-org': Flags.string({
      summary: messages.getMessage('flags.target-org.summary'),
      description: messages.getMessage('flags.target-org.description'),
      helpValue: 'myOrgAlias',
    }),
    profile: Flags.string({
      summary: messages.getMessage('flags.profile.summary'),
      description: messages.getMessage('flags.profile.description'),
      helpValue: 'developer|architect|ba|mulesoft|ux|cgcloud|devops|qa|crma|data360',
    }),
    'all-toolsets': Flags.boolean({
      summary: messages.getMessage('flags.all-toolsets.summary'),
      description: messages.getMessage('flags.all-toolsets.description'),
      default: false,
    }),
    global: Flags.boolean({
      char: 'g',
      summary: messages.getMessage('flags.global.summary'),
      description: messages.getMessage('flags.global.description'),
      default: false,
    }),
  };

  /**
   * Resolves the npx executable to use in the MCP server config.
   * 1. Checks if `npx` is available in PATH.
   * 2. Falls back to the absolute path via `which` / `where`.
   * Returns null if npx cannot be found by either method.
   */
  public static resolveNpxCommand(): string | null {
    // Option 1: npx available in PATH
    try {
      execSync('npx --version', { stdio: 'ignore' });
      return 'npx';
    } catch {
      // not in PATH, try absolute path resolution
    }

    // Option 2: resolve absolute path
    try {
      const whichCmd = platform() === 'win32' ? 'where npx' : 'which npx';
      const resolved = execSync(whichCmd, { encoding: 'utf8' }).trim().split('\n')[0].trim();
      if (resolved) return resolved;
    } catch {
      // npx not found anywhere
    }

    return null;
  }

  private static async spawnWebLogin(alias: string): Promise<boolean> {
    return new Promise((resolve) => {
      const child = spawn('sf', ['org', 'login', 'web', '--alias', alias], {
        stdio: 'inherit',
        shell: true,
      });

      child.on('close', (code) => {
        resolve(code === 0);
      });

      child.on('error', () => {
        resolve(false);
      });
    });
  }

  private static resolveToolsets(profileFlag?: string): string[] {
    if (!profileFlag) return [...ALL_TOOLSETS];
    const ids = profileFlag.split(',').map((s) => s.trim()) as ProfileId[];
    const toolsetSet = new Set<string>();
    for (const id of ids) {
      for (const ts of PROFILE_TOOLSETS[id] ?? ALL_TOOLSETS) {
        toolsetSet.add(ts);
      }
    }
    return [...toolsetSet];
  }

  public async run(): Promise<SetupMcpResult> {
    const { flags } = await this.parse(Mcp);
    const cwd = process.cwd();

    const orgs = await this.resolveOrgs(flags['target-org']);
    if (orgs.length === 0) {
      this.warn(messages.getMessage('warn.noOrgs'));
      return { mcpFile: '', serversAdded: [], cwd };
    }

    const toolsets = flags['all-toolsets'] ? [...ALL_TOOLSETS] : Mcp.resolveToolsets(flags.profile);

    const mcpFilePath = flags.global ? join(homedir(), '.cursor', 'mcp.json') : join(cwd, '.cursor', 'mcp.json');

    const serversAdded = this.writeMcpConfig(mcpFilePath, orgs, toolsets);

    // Phase 2: third-party MCP integrations
    const thirdPartyAdded = await this.configureThirdPartyMcps(mcpFilePath, flags.profile);
    serversAdded.push(...thirdPartyAdded);

    this.log(messages.getMessage('info.done', [mcpFilePath, serversAdded.join(', ')]));
    return { mcpFile: mcpFilePath, serversAdded, cwd };
  }

  private async resolveOrgs(targetOrg?: string): Promise<string[]> {
    if (targetOrg) return [targetOrg];

    if (!process.stdin.isTTY) {
      this.warn(messages.getMessage('warn.nonInteractive'));
      return [];
    }

    const orgAliases = this.listAuthenticatedOrgs();

    if (orgAliases.length === 0) {
      return this.offerWebLogin();
    }

    const { checkbox } = await import('@inquirer/prompts');
    return checkbox<string>({
      message: messages.getMessage('prompt.selectOrgs'),
      choices: orgAliases.map((alias) => ({ value: alias, name: alias })),
    });
  }

  private listAuthenticatedOrgs(): string[] {
    try {
      const raw = execSync('sf org list --json 2>/dev/null', { encoding: 'utf8' });
      const parsed = JSON.parse(raw) as {
        result?: {
          nonScratchOrgs?: Array<{ alias?: string; username: string }>;
          scratchOrgs?: Array<{ alias?: string; username: string }>;
        };
      };
      const all = [...(parsed.result?.nonScratchOrgs ?? []), ...(parsed.result?.scratchOrgs ?? [])];
      return all.map((o) => o.alias ?? o.username).filter(Boolean);
    } catch {
      this.warn(messages.getMessage('warn.orgListFailed'));
      return [];
    }
  }

  private async offerWebLogin(): Promise<string[]> {
    const { confirm, input } = await import('@inquirer/prompts');

    const shouldLogin = await confirm({
      message: messages.getMessage('prompt.offerLogin'),
      default: true,
    });

    if (!shouldLogin) return [];

    const alias = await input({
      message: messages.getMessage('prompt.orgAlias'),
      validate: (v) => (v.trim().length > 0 ? true : messages.getMessage('error.aliasRequired')),
    });

    this.log(messages.getMessage('info.loginStarting', [alias.trim()]));

    const loginSuccess = await Mcp.spawnWebLogin(alias.trim());

    if (!loginSuccess) {
      this.warn(messages.getMessage('warn.loginFailed'));
      return [];
    }

    this.log(messages.getMessage('info.loginSuccess', [alias.trim()]));
    return [alias.trim()];
  }

  /**
   * Detects which third-party MCP integrations are relevant for the active
   * profiles and prompts the user to configure them.
   */
  private async configureThirdPartyMcps(mcpFilePath: string, profileFlag?: string): Promise<string[]> {
    const profileIds = profileFlag ? profileFlag.split(',').map((s) => s.trim()) : [];
    const relevant = getRelevantIntegrations(profileIds);
    if (relevant.length === 0 || !process.stdin.isTTY) return [];

    const { checkbox } = await import('@inquirer/prompts');

    const selected = await checkbox<string>({
      message: 'These third-party integrations are available for your profiles. Which do you want to configure?',
      choices: relevant.map((i) => ({ value: i.id, name: `${i.label} — profiles: ${[...i.profiles].join(', ')}` })),
    });

    if (selected.length === 0) return [];

    const mcpDir = join(mcpFilePath, '..');
    if (!existsSync(mcpDir)) mkdirSync(mcpDir, { recursive: true });

    let existing: McpConfig = { mcpServers: {} };
    if (existsSync(mcpFilePath)) {
      try {
        existing = JSON.parse(readFileSync(mcpFilePath, 'utf8')) as McpConfig;
        if (!existing.mcpServers || typeof existing.mcpServers !== 'object') {
          existing.mcpServers = {};
        }
      } catch {
        // already handled in Salesforce phase
      }
    }

    const added: string[] = [];

    for (const integrationId of selected) {
      const integration = relevant.find((i) => i.id === integrationId);
      if (!integration) continue;

      // eslint-disable-next-line no-await-in-loop -- sequential prompts are intentional (UX)
      const entry = await collectCredentialsAndBuild(integration);
      existing.mcpServers[integration.id] = entry as McpServerConfig;
      added.push(integration.id);
      this.log(`Added ${integration.label} MCP server.`);
    }

    if (added.length > 0) {
      writeFileSync(mcpFilePath, JSON.stringify(existing, null, 2) + '\n', 'utf8');
    }

    return added;
  }

  private writeMcpConfig(mcpFilePath: string, orgs: string[], toolsets: string[]): string[] {
    const mcpDir = join(mcpFilePath, '..');
    if (!existsSync(mcpDir)) mkdirSync(mcpDir, { recursive: true });

    let existing: McpConfig = { mcpServers: {} };
    if (existsSync(mcpFilePath)) {
      try {
        existing = JSON.parse(readFileSync(mcpFilePath, 'utf8')) as McpConfig;
        if (!existing.mcpServers || typeof existing.mcpServers !== 'object') {
          existing.mcpServers = {};
        }
      } catch {
        this.warn(messages.getMessage('warn.corruptMcpJson', [mcpFilePath]));
      }
    }

    const npxCmd = Mcp.resolveNpxCommand();
    if (!npxCmd) {
      this.warn(messages.getMessage('warn.npxNotFound'));
    }

    const serversAdded: string[] = [];
    for (const org of orgs) {
      const serverKey = `salesforce-${org}`;
      existing.mcpServers[serverKey] = {
        command: npxCmd ?? 'npx',
        args: ['@salesforce/mcp@latest', '--orgs', org, '--toolsets', toolsets.join(',')],
        type: 'stdio',
      };
      serversAdded.push(serverKey);
      this.log(messages.getMessage('info.serverAdded', [serverKey]));
    }

    writeFileSync(mcpFilePath, JSON.stringify(existing, null, 2) + '\n', 'utf8');
    return serversAdded;
  }
}
