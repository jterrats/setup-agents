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
import { generateClaudeMd, generateClaudeProfileRule } from '../../../src/generators/claude-generator.js';
import { baProfile } from '../../../src/profiles/ba.js';
import { developerProfile } from '../../../src/profiles/index.js';
import { qaProfile } from '../../../src/profiles/qa.js';

const VERSION = '0.1.0';

describe('claude-generator', () => {
  describe('generateClaudeMd()', () => {
    it('includes the setup-agents version comment', () => {
      const content = generateClaudeMd([], VERSION);
      expect(content).to.include(`<!-- setup-agents: ${VERSION} -->`);
    });

    it('includes the CLAUDE.md title', () => {
      const content = generateClaudeMd([], VERSION);
      expect(content).to.include('# CLAUDE.md');
    });

    it('includes base general principles', () => {
      const content = generateClaudeMd([], VERSION);
      expect(content).to.include('## General Principles');
      expect(content).to.include('## Code Quality');
      expect(content).to.include('## Security');
    });

    it('emits @import lines for each profile', () => {
      const content = generateClaudeMd([developerProfile, baProfile], VERSION);
      expect(content).to.include('@.claude/rules/developer.md');
      expect(content).to.include('@.claude/rules/ba.md');
    });

    it('does not emit @import section when no profiles given', () => {
      const content = generateClaudeMd([], VERSION);
      expect(content).to.not.include('@.claude/rules/');
    });

    it('does not inline profile body in root CLAUDE.md', () => {
      const content = generateClaudeMd([developerProfile], VERSION);
      expect(content).to.not.match(/^---\n.*alwaysApply/m);
      expect(content).to.not.include('Salesforce Deploy');
    });
  });

  describe('generateClaudeProfileRule()', () => {
    it('includes the setup-agents version comment', () => {
      const content = generateClaudeProfileRule(developerProfile, VERSION);
      expect(content).to.include(`<!-- setup-agents: ${VERSION} -->`);
    });

    it('includes profile content without mdc frontmatter', () => {
      const content = generateClaudeProfileRule(developerProfile, VERSION);
      expect(content).to.not.match(/^---\n.*alwaysApply/m);
      expect(content).to.include('Developer');
    });

    it('includes skill sections for profiles that have them', () => {
      const content = generateClaudeProfileRule(developerProfile, VERSION);
      expect(content).to.include('Salesforce Deploy & Validate');
    });

    it('includes story mapping skills for ba profile', () => {
      const content = generateClaudeProfileRule(baProfile, VERSION);
      expect(content).to.include('Story Mapping');
      expect(content).to.include('Jeff Patton');
    });

    it('does not include skill sections for profiles without matching skills', () => {
      const content = generateClaudeProfileRule(qaProfile, VERSION);
      expect(content).to.not.include('Story Mapping');
      expect(content).to.not.include('sf profiler retrieve');
    });
  });
});
