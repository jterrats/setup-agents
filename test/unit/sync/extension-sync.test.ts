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
import { ALL_PROFILES } from '../../../src/profiles/index.js';
import { PROFILE_TOOLSETS } from '../../../src/profiles/toolsets.js';
import { MCP_INTEGRATIONS } from '../../../src/integrations/mcp-registry.js';

const EXT_ROOT = join(process.cwd(), 'extensions', 'vscode-setup-agents-ui', 'src');

function readExtFile(relativePath: string): string {
  return readFileSync(join(EXT_ROOT, relativePath), 'utf8');
}

// ─── ProfileId Union Sync ────────────────────────────────────────────────────

describe('Extension ← CLI sync: ProfileId', () => {
  const extTypes = readExtFile('types.ts');

  for (const profile of ALL_PROFILES) {
    it(`extension types.ts contains ProfileId '${profile.id}'`, () => {
      expect(extTypes).to.include(`'${profile.id}'`);
    });
  }

  it('extension ProfileId count matches CLI', () => {
    const profileIdBlock = extTypes.substring(
      extTypes.indexOf('export type ProfileId ='),
      extTypes.indexOf(';', extTypes.indexOf('export type ProfileId ='))
    );
    const extMatches = profileIdBlock.match(/'\w+'/g) ?? [];
    expect(extMatches.length).to.equal(ALL_PROFILES.length);
  });
});

// ─── ALL_PROFILES Metadata Sync ──────────────────────────────────────────────

describe('Extension ← CLI sync: ALL_PROFILES', () => {
  const extConstants = readExtFile('constants.ts');

  for (const profile of ALL_PROFILES) {
    it(`extension constants.ts contains profile id '${profile.id}'`, () => {
      expect(extConstants).to.include(`id: '${profile.id}'`);
    });
  }

  for (const profile of ALL_PROFILES) {
    it(`extension constants.ts has matching ruleFile for '${profile.id}'`, () => {
      expect(extConstants).to.include(`ruleFile: '${profile.ruleFile}'`);
    });
  }

  it('extension ALL_PROFILES count matches CLI', () => {
    const extIdMatches = extConstants.match(/id: '/g) ?? [];
    const profileCount = extIdMatches.length;
    expect(profileCount).to.be.at.least(ALL_PROFILES.length);
  });
});

// ─── PROFILE_TOOLSETS Sync ───────────────────────────────────────────────────

describe('Extension ← CLI sync: PROFILE_TOOLSETS', () => {
  const extMcpService = readExtFile('services/mcpConfigService.ts');

    for (const [profileId, toolsets] of Object.entries(PROFILE_TOOLSETS)) {
    it(`extension mcpConfigService.ts has toolsets for '${profileId}'`, () => {
      const values: string[] = toolsets;
      const pattern = `${profileId}: \\[${values.map((t) => `'${t}'`).join(', ')}\\]`;
      expect(extMcpService).to.match(new RegExp(pattern));
    });
  }

  it('extension PROFILE_TOOLSETS key count matches CLI', () => {
    const cliKeys = Object.keys(PROFILE_TOOLSETS);
    for (const key of cliKeys) {
      expect(extMcpService).to.include(`${key}:`);
    }
  });
});

// ─── MCP_INTEGRATIONS Sync ───────────────────────────────────────────────────

describe('Extension ← CLI sync: MCP_INTEGRATIONS', () => {
  const extConstants = readExtFile('constants.ts');

  for (const integration of MCP_INTEGRATIONS) {
    it(`extension has integration id '${integration.id}'`, () => {
      expect(extConstants).to.include(`id: '${integration.id}'`);
    });
  }

  for (const integration of MCP_INTEGRATIONS) {
    it(`extension has matching label '${integration.label}' for '${integration.id}'`, () => {
      expect(extConstants).to.include(`label: '${integration.label}'`);
    });
  }

  for (const integration of MCP_INTEGRATIONS) {
    it(`extension has matching transport '${integration.config.transport}' for '${integration.id}'`, () => {
      expect(extConstants).to.include(`transport: '${integration.config.transport}'`);
    });
  }

  for (const integration of MCP_INTEGRATIONS) {
    it(`extension has matching envVar count for '${integration.id}'`, () => {
      for (const envVar of integration.envVars) {
        expect(extConstants).to.include(`name: '${envVar.name}'`);
      }
    });
  }

  for (const integration of MCP_INTEGRATIONS) {
    const profiles = [...integration.profiles].sort();
    it(`extension has correct profiles for '${integration.id}'`, () => {
      const idBlock = extConstants.substring(extConstants.indexOf(`id: '${integration.id}'`));
      for (const profileId of profiles) {
        expect(idBlock).to.include(`'${profileId}'`);
      }
    });
  }
});

// ─── Directory Constants Sync ────────────────────────────────────────────────

describe('Extension ← CLI sync: directory constants', () => {
  const extConstants = readExtFile('constants.ts');

  it('extension has .cursor/rules in GENERATED_RULE_DIRS', () => {
    expect(extConstants).to.include('.cursor/rules');
  });

  it('extension has .a4drules in GENERATED_RULE_DIRS', () => {
    expect(extConstants).to.include('.a4drules');
  });

  it('extension has .a4drules/workflows in GENERATED_RULE_DIRS', () => {
    expect(extConstants).to.include('.a4drules/workflows');
  });
});
