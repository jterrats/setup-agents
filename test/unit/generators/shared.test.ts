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
import { stripMdcFrontmatter, toA4dContent } from '../../../src/generators/shared.js';

describe('generators/shared', () => {
  describe('stripMdcFrontmatter()', () => {
    it('removes YAML frontmatter block from mdc content', () => {
      const input = '---\ndescription: Test\nglobs:\n---\n# Title\nContent here';
      expect(stripMdcFrontmatter(input)).to.equal('# Title\nContent here');
    });

    it('returns content unchanged when there is no frontmatter', () => {
      const input = '# Title\nContent here';
      expect(stripMdcFrontmatter(input)).to.equal('# Title\nContent here');
    });
  });

  describe('toA4dContent()', () => {
    it('prepends version comment to stripped mdc content', () => {
      const mdc = '---\ndescription: Test\n---\n# Title\n';
      const result = toA4dContent(mdc, '1.2.3');
      expect(result).to.include('<!-- setup-agents: 1.2.3 -->');
      expect(result).to.include('# Title');
      expect(result).to.not.include('description: Test');
    });
  });
});
