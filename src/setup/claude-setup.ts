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

import { join } from 'node:path';
import { generateClaudeMd, generateClaudeProfileRule } from '../generators/claude-generator.js';
import type { Profile } from '../profiles/index.js';
import { ensureDir } from '../services/file-writer.js';
import type { FileWriter } from '../services/file-writer.js';
import { PLUGIN_VERSION } from '../version.js';

export type ClaudeSetupOptions = {
  cwd: string;
  profiles: Profile[];
  writer: FileWriter;
};

export function setupClaude(opts: ClaudeSetupOptions): void {
  const { cwd, profiles, writer } = opts;
  const rulesDir = join(cwd, '.claude', 'rules');

  writer.write(join(cwd, 'CLAUDE.md'), generateClaudeMd(profiles, PLUGIN_VERSION));

  if (profiles.length > 0) {
    ensureDir(rulesDir);
    for (const profile of profiles) {
      writer.write(join(rulesDir, `${profile.id}.md`), generateClaudeProfileRule(profile, PLUGIN_VERSION));
    }
  }
}
