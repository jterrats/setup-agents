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
import {
  generateStoryMappingSkill,
  generateDeploySkill,
  generateDiagramExportSkill,
  getPortableSkillSections,
  getSharedSkillAssets,
} from '../../../src/generators/skill-generator.js';

describe('skill-generator', () => {
  describe('generateStoryMappingSkill()', () => {
    it('returns SKILL.md, render-pdf.sh script and mermaid-pdf.css', () => {
      const files = generateStoryMappingSkill();
      expect(files).to.have.keys(['SKILL.md', 'scripts/render-pdf.sh', 'assets/mermaid-pdf.css']);
    });

    it('SKILL.md contains valid YAML frontmatter with name and description', () => {
      const skillMd = generateStoryMappingSkill()['SKILL.md'];
      expect(skillMd).to.match(/^---\nname: story-mapping/);
      expect(skillMd).to.include('description:');
    });

    it('SKILL.md includes the story map markdown template', () => {
      const skillMd = generateStoryMappingSkill()['SKILL.md'];
      expect(skillMd).to.include('## Personas');
      expect(skillMd).to.include('## Priority Legend');
      expect(skillMd).to.include('Epic 1:');
      expect(skillMd).to.include('US ID');
      expect(skillMd).to.include('Acceptance Criteria');
    });

    it('SKILL.md includes Mermaid diagram example with subgraphs', () => {
      const skillMd = generateStoryMappingSkill()['SKILL.md'];
      expect(skillMd).to.include('```mermaid');
      expect(skillMd).to.include('subgraph epic1');
      expect(skillMd).to.include('graph LR');
    });

    it('SKILL.md includes Gherkin acceptance criteria format', () => {
      const skillMd = generateStoryMappingSkill()['SKILL.md'];
      expect(skillMd).to.include('Given');
      expect(skillMd).to.include('When');
      expect(skillMd).to.include('Then');
    });

    it('SKILL.md references render-pdf.sh for PDF rendering', () => {
      const skillMd = generateStoryMappingSkill()['SKILL.md'];
      expect(skillMd).to.include('render-pdf.sh');
    });

    it('SKILL.md includes Prerequisites table', () => {
      const skillMd = generateStoryMappingSkill()['SKILL.md'];
      expect(skillMd).to.include('## Prerequisites');
      expect(skillMd).to.include('Node.js >= 18');
      expect(skillMd).to.include('npx');
    });

    it('SKILL.md includes "no diagram detected" validation instructions', () => {
      const skillMd = generateStoryMappingSkill()['SKILL.md'];
      expect(skillMd).to.include('No diagram detected');
    });

    it('render-pdf.sh includes npx dependency guard', () => {
      const script = generateStoryMappingSkill()['scripts/render-pdf.sh'];
      expect(script).to.include('command -v npx');
      expect(script).to.include('Node.js >= 18');
    });

    it('render-pdf.sh calls mermaid-cli mmdc', () => {
      const script = generateStoryMappingSkill()['scripts/render-pdf.sh'];
      expect(script).to.include('@mermaid-js/mermaid-cli mmdc');
    });

    it('render-pdf.sh validates for "no diagram detected"', () => {
      const script = generateStoryMappingSkill()['scripts/render-pdf.sh'];
      expect(script).to.include('no diagram detected');
    });

    it('render-pdf.sh uses --pdfFit flag', () => {
      const script = generateStoryMappingSkill()['scripts/render-pdf.sh'];
      expect(script).to.include('--pdfFit');
    });

    it('mermaid-pdf.css prevents SVG truncation', () => {
      const css = generateStoryMappingSkill()['assets/mermaid-pdf.css'];
      expect(css).to.include('max-width: none !important');
      expect(css).to.include('overflow: visible !important');
    });
  });

  describe('generateDeploySkill()', () => {
    it('returns SKILL.md', () => {
      const files = generateDeploySkill();
      expect(files).to.have.key('SKILL.md');
    });

    it('SKILL.md contains valid YAML frontmatter with name and description', () => {
      const skillMd = generateDeploySkill()['SKILL.md'];
      expect(skillMd).to.match(/^---\nname: sf-deploy/);
      expect(skillMd).to.include('description:');
    });

    it('SKILL.md includes Prerequisites table with --force flag', () => {
      const skillMd = generateDeploySkill()['SKILL.md'];
      expect(skillMd).to.include('## Prerequisites');
      expect(skillMd).to.include('--force');
      expect(skillMd).to.include('unsigned community plugins');
    });

    it('SKILL.md includes plugin prerequisite check with auto-install', () => {
      const skillMd = generateDeploySkill()['SKILL.md'];
      expect(skillMd).to.include('sf plugins inspect @jterrats/profiler');
      expect(skillMd).to.include('sf plugins inspect @jterrats/smart-deployment');
      expect(skillMd).to.include('sf plugins install @jterrats/profiler --force');
      expect(skillMd).to.include('sf plugins install @jterrats/smart-deployment --force');
    });

    it('SKILL.md documents sf profiler retrieve with key flags', () => {
      const skillMd = generateDeploySkill()['SKILL.md'];
      expect(skillMd).to.include('sf profiler retrieve');
      expect(skillMd).to.include('--from-project');
      expect(skillMd).to.include('--all-fields');
      expect(skillMd).to.include('--exclude-managed');
      expect(skillMd).to.include('--dry-run');
    });

    it('SKILL.md documents sf profiler compare with multi-org sources', () => {
      const skillMd = generateDeploySkill()['SKILL.md'];
      expect(skillMd).to.include('sf profiler compare');
      expect(skillMd).to.include('--sources');
      expect(skillMd).to.include('--output-format html');
    });

    it('SKILL.md documents sf profiler docs', () => {
      const skillMd = generateDeploySkill()['SKILL.md'];
      expect(skillMd).to.include('sf profiler docs');
      expect(skillMd).to.include('--output-dir profile-docs');
    });

    it('SKILL.md documents smart-deployment commands', () => {
      const skillMd = generateDeploySkill()['SKILL.md'];
      expect(skillMd).to.include('sf smart-deployment analyze');
      expect(skillMd).to.include('sf smart-deployment validate');
      expect(skillMd).to.include('sf smart-deployment start');
      expect(skillMd).to.include('sf smart-deployment resume');
    });

    it('SKILL.md includes Salesforce limits table', () => {
      const skillMd = generateDeploySkill()['SKILL.md'];
      expect(skillMd).to.include('300');
      expect(skillMd).to.include('200');
      expect(skillMd).to.include('Max components per wave');
    });

    it('SKILL.md includes combined pipeline workflow', () => {
      const skillMd = generateDeploySkill()['SKILL.md'];
      expect(skillMd).to.include('Step 1');
      expect(skillMd).to.include('Step 2');
      expect(skillMd).to.include('Step 3');
      expect(skillMd).to.include('Step 4');
      expect(skillMd).to.include('Step 5');
    });

    it('SKILL.md includes quick reference table', () => {
      const skillMd = generateDeploySkill()['SKILL.md'];
      expect(skillMd).to.include('Quick Reference');
      expect(skillMd).to.include('Retrieve profiles');
      expect(skillMd).to.include('Deploy waves');
    });
  });

  describe('generateDiagramExportSkill()', () => {
    it('SKILL.md includes Prerequisites table', () => {
      const skillMd = generateDiagramExportSkill()['SKILL.md'];
      expect(skillMd).to.include('## Prerequisites');
      expect(skillMd).to.include('Node.js >= 18');
      expect(skillMd).to.include('mermaid-to-drawio');
    });

    it('export-diagram.sh includes npx dependency guard', () => {
      const script = generateDiagramExportSkill()['scripts/export-diagram.sh'];
      expect(script).to.include('command -v npx');
      expect(script).to.include('Node.js >= 18');
    });
  });

  describe('getPortableSkillSections()', () => {
    it('returns story mapping and diagram export sections for ba profile', () => {
      const sections = getPortableSkillSections(['ba']);
      expect(sections).to.have.lengthOf(2);
      expect(sections[0].title).to.equal('Story Mapping');
      expect(sections[1].title).to.equal('Diagram Export');
    });

    it('returns deploy section for developer profile', () => {
      const sections = getPortableSkillSections(['developer']);
      expect(sections).to.have.lengthOf(1);
      expect(sections[0].title).to.equal('Salesforce Deploy & Validate');
    });

    it('returns all sections for architect profile', () => {
      const sections = getPortableSkillSections(['architect']);
      expect(sections).to.have.lengthOf(3);
      const titles = sections.map((s) => s.title);
      expect(titles).to.include('Story Mapping');
      expect(titles).to.include('Diagram Export');
      expect(titles).to.include('Salesforce Deploy & Validate');
    });

    it('returns empty array for profiles without skills', () => {
      const sections = getPortableSkillSections(['qa', 'crma']);
      expect(sections).to.be.empty;
    });

    it('body does not contain YAML frontmatter', () => {
      const sections = getPortableSkillSections(['developer']);
      expect(sections[0].body).to.not.match(/^---/);
    });
  });

  describe('getSharedSkillAssets()', () => {
    it('returns render-pdf.sh, mermaid-pdf.css, and export-diagram.sh for ba profile', () => {
      const assets = getSharedSkillAssets(['ba']);
      expect(assets).to.include.keys([
        'story-mapping/scripts/render-pdf.sh',
        'story-mapping/assets/mermaid-pdf.css',
        'diagram-export/scripts/export-diagram.sh',
      ]);
    });

    it('returns empty object for profiles without story-mapping assets', () => {
      const assets = getSharedSkillAssets(['developer']);
      expect(Object.keys(assets)).to.be.empty;
    });

    it('returns assets for architect profile', () => {
      const assets = getSharedSkillAssets(['architect']);
      expect(assets).to.include.keys('story-mapping/scripts/render-pdf.sh');
    });
  });
});
