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

import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { generateBaseGuidelines, generateSfStandards, generateSubAgentProtocol } from '../generators/mdc-generator.js';
import {
  BACKLOG_SYNC_PROFILES,
  CODE_ANALYZER_PROFILES,
  DEPLOY_PROFILES,
  STORY_MAP_PROFILES,
  generateBacklogSyncSkill,
  generateCodeAnalyzerSkill,
  generateDeploySkill,
  generateDiagramExportSkill,
  generateStoryMappingSkill,
} from '../generators/skill-generator.js';
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
  /** Logs informational messages to the user. */
  logInfo(this: void, msg: string): void;
};

export async function setupCursor(opts: CursorSetupOptions): Promise<void> {
  const { cwd, profiles, writer, isSalesforceProject, promptScope, logInfo } = opts;
  const projectRulesDir = join(cwd, '.cursor', 'rules');

  ensureDir(projectRulesDir);
  writer.write(join(projectRulesDir, 'agent-guidelines.mdc'), generateBaseGuidelines(PLUGIN_VERSION));
  writer.write(join(projectRulesDir, 'sub-agent-protocol.mdc'), generateSubAgentProtocol(profiles, PLUGIN_VERSION));

  if (isSalesforceProject) {
    const scope = await promptScope();
    const targetRulesDir = scope === 'user' ? join(homedir(), '.cursor', 'rules') : projectRulesDir;

    if (scope === 'user') {
      ensureDir(targetRulesDir);
      logInfo(`Writing Salesforce rules to user-level directory: ${targetRulesDir}`);
    }

    writer.write(join(targetRulesDir, 'salesforce-standards.mdc'), generateSfStandards(PLUGIN_VERSION));
    for (const profile of profiles) {
      writer.write(join(targetRulesDir, profile.ruleFile), profile.ruleContent());
    }

    setupWorkflows(cwd, profiles, writer);
  } else {
    for (const profile of profiles) {
      writer.write(join(projectRulesDir, profile.ruleFile), profile.ruleContent());
    }
  }

  setupSkills(cwd, profiles, writer);
}

function setupWorkflows(cwd: string, profiles: Profile[], writer: FileWriter): void {
  const workflowsDir = join(cwd, '.a4drules', 'workflows');
  if (!existsSync(workflowsDir)) {
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

function setupSkills(cwd: string, profiles: Profile[], writer: FileWriter): void {
  const profileIds = new Set(profiles.map((p) => p.id));
  const skillsDir = join(cwd, '.cursor', 'skills');

  const needsStoryMap = [...profileIds].some((id) => STORY_MAP_PROFILES.has(id));
  const needsDeploy = [...profileIds].some((id) => DEPLOY_PROFILES.has(id));
  const needsCodeAnalyzer = [...profileIds].some((id) => CODE_ANALYZER_PROFILES.has(id));
  const needsBacklogSync = [...profileIds].some((id) => BACKLOG_SYNC_PROFILES.has(id));

  if (!needsStoryMap && !needsDeploy && !needsCodeAnalyzer && !needsBacklogSync) return;

  ensureDir(skillsDir);

  if (needsStoryMap) {
    for (const [dirName, generator] of [
      ['story-mapping', generateStoryMappingSkill],
      ['diagram-export', generateDiagramExportSkill],
    ] as const) {
      const dir = join(skillsDir, dirName);
      const files = generator();
      for (const [relativePath, content] of Object.entries(files)) {
        const fullPath = join(dir, relativePath);
        ensureDir(join(fullPath, '..'));
        writer.write(fullPath, content);
      }
    }
  }

  if (needsDeploy) {
    writeSkill(skillsDir, 'sf-deploy', generateDeploySkill(), writer);
  }

  if (needsCodeAnalyzer) {
    writeSkill(skillsDir, 'sf-code-analyzer', generateCodeAnalyzerSkill(), writer);
  }

  if (needsBacklogSync) {
    writeSkill(skillsDir, 'backlog-sync', generateBacklogSyncSkill(), writer);
  }
}

function writeSkill(skillsDir: string, dirName: string, files: Record<string, string>, writer: FileWriter): void {
  const dir = join(skillsDir, dirName);
  for (const [relativePath, content] of Object.entries(files)) {
    const fullPath = join(dir, relativePath);
    ensureDir(join(fullPath, '..'));
    writer.write(fullPath, content);
  }
}
