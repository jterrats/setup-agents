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

/**
 * Core logic for third-party MCP integration setup.
 *
 * Consumed by the CLI command (`sf setup-agents mcp`) and the VS Code extension.
 * Pure functions with no side-effects — callers handle I/O.
 */

import { MCP_INTEGRATIONS, type McpIntegration, type McpIntegrationConfig } from './mcp-registry.js';

export type McpServerEntry = {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  type?: string;
};

/**
 * Returns integrations from the registry that are relevant for the given
 * profile IDs. An integration is relevant if at least one of its target
 * profiles is in the active set.
 */
export function getRelevantIntegrations(profileIds: string[]): McpIntegration[] {
  const ids = new Set(profileIds);
  return MCP_INTEGRATIONS.filter((integration) => [...integration.profiles].some((p) => ids.has(p)));
}

/**
 * Builds an mcp.json server entry from an integration definition and
 * user-provided credentials. For HTTP integrations the entry only needs
 * a `url`. For stdio integrations the entry includes command, args, and
 * env with credential values filled in.
 */
export function buildMcpEntry(integration: McpIntegration, credentials: Record<string, string>): McpServerEntry {
  const cfg: McpIntegrationConfig = integration.config;

  if (cfg.transport === 'http') {
    return { url: cfg.url };
  }

  const env: Record<string, string> = {};
  for (const spec of integration.envVars) {
    env[spec.name] = credentials[spec.name] ?? '';
  }

  return {
    command: cfg.command,
    args: [...cfg.args],
    env,
    type: 'stdio',
  };
}

/**
 * Generates a human-readable setup guide for an integration.
 * Suitable for display in CLI output or webview.
 */
export function formatSetupGuide(integration: McpIntegration): string {
  const lines: string[] = [`## ${integration.label} Setup Guide\n`];

  for (const step of integration.setupGuide.steps) {
    lines.push(step);
    lines.push('');
  }

  lines.push(`Learn more: ${integration.setupGuide.learnMore}`);
  return lines.join('\n');
}
