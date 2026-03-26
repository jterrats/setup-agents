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

import { join } from 'node:path';
import { generateCopilotInstructions } from '../generators/copilot-generator.js';
import { generateExtensionsJson } from '../generators/extensions-generator.js';
import type { Profile } from '../profiles/index.js';
import { ensureDir } from '../services/file-writer.js';
import type { FileWriter } from '../services/file-writer.js';
import { PLUGIN_VERSION } from '../version.js';

export type VsCodeSetupOptions = {
  cwd: string;
  profiles: Profile[];
  writer: FileWriter;
  isSalesforceProject: boolean;
};

export function setupVsCode(opts: VsCodeSetupOptions): void {
  const { cwd, profiles, writer, isSalesforceProject } = opts;

  const githubDir = join(cwd, '.github');
  ensureDir(githubDir);
  writer.write(join(githubDir, 'copilot-instructions.md'), generateCopilotInstructions(profiles, PLUGIN_VERSION));

  if (!isSalesforceProject) return;

  const vsCodeDir = join(cwd, '.vscode');
  ensureDir(vsCodeDir);
  writer.write(join(vsCodeDir, 'extensions.json'), generateExtensionsJson(profiles));
}
