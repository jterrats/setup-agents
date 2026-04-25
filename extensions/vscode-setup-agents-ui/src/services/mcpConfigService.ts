import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { ProfileId } from '../types';

type McpServerConfig = {
  command: string;
  args: string[];
  type: string;
};

type McpConfig = {
  mcpServers: Record<string, McpServerConfig>;
};

const PROFILE_TOOLSETS: Record<ProfileId, string[]> = {
  developer: ['metadata', 'data', 'testing', 'users'],
  architect: ['metadata', 'data', 'testing', 'users'],
  ba: ['metadata', 'data'],
  pm: ['metadata', 'data'],
  mulesoft: ['metadata', 'orgs'],
  ux: ['metadata', 'data'],
  cgcloud: ['metadata', 'data', 'testing', 'users'],
  devops: ['metadata', 'orgs', 'users'],
  qa: ['metadata', 'data', 'testing', 'users'],
  crma: ['metadata', 'data'],
  data360: ['metadata', 'data'],
};

export type McpWriteResult = {
  mcpFile: string;
  serversAdded: string[];
};

export class McpConfigService {
  public resolveToolsets(profileIds: ProfileId[], allToolsets: boolean): string[] {
    if (allToolsets || profileIds.length === 0) return ['all'];
    const set = new Set<string>();
    for (const id of profileIds) {
      for (const ts of PROFILE_TOOLSETS[id] ?? ['all']) {
        set.add(ts);
      }
    }
    return [...set];
  }

  public writeMcpConfig(
    orgs: string[],
    toolsets: string[],
    npxCmd: string,
    global: boolean,
    workspacePath: string
  ): McpWriteResult {
    const mcpFilePath = global ? join(homedir(), '.cursor', 'mcp.json') : join(workspacePath, '.cursor', 'mcp.json');

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
        existing = { mcpServers: {} };
      }
    }

    const serversAdded: string[] = [];
    for (const org of orgs) {
      const serverKey = `salesforce-${org}`;
      existing.mcpServers[serverKey] = {
        command: npxCmd,
        args: ['@salesforce/mcp@latest', '--orgs', org, '--toolsets', toolsets.join(',')],
        type: 'stdio',
      };
      serversAdded.push(serverKey);
    }

    writeFileSync(mcpFilePath, JSON.stringify(existing, null, 2) + '\n', 'utf8');
    return { mcpFile: mcpFilePath, serversAdded };
  }
}
