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

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Messages } from '@salesforce/core';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { ALL_PROFILES } from '../../profiles/index.js';
import type { ProfileId } from '../../profiles/index.js';
import type { SupportedTool } from '../../types/index.js';
import { PLUGIN_VERSION } from '../../version.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@jterrats/plugin-setup-agents', 'setup-agents.update');

export type SetupUpdateResult = {
  updated: string[];
  skipped: string[];
  cwd: string;
};

const STALE_VERSION_MDC = /^pluginVersion: "([^"]+)"/m;
const STALE_VERSION_FLAT = /<!-- setup-agents: ([^\s]+) -->/;

const PROFILE_FILE_MAP: Record<string, ProfileId> = {
  'developer-standards.mdc': 'developer',
  'architect-standards.mdc': 'architect',
  'ba-standards.mdc': 'ba',
  'mulesoft-standards.mdc': 'mulesoft',
  'ux-standards.mdc': 'ux',
  'cgcloud-standards.mdc': 'cgcloud',
  'devops-standards.mdc': 'devops',
  'qa-standards.mdc': 'qa',
  'analytics-standards.mdc': 'crma',
  'data360-standards.mdc': 'data360',
};

export default class Update extends SfCommand<SetupUpdateResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    'dry-run': Flags.boolean({
      summary: messages.getMessage('flags.dry-run.summary'),
      description: messages.getMessage('flags.dry-run.description'),
      default: false,
    }),
    yes: Flags.boolean({
      char: 'y',
      summary: messages.getMessage('flags.yes.summary'),
      description: messages.getMessage('flags.yes.description'),
      default: false,
    }),
  };

  private static findStaleFiles(cwd: string): Array<{ file: string; tool: SupportedTool; version: string | null }> {
    const stale: Array<{ file: string; tool: SupportedTool; version: string | null }> = [];

    const checkMdc = (filePath: string, tool: SupportedTool): void => {
      if (!existsSync(filePath)) return;
      const content = readFileSync(filePath, 'utf8');
      const match = STALE_VERSION_MDC.exec(content);
      if (!match || match[1] !== PLUGIN_VERSION) {
        stale.push({ file: filePath, tool, version: match?.[1] ?? null });
      }
    };

    const checkFlat = (filePath: string, tool: SupportedTool): void => {
      if (!existsSync(filePath)) return;
      const content = readFileSync(filePath, 'utf8');
      const match = STALE_VERSION_FLAT.exec(content);
      if (!match || match[1] !== PLUGIN_VERSION) {
        stale.push({ file: filePath, tool, version: match?.[1] ?? null });
      }
    };

    const rulesDir = join(cwd, '.cursor', 'rules');
    if (existsSync(rulesDir)) {
      for (const file of readdirSync(rulesDir).filter((f) => f.endsWith('.mdc'))) {
        checkMdc(join(rulesDir, file), 'cursor');
      }
    }

    checkFlat(join(cwd, '.github', 'copilot-instructions.md'), 'vscode');
    checkFlat(join(cwd, 'AGENTS.md'), 'codex');

    const a4dDir = join(cwd, '.a4drules');
    if (existsSync(a4dDir)) {
      for (const file of readdirSync(a4dDir).filter((f) => f.endsWith('.md'))) {
        checkFlat(join(a4dDir, file), 'agentforce');
      }
      const workflowsDir = join(a4dDir, 'workflows');
      if (existsSync(workflowsDir)) {
        for (const file of readdirSync(workflowsDir).filter((f) => f.endsWith('.md'))) {
          checkFlat(join(workflowsDir, file), 'agentforce');
        }
      }
    }

    return stale;
  }

  private static inferProfiles(cwd: string): ProfileId[] {
    const rulesDir = join(cwd, '.cursor', 'rules');
    if (!existsSync(rulesDir)) return [];

    return readdirSync(rulesDir)
      .filter((f) => f.endsWith('.mdc'))
      .map((f) => PROFILE_FILE_MAP[f])
      .filter((id): id is ProfileId => !!id && ALL_PROFILES.some((p) => p.id === id));
  }

  public async run(): Promise<SetupUpdateResult> {
    const { flags } = await this.parse(Update);
    const cwd = process.cwd();
    const updated: string[] = [];
    const skipped: string[] = [];

    const staleFiles = Update.findStaleFiles(cwd);

    if (staleFiles.length === 0) {
      this.log(messages.getMessage('info.nothingToUpdate', [PLUGIN_VERSION]));
      return { updated: [], skipped: [], cwd };
    }

    this.log(messages.getMessage('info.staleFilesFound', [staleFiles.length.toString()]));
    for (const f of staleFiles) {
      this.log(`  ${f.tool.padEnd(12)} ${f.file}`);
    }

    if (flags['dry-run']) {
      this.log(messages.getMessage('info.dryRun'));
      return { updated: staleFiles.map((f) => f.file), skipped: [], cwd };
    }

    if (!flags.yes && process.stdin.isTTY) {
      const { confirm } = await import('@inquirer/prompts');
      const proceed = await confirm({ message: messages.getMessage('prompt.confirmUpdate'), default: true });
      if (!proceed) {
        this.log(messages.getMessage('info.cancelled'));
        return { updated: [], skipped: staleFiles.map((f) => f.file), cwd };
      }
    }

    const toolsToUpdate = [...new Set(staleFiles.map((f) => f.tool))] as SupportedTool[];
    const inferredProfiles = Update.inferProfiles(cwd);
    const profileArg = inferredProfiles.length > 0 ? inferredProfiles.join(',') : 'developer';

    const args = ['--force', '--profile', profileArg];
    for (const tool of toolsToUpdate) {
      this.log(messages.getMessage('info.updating', [tool]));
      // eslint-disable-next-line no-await-in-loop
      await this.config.runCommand('setup-agents local', [...args, '--rules', tool]);
      updated.push(...staleFiles.filter((f) => f.tool === tool).map((f) => f.file));
    }

    this.log(messages.getMessage('info.done', [updated.length.toString()]));
    return { updated, skipped, cwd };
  }
}
