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
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect } from 'chai';
import { PROFILE_TOOLSETS } from '../../../src/profiles/toolsets.js';

describe('PROFILE_TOOLSETS (shared)', () => {
  it('has an entry for every ProfileId', () => {
    const expected = [
      'developer',
      'architect',
      'ba',
      'pm',
      'mulesoft',
      'ux',
      'cgcloud',
      'devops',
      'qa',
      'crma',
      'commerce',
      'data360',
      'admin',
      'sfmc',
      'security',
      'service',
      'cpq',
      'omnistudio',
      'fsl',
      'ai',
      'slack',
      'tableau',
    ];
    expect(Object.keys(PROFILE_TOOLSETS).sort()).to.deep.equal(expected.sort());
  });

  it('every entry has at least one toolset', () => {
    for (const [id, toolsets] of Object.entries(PROFILE_TOOLSETS)) {
      expect(toolsets.length, `${id} should have at least one toolset`).to.be.greaterThan(0);
    }
  });

  it('stays in sync with extension mcpConfigService.ts copy', () => {
    const extFile = readFileSync(
      join(process.cwd(), 'extensions', 'vscode-setup-agents-ui', 'src', 'services', 'mcpConfigService.ts'),
      'utf8'
    );
    for (const [profileId, toolsets] of Object.entries(PROFILE_TOOLSETS)) {
      const pattern = `${profileId}: \\[${toolsets.map((t) => `'${t}'`).join(', ')}\\]`;
      expect(extFile).to.match(new RegExp(pattern), `Extension copy must match for "${profileId}"`);
    }
  });
});
