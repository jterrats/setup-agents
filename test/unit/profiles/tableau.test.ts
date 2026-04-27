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
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect } from 'chai';
import { tableauProfile } from '../../../src/profiles/tableau.js';
import { generateTableauWorkflows } from '../../../src/generators/workflows/tableau.js';

const VERSION = '0.1.0';

describe('tableauProfile', () => {
  it('has id "tableau"', () => {
    expect(tableauProfile.id).to.equal('tableau');
  });

  it('has label "Tableau / Analytics Cloud"', () => {
    expect(tableauProfile.label).to.equal('Tableau / Analytics Cloud');
  });

  it('has ruleFile "tableau-standards.mdc"', () => {
    expect(tableauProfile.ruleFile).to.equal('tableau-standards.mdc');
  });

  it('includes eslint extension', () => {
    expect(tableauProfile.extensions).to.include('dbaeumer.vscode-eslint');
  });

  describe('ruleContent()', () => {
    const content = tableauProfile.ruleContent();

    it('returns a non-empty string', () => {
      expect(content).to.be.a('string').and.not.be.empty;
    });

    it('includes alwaysApply frontmatter', () => {
      expect(content).to.include('alwaysApply: true');
    });

    it('contains Data Sources section', () => {
      expect(content).to.include('## Data Sources');
    });

    it('contains Calculated Fields section', () => {
      expect(content).to.include('## Calculated Fields');
    });

    it('contains Dashboard Design section', () => {
      expect(content).to.include('## Dashboard Design');
    });

    it('contains Performance section', () => {
      expect(content).to.include('## Performance');
    });

    it('contains Row-Level Security section', () => {
      expect(content).to.include('## Row-Level Security');
    });

    it('contains CRM Analytics section', () => {
      expect(content).to.include('## CRM Analytics');
    });

    it('contains Embedding section', () => {
      expect(content).to.include('## Embedding');
    });

    it('references LOD expressions', () => {
      expect(content).to.include('LOD');
    });

    it('references Tableau Embedding API v3', () => {
      expect(content).to.include('Tableau Embedding API v3');
    });

    it('references TABLEAU_SERVER_URL env var', () => {
      expect(content).to.include('TABLEAU_SERVER_URL');
    });

    it('includes shared Consultative Design section', () => {
      expect(content).to.include('## Consultative Design (CRITICAL)');
    });

    it('includes shared Semantic Commits section', () => {
      expect(content).to.include('## Semantic Commits');
    });
  });

  describe('detect()', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = mkdtempSync(join(tmpdir(), 'tableau-detect-'));
    });

    afterEach(() => {
      rmSync(tempDir, { recursive: true, force: true });
    });

    it('returns true when datasources directory exists', () => {
      mkdirSync(join(tempDir, 'datasources'), { recursive: true });
      expect(tableauProfile.detect!(tempDir)).to.equal(true);
    });

    it('returns true when workbooks directory exists', () => {
      mkdirSync(join(tempDir, 'workbooks'), { recursive: true });
      expect(tableauProfile.detect!(tempDir)).to.equal(true);
    });

    it('returns true when tableau-project.json exists', () => {
      writeFileSync(join(tempDir, 'tableau-project.json'), '{}');
      expect(tableauProfile.detect!(tempDir)).to.equal(true);
    });

    it('returns false for an empty directory', () => {
      expect(tableauProfile.detect!(tempDir)).to.equal(false);
    });
  });

  describe('workflows()', () => {
    it('returns connect-salesforce-data, publish-workbook, and embed-analytics files', () => {
      expect(generateTableauWorkflows(VERSION)).to.have.keys([
        'connect-salesforce-data.md',
        'publish-workbook.md',
        'embed-analytics.md',
      ]);
    });

    it('each workflow includes the setup-agents version comment', () => {
      for (const content of Object.values(generateTableauWorkflows(VERSION))) {
        expect(content).to.include(`<!-- setup-agents: ${VERSION} -->`);
      }
    });
  });
});
