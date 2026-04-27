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
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect } from 'chai';
import { omnistudioProfile } from '../../../src/profiles/omnistudio.js';
import { generateOmnistudioWorkflows } from '../../../src/generators/workflows/omnistudio.js';

const VERSION = '0.1.0';

describe('omnistudioProfile', () => {
  it('has id "omnistudio"', () => {
    expect(omnistudioProfile.id).to.equal('omnistudio');
  });

  it('has label "OmniStudio / Vlocity"', () => {
    expect(omnistudioProfile.label).to.equal('OmniStudio / Vlocity');
  });

  it('has ruleFile "omnistudio-standards.mdc"', () => {
    expect(omnistudioProfile.ruleFile).to.equal('omnistudio-standards.mdc');
  });

  it('includes salesforcedx-vscode extension', () => {
    expect(omnistudioProfile.extensions).to.include('salesforce.salesforcedx-vscode');
  });

  describe('ruleContent()', () => {
    const content = omnistudioProfile.ruleContent();

    it('returns a non-empty string', () => {
      expect(content).to.be.a('string').and.not.be.empty;
    });

    it('includes alwaysApply frontmatter', () => {
      expect(content).to.include('alwaysApply: true');
    });

    it('contains OmniScript Design section', () => {
      expect(content).to.include('## OmniScript Design');
    });

    it('contains DataRaptors section', () => {
      expect(content).to.include('## DataRaptors');
    });

    it('contains Integration Procedures section', () => {
      expect(content).to.include('## Integration Procedures');
    });

    it('contains FlexCards section', () => {
      expect(content).to.include('## FlexCards');
    });

    it('contains Decision Matrices section', () => {
      expect(content).to.include('## Decision Matrices & Expression Sets');
    });

    it('contains Performance & Governor Limits section', () => {
      expect(content).to.include('## Performance & Governor Limits');
    });

    it('contains Version Control section', () => {
      expect(content).to.include('## Version Control with OmniStudio Export');
    });

    it('contains Vlocity/Industries Namespace section', () => {
      expect(content).to.include('## Vlocity/Industries Namespace');
    });

    it('references DataRaptor naming convention', () => {
      expect(content).to.include('DR_');
    });

    it('references Integration Procedure naming convention', () => {
      expect(content).to.include('IP_');
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
      tempDir = mkdtempSync(join(tmpdir(), 'omnistudio-detect-'));
    });

    afterEach(() => {
      rmSync(tempDir, { recursive: true, force: true });
    });

    it('returns true when omniScripts directory exists', () => {
      mkdirSync(join(tempDir, 'force-app/main/default/omniScripts'), { recursive: true });
      expect(omnistudioProfile.detect!(tempDir)).to.equal(true);
    });

    it('returns true when flexCards directory exists', () => {
      mkdirSync(join(tempDir, 'force-app/main/default/flexCards'), { recursive: true });
      expect(omnistudioProfile.detect!(tempDir)).to.equal(true);
    });

    it('returns false for an empty directory', () => {
      expect(omnistudioProfile.detect!(tempDir)).to.equal(false);
    });
  });

  describe('workflows()', () => {
    it('returns create-omniscript, build-integration-procedure, and design-flexcard files', () => {
      expect(generateOmnistudioWorkflows(VERSION)).to.have.keys([
        'create-omniscript.md',
        'build-integration-procedure.md',
        'design-flexcard.md',
      ]);
    });

    it('each workflow includes the setup-agents version comment', () => {
      for (const content of Object.values(generateOmnistudioWorkflows(VERSION))) {
        expect(content).to.include(`<!-- setup-agents: ${VERSION} -->`);
      }
    });
  });
});
