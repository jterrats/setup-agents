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
import { generateBaseGuidelines, generateSfStandards, generateSubAgentProtocol } from '../generators/mdc-generator.js';
import type { Profile } from '../profiles/index.js';
import { ensureDir } from '../services/file-writer.js';
import type { FileWriter } from '../services/file-writer.js';
import { PLUGIN_VERSION } from '../version.js';

export type CursorSetupOptions = {
  cwd: string;
  profiles: Profile[];
  writer: FileWriter;
  isSalesforceProject: boolean;
  /** Prompts the user to choose project vs user-level scope. */
  promptScope(this: void): Promise<'project' | 'user'>;
  /** Prints content to the console for manual paste (user-level option). */
  printToConsole(this: void, content: string): void;
};

export async function setupCursor(opts: CursorSetupOptions): Promise<void> {
  const { cwd, profiles, writer, isSalesforceProject, promptScope, printToConsole } = opts;
  const rulesDir = join(cwd, '.cursor', 'rules');

  ensureDir(rulesDir);
  writer.write(join(rulesDir, 'agent-guidelines.mdc'), generateBaseGuidelines(PLUGIN_VERSION));
  writer.write(join(rulesDir, 'sub-agent-protocol.mdc'), generateSubAgentProtocol(profiles, PLUGIN_VERSION));

  if (!isSalesforceProject) {
    for (const profile of profiles) {
      writer.write(join(rulesDir, profile.ruleFile), profile.ruleContent());
    }
    return;
  }

  const scope = await promptScope();

  if (scope === 'project') {
    writer.write(join(rulesDir, 'salesforce-standards.mdc'), generateSfStandards(PLUGIN_VERSION));
    for (const profile of profiles) {
      writer.write(join(rulesDir, profile.ruleFile), profile.ruleContent());
    }
  } else {
    printToConsole(
      [
        '─'.repeat(60),
        generateSfStandards(PLUGIN_VERSION),
        ...profiles.map((p) => p.ruleContent()),
        '─'.repeat(60),
        '→ Cursor Settings (Ctrl+Shift+J) → Rules for AI → paste above.',
      ].join('\n')
    );
  }

  if (isSalesforceProject) {
    setupWorkflows(cwd, profiles, writer);
  }
}

function setupWorkflows(cwd: string, profiles: Profile[], writer: FileWriter): void {
  const workflowsDir = join(cwd, '.a4drules', 'workflows');
  if (!existsSync(workflowsDir)) {
    // Only create the workflows dir if .a4drules already exists or is being created by agentforce setup
    // Cursor setup only populates workflows when .a4drules is already present
    return;
  }
  for (const profile of profiles) {
    if (!profile.workflows) continue;
    const workflowFiles = profile.workflows(PLUGIN_VERSION);
    for (const [filename, content] of Object.entries(workflowFiles)) {
      writer.write(join(workflowsDir, filename), content);
    }
  }
}
