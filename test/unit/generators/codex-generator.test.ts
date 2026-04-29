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
import { expect } from 'chai';
import {
  generateAgentsMd,
  generateAgentsMdForceApp,
  generateCodexProfileRule,
} from '../../../src/generators/codex-generator.js';
import { baProfile } from '../../../src/profiles/ba.js';
import { developerProfile } from '../../../src/profiles/index.js';
import { qaProfile } from '../../../src/profiles/qa.js';

const VERSION = '0.1.0';

describe('codex-generator', () => {
  describe('generateAgentsMd()', () => {
    it('includes the setup-agents version comment', () => {
      const content = generateAgentsMd([], VERSION);
      expect(content).to.include(`<!-- setup-agents: ${VERSION} -->`);
    });

    it('includes base general principles', () => {
      const content = generateAgentsMd([], VERSION);
      expect(content).to.include('## General Principles');
      expect(content).to.include('## Code Quality');
      expect(content).to.include('## Security');
    });

    it('emits profile references pointing to .codex/<id>.md', () => {
      const content = generateAgentsMd([developerProfile, baProfile], VERSION);
      expect(content).to.include('.codex/developer.md');
      expect(content).to.include('.codex/ba.md');
    });

    it('does not emit profile references when no profiles given', () => {
      const content = generateAgentsMd([], VERSION);
      expect(content).to.not.include('.codex/');
    });

    it('does not inline profile body in root AGENTS.md', () => {
      const content = generateAgentsMd([developerProfile], VERSION);
      expect(content).to.not.match(/^---\n.*alwaysApply/m);
      expect(content).to.not.include('Salesforce Deploy');
    });
  });

  describe('generateCodexProfileRule()', () => {
    it('includes the setup-agents version comment', () => {
      const content = generateCodexProfileRule(developerProfile, VERSION);
      expect(content).to.include(`<!-- setup-agents: ${VERSION} -->`);
    });

    it('includes profile content without mdc frontmatter', () => {
      const content = generateCodexProfileRule(developerProfile, VERSION);
      expect(content).to.not.match(/^---\n.*alwaysApply/m);
      expect(content).to.include('Developer');
    });

    it('includes skill sections for profiles that have them', () => {
      const content = generateCodexProfileRule(developerProfile, VERSION);
      expect(content).to.include('Salesforce Deploy & Validate');
    });

    it('includes story mapping skills for ba profile', () => {
      const content = generateCodexProfileRule(baProfile, VERSION);
      expect(content).to.include('Story Mapping');
      expect(content).to.include('Jeff Patton');
    });

    it('does not include skill sections for profiles without matching skills', () => {
      const content = generateCodexProfileRule(qaProfile, VERSION);
      expect(content).to.not.include('Story Mapping');
      expect(content).to.not.include('sf profiler retrieve');
    });
  });

  describe('generateAgentsMdForceApp()', () => {
    it('returns empty string when no relevant profiles', () => {
      const content = generateAgentsMdForceApp([baProfile], VERSION);
      expect(content).to.equal('');
    });

    it('includes Apex and LWC rules for developer profile', () => {
      const content = generateAgentsMdForceApp([developerProfile], VERSION);
      expect(content).to.include('## Apex');
      expect(content).to.include('## LWC');
      expect(content).to.include('## Testing');
    });

    it('includes the setup-agents version comment', () => {
      const content = generateAgentsMdForceApp([developerProfile], VERSION);
      expect(content).to.include(`<!-- setup-agents: ${VERSION} -->`);
    });

    it('references the profile .codex file', () => {
      const content = generateAgentsMdForceApp([developerProfile], VERSION);
      expect(content).to.include('.codex/developer.md');
    });
  });
});
