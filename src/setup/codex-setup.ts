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
import { join } from 'node:path';
import { generateAgentsMd, generateAgentsMdForceApp, generateCodexProfileRule } from '../generators/codex-generator.js';
import type { Profile } from '../profiles/index.js';
import { ensureDir } from '../services/file-writer.js';
import type { FileWriter } from '../services/file-writer.js';
import { PLUGIN_VERSION } from '../version.js';

export type CodexSetupOptions = {
  cwd: string;
  profiles: Profile[];
  writer: FileWriter;
  isSalesforceProject: boolean;
};

export function setupCodex(opts: CodexSetupOptions): void {
  const { cwd, profiles, writer, isSalesforceProject } = opts;
  const codexDir = join(cwd, '.codex');

  writer.write(join(cwd, 'AGENTS.md'), generateAgentsMd(profiles, PLUGIN_VERSION));

  if (profiles.length > 0) {
    ensureDir(codexDir);
    for (const profile of profiles) {
      writer.write(join(codexDir, `${profile.id}.md`), generateCodexProfileRule(profile, PLUGIN_VERSION));
    }
  }

  if (isSalesforceProject && existsSync(join(cwd, 'force-app'))) {
    const forceAppMd = generateAgentsMdForceApp(profiles, PLUGIN_VERSION);
    if (forceAppMd) {
      writer.write(join(cwd, 'force-app', 'AGENTS.md'), forceAppMd);
    }
  }
}
