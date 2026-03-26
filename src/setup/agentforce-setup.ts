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
import { generateA4dBaseGuidelines } from '../generators/agentforce-generator.js';
import { generateSfStandards } from '../generators/mdc-generator.js';
import { generateSubAgentProtocol } from '../generators/mdc-generator.js';
import { toA4dContent } from '../generators/shared.js';
import { generateBaseWorkflows } from '../generators/workflow-generator.js';
import type { Profile } from '../profiles/index.js';
import { ensureDir } from '../services/file-writer.js';
import type { FileWriter } from '../services/file-writer.js';
import { PLUGIN_VERSION } from '../version.js';

export type AgentforceSetupOptions = {
  cwd: string;
  profiles: Profile[];
  writer: FileWriter;
  isSalesforceProject: boolean;
};

export function setupAgentforce(opts: AgentforceSetupOptions): void {
  const { cwd, profiles, writer, isSalesforceProject } = opts;
  const a4dDir = join(cwd, '.a4drules');
  const workflowsDir = join(a4dDir, 'workflows');

  ensureDir(a4dDir);
  ensureDir(workflowsDir);

  writer.write(join(a4dDir, '00-base-guidelines.md'), generateA4dBaseGuidelines(PLUGIN_VERSION));

  if (isSalesforceProject) {
    writer.write(
      join(a4dDir, '01-salesforce-standards.md'),
      toA4dContent(generateSfStandards(PLUGIN_VERSION), PLUGIN_VERSION)
    );
  }

  profiles.forEach((profile, i) => {
    const index = String(i + 2).padStart(2, '0');
    writer.write(
      join(a4dDir, `${index}-${profile.ruleFile.replace('.mdc', '.md')}`),
      toA4dContent(profile.ruleContent(), PLUGIN_VERSION)
    );
  });

  writer.write(
    join(a4dDir, '99-sub-agent-protocol.md'),
    toA4dContent(generateSubAgentProtocol(profiles, PLUGIN_VERSION), PLUGIN_VERSION)
  );

  if (isSalesforceProject) {
    for (const [filename, content] of Object.entries(generateBaseWorkflows(PLUGIN_VERSION))) {
      writer.write(join(workflowsDir, filename), content);
    }
  }

  for (const profile of profiles) {
    if (!profile.workflows) continue;
    for (const [filename, content] of Object.entries(profile.workflows(PLUGIN_VERSION))) {
      writer.write(join(workflowsDir, filename), content);
    }
  }
}
