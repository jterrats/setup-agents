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

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { checkbox, confirm, select } from '@inquirer/prompts';
import { Messages } from '@salesforce/core';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMessages = Messages<any>;
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { ALL_PROFILES, developerProfile } from '../../profiles/index.js';
import type { Profile, ProfileId } from '../../profiles/index.js';
import { FileWriter } from '../../services/file-writer.js';
import { setupAgentforce } from '../../setup/agentforce-setup.js';
import { setupCodex } from '../../setup/codex-setup.js';
import { setupCursor } from '../../setup/cursor-setup.js';
import { setupVsCode } from '../../setup/vscode-setup.js';
import type { SetupLocalResult, SupportedTool } from '../../types/index.js';
import { SUPPORTED_TOOLS } from '../../types/index.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@jterrats/setup-agents', 'setup-agents.local');

const VALID_PROFILE_IDS: ProfileId[] = ALL_PROFILES.map((p) => p.id);

export default class Local extends SfCommand<SetupLocalResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    rules: Flags.string({
      summary: messages.getMessage('flags.rules.summary'),
      description: messages.getMessage('flags.rules.description'),
      options: SUPPORTED_TOOLS,
      helpValue: 'cursor|vscode|codex|agentforce',
    }),
    profile: Flags.string({
      summary: messages.getMessage('flags.profile.summary'),
      description: messages.getMessage('flags.profile.description'),
      helpValue: 'developer|architect|ba|mulesoft|ux|cgcloud|devops|qa|crma|data360',
    }),
    force: Flags.boolean({
      char: 'f',
      summary: messages.getMessage('flags.force.summary'),
      description: messages.getMessage('flags.force.description'),
      default: false,
    }),
  };

  public async run(): Promise<SetupLocalResult> {
    const { flags } = await this.parse(Local);
    const cwd = process.cwd();

    const writer = new FileWriter({
      force: flags.force,
      log: (f) => this.log(messages.getMessage('info.fileCreated', [f])),
      warn: (f) => this.warn(messages.getMessage('warn.fileExists', [f])),
    });

    const tools: SupportedTool[] = flags.rules ? [flags.rules as SupportedTool] : detectTools(cwd);

    if (tools.length === 0) {
      this.warn(messages.getMessage('warn.noToolsDetected'));
      return { configured: [], profiles: [], cwd };
    }

    const { profiles, usedDefault } = await resolveProfiles(cwd, flags.profile, messages, (msg) => this.warn(msg));
    const isSalesforceProject = existsSync(join(cwd, 'sfdx-project.json'));
    const configured: string[] = [];

    for (const tool of tools) {
      this.log(messages.getMessage('info.configuring', [tool]));
      // eslint-disable-next-line no-await-in-loop
      await runSetup(tool, { cwd, profiles, writer, isSalesforceProject, log: (m) => this.log(m) });
      configured.push(tool);
    }

    if (usedDefault) this.warn(messages.getMessage('warn.profileDefault'));

    this.log(messages.getMessage('info.done', [configured.join(', ')]));
    return { configured, profiles: profiles.map((p) => p.id), cwd };
  }
}

// ─── Module-level helpers (pure, testable independently) ───────────────────

export function detectTools(cwd: string): SupportedTool[] {
  const detected: SupportedTool[] = [];
  if (existsSync(join(cwd, '.cursor'))) detected.push('cursor');
  if (existsSync(join(cwd, '.vscode'))) detected.push('vscode');
  if (existsSync(join(cwd, 'AGENTS.md'))) detected.push('codex');
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

async function runSetup(
  tool: SupportedTool,
  ctx: { cwd: string; profiles: Profile[]; writer: FileWriter; isSalesforceProject: boolean; log: (m: string) => void }
): Promise<void> {
  const { cwd, profiles, writer, isSalesforceProject, log } = ctx;

  switch (tool) {
    case 'cursor':
      await setupCursor({
        cwd,
        profiles,
        writer,
        isSalesforceProject,
        promptScope: () => promptCursorScope(messages),
        printToConsole: log,
      });
      break;
    case 'vscode':
      setupVsCode({ cwd, profiles, writer, isSalesforceProject });
      break;
    case 'codex':
      setupCodex({ cwd, profiles, writer });
      break;
    case 'agentforce':
      setupAgentforce({ cwd, profiles, writer, isSalesforceProject });
      break;
  }
}

async function promptCursorScope(msgs: AnyMessages): Promise<'project' | 'user'> {
  if (!process.stdin.isTTY) return 'project';
  return select<'project' | 'user'>({
    message: msgs.getMessage('prompt.cursorRuleScope'),
    choices: [
      { value: 'project', name: msgs.getMessage('prompt.cursorRuleScopeProject') },
      { value: 'user', name: msgs.getMessage('prompt.cursorRuleScopeUser') },
    ],
  });
}
