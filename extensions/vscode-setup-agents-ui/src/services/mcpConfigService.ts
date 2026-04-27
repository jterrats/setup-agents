import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { ProfileId } from '../types';

type McpServerConfig = {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
};

type McpConfig = {
  mcpServers: Record<string, McpServerConfig>;
};

// Source of truth: src/profiles/toolsets.ts — keep in sync (verified by test)
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
  commerce: ['metadata', 'data'],
  data360: ['metadata', 'data'],
  admin: ['metadata', 'data', 'users'],
  sfmc: ['metadata', 'data'],
  security: ['metadata', 'data', 'testing', 'users'],
  service: ['metadata', 'data', 'users'],
  cpq: ['metadata', 'data'],
  omnistudio: ['metadata', 'data'],
  fsl: ['metadata', 'data', 'users'],
  ai: ['metadata', 'data', 'testing', 'users'],
  slack: ['metadata', 'data'],
  tableau: ['metadata', 'data'],
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
    const entries: Record<string, McpServerConfig> = {};
    for (const org of orgs) {
      entries[`salesforce-${org}`] = {
        command: npxCmd,
        args: ['-y', '--prefer-offline', '@salesforce/mcp@latest', '--orgs', org, '--toolsets', toolsets.join(',')],
      };
    }
    return this.mergeAndWrite(this.resolveMcpPath(global, workspacePath), entries);
  }

  public writeIntegrationConfig(
    entries: Record<string, McpServerConfig>,
    global: boolean,
    workspacePath: string
  ): McpWriteResult {
    return this.mergeAndWrite(this.resolveMcpPath(global, workspacePath), entries);
  }

  public readConfiguredServers(workspacePath: string): string[] {
    const servers: Set<string> = new Set();
    for (const path of [join(workspacePath, '.cursor', 'mcp.json'), join(homedir(), '.cursor', 'mcp.json')]) {
      if (!existsSync(path)) continue;
      try {
        const config = JSON.parse(readFileSync(path, 'utf8')) as McpConfig;
        for (const [key, cfg] of Object.entries(config.mcpServers ?? {})) {
          servers.add(key);
          // Detect Salesforce MCP servers by inspecting args, regardless of key name.
          // Adds a synthetic "salesforce-{alias}" entry so the UI can match by org alias.
          const args = cfg.args ?? [];
          const isSalesforceMcp = args.some((a) => a.includes('@salesforce/mcp'));
          if (isSalesforceMcp) {
            const orgsIdx = args.indexOf('--orgs');
            if (orgsIdx !== -1 && args[orgsIdx + 1]) {
              for (const org of args[orgsIdx + 1].split(',')) {
                servers.add(`salesforce-${org.trim()}`);
              }
            }
          }
        }
      } catch {
        // corrupt or unreadable mcp.json — skip
      }
    }
    return [...servers];
  }

  private resolveMcpPath(global: boolean, workspacePath: string): string {
    return global ? join(homedir(), '.cursor', 'mcp.json') : join(workspacePath, '.cursor', 'mcp.json');
  }

  private mergeAndWrite(mcpFilePath: string, entries: Record<string, McpServerConfig>): McpWriteResult {
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
    for (const [key, config] of Object.entries(entries)) {
      existing.mcpServers[key] = config;
      serversAdded.push(key);
    }

    writeFileSync(mcpFilePath, JSON.stringify(existing, null, 2) + '\n', 'utf8');
    return { mcpFile: mcpFilePath, serversAdded };
  }
}
