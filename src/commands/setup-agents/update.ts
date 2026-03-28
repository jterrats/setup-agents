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

import { Messages } from '@salesforce/core';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import type { SupportedTool } from '../../types/index.js';
import { PLUGIN_VERSION } from '../../version.js';
import { findStaleFiles, inferProfiles } from '../../util/command-helpers.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@jterrats/setup-agents', 'setup-agents.update');

export type SetupUpdateResult = {
  updated: string[];
  skipped: string[];
  cwd: string;
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

  public async run(): Promise<SetupUpdateResult> {
    const { flags } = await this.parse(Update);
    const cwd = process.cwd();
    const updated: string[] = [];
    const skipped: string[] = [];

    const staleFiles = findStaleFiles(cwd);

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
    const inferredProfiles = inferProfiles(cwd);
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
