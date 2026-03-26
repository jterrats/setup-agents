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

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { Messages } from '@salesforce/core';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import type { ProfileId } from '../../profiles/index.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@jterrats/plugin-setup-agents', 'setup-agents.mcp');

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

const PROFILE_TOOLSETS: Record<ProfileId, string[]> = {
  developer: ['metadata', 'apex', 'sobjects'],
  architect: ['metadata', 'apex', 'sobjects'],
  ba: ['metadata', 'sobjects'],
  mulesoft: ['metadata'],
  ux: ['metadata', 'sobjects'],
  cgcloud: ['metadata', 'apex', 'sobjects'],
  devops: ['metadata'],
  qa: ['metadata', 'apex', 'sobjects'],
  crma: ['metadata', 'sobjects'],
  data360: ['metadata', 'sobjects'],
};

const ALL_TOOLSETS = ['metadata', 'apex', 'sobjects'] as const;

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

    this.log(messages.getMessage('info.done', [mcpFilePath, serversAdded.join(', ')]));
    return { mcpFile: mcpFilePath, serversAdded, cwd };
  }

  private async resolveOrgs(targetOrg?: string): Promise<string[]> {
    if (targetOrg) return [targetOrg];

    if (!process.stdin.isTTY) {
      this.warn(messages.getMessage('warn.nonInteractive'));
      return [];
    }

    let orgAliases: string[] = [];
    try {
      const { execSync } = await import('node:child_process');
      const raw = execSync('sf org list --json 2>/dev/null', { encoding: 'utf8' });
      const parsed = JSON.parse(raw) as {
        result?: {
          nonScratchOrgs?: Array<{ alias?: string; username: string }>;
          scratchOrgs?: Array<{ alias?: string; username: string }>;
        };
      };
      const all = [...(parsed.result?.nonScratchOrgs ?? []), ...(parsed.result?.scratchOrgs ?? [])];
      orgAliases = all.map((o) => o.alias ?? o.username).filter(Boolean);
    } catch {
      this.warn(messages.getMessage('warn.orgListFailed'));
    }

    if (orgAliases.length === 0) {
      this.warn(messages.getMessage('warn.noOrgs'));
      return [];
    }

    const { checkbox } = await import('@inquirer/prompts');
    return checkbox<string>({
      message: messages.getMessage('prompt.selectOrgs'),
      choices: orgAliases.map((alias) => ({ value: alias, name: alias })),
    });
  }

  private writeMcpConfig(mcpFilePath: string, orgs: string[], toolsets: string[]): string[] {
    const mcpDir = join(mcpFilePath, '..');
    if (!existsSync(mcpDir)) mkdirSync(mcpDir, { recursive: true });

    let existing: McpConfig = { mcpServers: {} };
    if (existsSync(mcpFilePath)) {
      try {
        existing = JSON.parse(readFileSync(mcpFilePath, 'utf8')) as McpConfig;
      } catch {
        this.warn(messages.getMessage('warn.corruptMcpJson', [mcpFilePath]));
      }
    }

    const serversAdded: string[] = [];
    for (const org of orgs) {
      const serverKey = `salesforce-${org}`;
      existing.mcpServers[serverKey] = {
        command: 'npx',
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
