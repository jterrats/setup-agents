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
  generateCodeAnalyzerSkill,
  generateBacklogSyncSkill,
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

    it('render-pdf.sh validates for error patterns in log and output', () => {
      const script = generateStoryMappingSkill()['scripts/render-pdf.sh'];
      expect(script).to.include('No diagram detected');
      expect(script).to.include('ERROR_PATTERNS');
      expect(script).to.include('pdftotext');
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

    it('SKILL.md includes Active Job Monitoring section', () => {
      const skillMd = generateDeploySkill()['SKILL.md'];
      expect(skillMd).to.include('## Active Job Monitoring (CRITICAL)');
      expect(skillMd).to.include('sf project deploy report');
      expect(skillMd).to.include('gh run watch');
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

    it('export-diagram.sh includes output validation with error patterns', () => {
      const script = generateDiagramExportSkill()['scripts/export-diagram.sh'];
      expect(script).to.include('validate_output');
      expect(script).to.include('ERROR_PATTERNS');
      expect(script).to.include('No diagram detected');
      expect(script).to.include('pdftotext');
    });
  });

  describe('generateCodeAnalyzerSkill()', () => {
    it('returns SKILL.md', () => {
      const files = generateCodeAnalyzerSkill();
      expect(files).to.have.key('SKILL.md');
    });

    it('SKILL.md contains valid YAML frontmatter with name and description', () => {
      const skillMd = generateCodeAnalyzerSkill()['SKILL.md'];
      expect(skillMd).to.match(/^---\nname: sf-code-analyzer/);
      expect(skillMd).to.include('description:');
    });

    it('SKILL.md includes Prerequisites table with plugin install command', () => {
      const skillMd = generateCodeAnalyzerSkill()['SKILL.md'];
      expect(skillMd).to.include('## Prerequisites');
      expect(skillMd).to.include('@salesforce/plugin-code-analyzer');
      expect(skillMd).to.include('sf plugins install @salesforce/plugin-code-analyzer');
    });

    it('SKILL.md documents sf code-analyzer run command', () => {
      const skillMd = generateCodeAnalyzerSkill()['SKILL.md'];
      expect(skillMd).to.include('sf code-analyzer run');
      expect(skillMd).to.include('--target');
    });

    it('SKILL.md documents sf code-analyzer rules list', () => {
      const skillMd = generateCodeAnalyzerSkill()['SKILL.md'];
      expect(skillMd).to.include('sf code-analyzer rules list');
    });

    it('SKILL.md documents rule selectors for all engines', () => {
      const skillMd = generateCodeAnalyzerSkill()['SKILL.md'];
      expect(skillMd).to.include('pmd:Recommended');
      expect(skillMd).to.include('pmd:Security');
      expect(skillMd).to.include('pmd:Performance');
      expect(skillMd).to.include('pmd:Design');
      expect(skillMd).to.include('eslint:Recommended');
      expect(skillMd).to.include('eslint:Security');
      expect(skillMd).to.include('retire-js:Recommended');
      expect(skillMd).to.include('cpd:Recommended');
    });

    it('SKILL.md documents severity threshold and exit codes', () => {
      const skillMd = generateCodeAnalyzerSkill()['SKILL.md'];
      expect(skillMd).to.include('--severity-threshold');
      expect(skillMd).to.include('Exit Code');
      expect(skillMd).to.include('exit code 2');
    });

    it('SKILL.md documents output formats', () => {
      const skillMd = generateCodeAnalyzerSkill()['SKILL.md'];
      expect(skillMd).to.include('--output-format table');
      expect(skillMd).to.include('--output-format json');
      expect(skillMd).to.include('--output-format csv');
      expect(skillMd).to.include('--output-format html');
      expect(skillMd).to.include('--output-file');
    });

    it('SKILL.md includes common recipes', () => {
      const skillMd = generateCodeAnalyzerSkill()['SKILL.md'];
      expect(skillMd).to.include('Full Project Scan');
      expect(skillMd).to.include('Staged Files Only');
      expect(skillMd).to.include('Security-focused Scan');
      expect(skillMd).to.include('Duplicate Code Detection');
    });

    it('SKILL.md includes Active Job Monitoring section', () => {
      const skillMd = generateCodeAnalyzerSkill()['SKILL.md'];
      expect(skillMd).to.include('## Active Job Monitoring (CRITICAL)');
      expect(skillMd).to.include('wait for it to complete');
    });

    it('SKILL.md includes interpreting results guidance', () => {
      const skillMd = generateCodeAnalyzerSkill()['SKILL.md'];
      expect(skillMd).to.include('## 4. Interpreting Results');
      expect(skillMd).to.include('Total violation count');
      expect(skillMd).to.include('Top offending files');
      expect(skillMd).to.include('Actionable recommendations');
    });

    it('SKILL.md includes quick reference table', () => {
      const skillMd = generateCodeAnalyzerSkill()['SKILL.md'];
      expect(skillMd).to.include('Quick Reference');
      expect(skillMd).to.include('Full project scan');
      expect(skillMd).to.include('Apex security scan');
    });
  });

  describe('generateBacklogSyncSkill()', () => {
    it('returns SKILL.md', () => {
      const files = generateBacklogSyncSkill();
      expect(files).to.have.key('SKILL.md');
    });

    it('SKILL.md contains valid YAML frontmatter with name and description', () => {
      const skillMd = generateBacklogSyncSkill()['SKILL.md'];
      expect(skillMd).to.match(/^---\nname: backlog-sync/);
      expect(skillMd).to.include('description:');
    });

    it('SKILL.md includes Prerequisites table for all platforms', () => {
      const skillMd = generateBacklogSyncSkill()['SKILL.md'];
      expect(skillMd).to.include('## Prerequisites');
      expect(skillMd).to.include('gh auth status');
      expect(skillMd).to.include('glab auth status');
      expect(skillMd).to.include('az account show');
      expect(skillMd).to.include('JIRA_API_TOKEN');
      expect(skillMd).to.include('BITBUCKET_TOKEN');
    });

    it('SKILL.md includes Platform Detection section', () => {
      const skillMd = generateBacklogSyncSkill()['SKILL.md'];
      expect(skillMd).to.include('## 1. Platform Detection');
      expect(skillMd).to.include('.github/');
      expect(skillMd).to.include('.gitlab-ci.yml');
      expect(skillMd).to.include('azure-pipelines.yml');
    });

    it('SKILL.md includes Parsing the Story Map section', () => {
      const skillMd = generateBacklogSyncSkill()['SKILL.md'];
      expect(skillMd).to.include('## 2. Parsing the Story Map');
      expect(skillMd).to.include('US ID');
      expect(skillMd).to.include('US-NNN');
    });

    it('SKILL.md includes Idempotency Guard section', () => {
      const skillMd = generateBacklogSyncSkill()['SKILL.md'];
      expect(skillMd).to.include('## 3. Idempotency Guard (CRITICAL)');
      expect(skillMd).to.include('gh issue list --search');
      expect(skillMd).to.include('glab issue list --search');
      expect(skillMd).to.include('already exists');
    });

    it('SKILL.md documents issue creation for all platforms', () => {
      const skillMd = generateBacklogSyncSkill()['SKILL.md'];
      expect(skillMd).to.include('### GitHub Issues');
      expect(skillMd).to.include('### GitLab Issues');
      expect(skillMd).to.include('### Azure DevOps');
      expect(skillMd).to.include('### Jira (REST API)');
      expect(skillMd).to.include('### Bitbucket Issues');
    });

    it('SKILL.md includes Active Job Monitoring section', () => {
      const skillMd = generateBacklogSyncSkill()['SKILL.md'];
      expect(skillMd).to.include('## Active Job Monitoring (CRITICAL)');
      expect(skillMd).to.include('one by one');
    });

    it('SKILL.md includes Execution Flow with 6 steps', () => {
      const skillMd = generateBacklogSyncSkill()['SKILL.md'];
      expect(skillMd).to.include('## 5. Execution Flow');
      expect(skillMd).to.include('Detect platform');
      expect(skillMd).to.include('Verify authentication');
      expect(skillMd).to.include('Parse');
      expect(skillMd).to.include('Preview');
      expect(skillMd).to.include('Create issues');
      expect(skillMd).to.include('Final report');
    });

    it('SKILL.md includes Quick Reference table', () => {
      const skillMd = generateBacklogSyncSkill()['SKILL.md'];
      expect(skillMd).to.include('Quick Reference');
      expect(skillMd).to.include('Auth check');
      expect(skillMd).to.include('Create issue');
    });

    it('SKILL.md includes sandbox safety note for auth commands', () => {
      const skillMd = generateBacklogSyncSkill()['SKILL.md'];
      expect(skillMd).to.include('outside the sandbox');
    });
  });

  describe('getPortableSkillSections()', () => {
    it('returns story mapping, diagram export and backlog sync sections for ba profile', () => {
      const sections = getPortableSkillSections(['ba']);
      expect(sections).to.have.lengthOf(3);
      const titles = sections.map((s) => s.title);
      expect(titles).to.include('Story Mapping');
      expect(titles).to.include('Diagram Export');
      expect(titles).to.include('Backlog Sync');
    });

    it('returns deploy and code-analyzer sections for developer profile', () => {
      const sections = getPortableSkillSections(['developer']);
      expect(sections).to.have.lengthOf(2);
      const titles = sections.map((s) => s.title);
      expect(titles).to.include('Salesforce Deploy & Validate');
      expect(titles).to.include('Salesforce Code Analyzer');
    });

    it('returns all sections for architect profile', () => {
      const sections = getPortableSkillSections(['architect']);
      expect(sections).to.have.lengthOf(4);
      const titles = sections.map((s) => s.title);
      expect(titles).to.include('Story Mapping');
      expect(titles).to.include('Diagram Export');
      expect(titles).to.include('Salesforce Deploy & Validate');
      expect(titles).to.include('Salesforce Code Analyzer');
    });

    it('returns code-analyzer section for qa profile', () => {
      const sections = getPortableSkillSections(['qa']);
      expect(sections).to.have.lengthOf(1);
      expect(sections[0].title).to.equal('Salesforce Code Analyzer');
    });

    it('returns story mapping, diagram export and backlog sync sections for pm profile', () => {
      const sections = getPortableSkillSections(['pm']);
      expect(sections).to.have.lengthOf(3);
      const titles = sections.map((s) => s.title);
      expect(titles).to.include('Story Mapping');
      expect(titles).to.include('Diagram Export');
      expect(titles).to.include('Backlog Sync');
    });

    it('returns empty array for profiles without skills', () => {
      const sections = getPortableSkillSections(['crma']);
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
