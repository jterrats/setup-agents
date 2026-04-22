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
import { expect } from 'chai';
import { generateClaudeMd } from '../../../src/generators/claude-generator.js';
import { developerProfile } from '../../../src/profiles/index.js';

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

    it('includes profile sections when profiles are provided', () => {
      const content = generateClaudeMd([developerProfile], VERSION);
      expect(content).to.include('Developer');
    });

    it('does not include mdc frontmatter in profile sections', () => {
      const content = generateClaudeMd([developerProfile], VERSION);
      expect(content).to.not.match(/^---\n.*alwaysApply/m);
    });

    it('separates profiles with horizontal rules', () => {
      const content = generateClaudeMd([developerProfile], VERSION);
      expect(content).to.include('---');
    });
  });
});
