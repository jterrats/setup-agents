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

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Messages } from '@salesforce/core';
import { checkbox, confirm } from '@inquirer/prompts';
// @salesforce/core Messages requires a generic that leaks into consumer signatures.
// Using `any` here is the only viable escape hatch until the upstream type is fixed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- https://github.com/forcedotcom/sfdx-core/issues/1062
export type AnyMessages = Messages<any>;
import type { Profile, ProfileId } from '../profiles/index.js';
import { ALL_PROFILES, developerProfile } from '../profiles/index.js';
import type { SupportedTool } from '../types/index.js';
import { SUPPORTED_TOOLS } from '../types/index.js';
import { PLUGIN_VERSION } from '../version.js';

const VALID_PROFILE_IDS: ProfileId[] = ALL_PROFILES.map((p) => p.id);

const STALE_VERSION_MDC = /^pluginVersion: "([^"]+)"/m;
const STALE_VERSION_FLAT = /<!-- setup-agents: ([^\s]+) -->/;

const PROFILE_FILE_MAP: Record<string, ProfileId> = {
  'developer-standards.mdc': 'developer',
  'architect-standards.mdc': 'architect',
  'ba-standards.mdc': 'ba',
  'pm-standards.mdc': 'pm',
  'mulesoft-standards.mdc': 'mulesoft',
  'ux-standards.mdc': 'ux',
  'cgcloud-standards.mdc': 'cgcloud',
  'devops-standards.mdc': 'devops',
  'qa-standards.mdc': 'qa',
  'analytics-standards.mdc': 'crma',
  'data360-standards.mdc': 'data360',
};

export function detectTools(cwd: string): SupportedTool[] {
  const detected: SupportedTool[] = [];
  if (existsSync(join(cwd, '.cursor'))) detected.push('cursor');
  if (existsSync(join(cwd, '.vscode'))) detected.push('vscode');
  if (existsSync(join(cwd, 'AGENTS.md'))) detected.push('codex');
  if (existsSync(join(cwd, 'CLAUDE.md'))) detected.push('claude');
  if (existsSync(join(cwd, '.a4drules'))) detected.push('agentforce');
  return detected.length === 0 ? SUPPORTED_TOOLS : detected;
}

export async function resolveProfiles(
  cwd: string,
  flagValue: string | undefined,
  msgs: AnyMessages,
  warnFn?: (msg: string) => void
): Promise<{ profiles: Profile[]; usedDefault: boolean }> {
  if (flagValue) {
    const ids = flagValue.split(',').map((s) => s.trim()) as ProfileId[];
    const invalid = ids.filter((id) => !VALID_PROFILE_IDS.includes(id));
    if (invalid.length > 0) {
      warnFn?.(msgs.getMessage('warn.unknownProfiles', [invalid.join(', '), VALID_PROFILE_IDS.join(', ')]));
    }
    const profiles = ALL_PROFILES.filter((p) => ids.includes(p.id));
    return { profiles, usedDefault: false };
  }

  if (!process.stdin.isTTY) {
    return { profiles: [developerProfile], usedDefault: true };
  }

  const autoDetected = new Set<ProfileId>(
    ALL_PROFILES.filter((p) => p.id !== 'cgcloud' && p.detect?.(cwd)).map((p) => p.id)
  );

  const cgcloud = ALL_PROFILES.find((p) => p.id === 'cgcloud')!;
  if (cgcloud.detect?.(cwd)) {
    const add = await confirm({ message: msgs.getMessage('prompt.confirmCGCloud'), default: true });
    if (add) autoDetected.add('cgcloud');
  }

  const selected = await checkbox<ProfileId>({
    message: msgs.getMessage('prompt.selectProfiles'),
    choices: ALL_PROFILES.map((p) => ({ value: p.id, name: p.label, checked: autoDetected.has(p.id) })),
  });

  if (selected.length === 0) return { profiles: [developerProfile], usedDefault: true };
  return { profiles: ALL_PROFILES.filter((p) => selected.includes(p.id)), usedDefault: false };
}

export function findStaleFiles(cwd: string): Array<{ file: string; tool: SupportedTool; version: string | null }> {
  const stale: Array<{ file: string; tool: SupportedTool; version: string | null }> = [];

  const checkFile = (filePath: string, tool: SupportedTool, pattern: RegExp): void => {
    if (!existsSync(filePath)) return;
    const content = readFileSync(filePath, 'utf8');
    const match = pattern.exec(content);
    if (!match || match[1] !== PLUGIN_VERSION) {
      stale.push({ file: filePath, tool, version: match?.[1] ?? null });
    }
  };

  const rulesDir = join(cwd, '.cursor', 'rules');
  if (existsSync(rulesDir)) {
    for (const file of readdirSync(rulesDir).filter((f) => f.endsWith('.mdc'))) {
      checkFile(join(rulesDir, file), 'cursor', STALE_VERSION_MDC);
    }
  }

  checkFile(join(cwd, '.github', 'copilot-instructions.md'), 'vscode', STALE_VERSION_FLAT);
  checkFile(join(cwd, 'AGENTS.md'), 'codex', STALE_VERSION_FLAT);
  checkFile(join(cwd, 'CLAUDE.md'), 'claude', STALE_VERSION_FLAT);

  const a4dDir = join(cwd, '.a4drules');
  if (existsSync(a4dDir)) {
    for (const file of readdirSync(a4dDir).filter((f) => f.endsWith('.md'))) {
      checkFile(join(a4dDir, file), 'agentforce', STALE_VERSION_FLAT);
    }
    const workflowsDir = join(a4dDir, 'workflows');
    if (existsSync(workflowsDir)) {
      for (const file of readdirSync(workflowsDir).filter((f) => f.endsWith('.md'))) {
        checkFile(join(workflowsDir, file), 'agentforce', STALE_VERSION_FLAT);
      }
    }
  }

  return stale;
}

export function inferProfiles(cwd: string): ProfileId[] {
  const rulesDir = join(cwd, '.cursor', 'rules');
  if (!existsSync(rulesDir)) return [];

  return readdirSync(rulesDir)
    .filter((f) => f.endsWith('.mdc'))
    .map((f) => PROFILE_FILE_MAP[f])
    .filter((id): id is ProfileId => !!id && ALL_PROFILES.some((p) => p.id === id));
}
