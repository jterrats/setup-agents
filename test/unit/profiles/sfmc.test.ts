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
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect } from 'chai';
import { sfmcProfile } from '../../../src/profiles/sfmc.js';
import { generateSfmcWorkflows } from '../../../src/generators/workflows/sfmc.js';

describe('sfmcProfile', () => {
  it('has id "sfmc"', () => {
    expect(sfmcProfile.id).to.equal('sfmc');
  });

  it('has label "Marketing Cloud (SFMC)"', () => {
    expect(sfmcProfile.label).to.equal('Marketing Cloud (SFMC)');
  });

  it('has ruleFile "sfmc-standards.mdc"', () => {
    expect(sfmcProfile.ruleFile).to.equal('sfmc-standards.mdc');
  });

  it('includes AMPscript extension', () => {
    expect(sfmcProfile.extensions).to.include('sergey-agadzhanov.ampscript');
  });

  it('includes MC DevTools extension', () => {
    expect(sfmcProfile.extensions).to.include('markus-edenhauser.mc-devtools');
  });

  it('returns non-empty rule content', () => {
    expect(sfmcProfile.ruleContent().length).to.be.greaterThan(0);
  });

  it('rule content contains AMPscript section', () => {
    expect(sfmcProfile.ruleContent()).to.include('## AMPscript Best Practices');
  });

  it('rule content contains SSJS section', () => {
    expect(sfmcProfile.ruleContent()).to.include('## Server-Side JavaScript (SSJS)');
  });

  it('rule content contains Journey Builder section', () => {
    expect(sfmcProfile.ruleContent()).to.include('## Journey Builder Design');
  });

  it('rule content contains Data Extension section', () => {
    expect(sfmcProfile.ruleContent()).to.include('## Data Extension Design');
  });

  it('rule content contains SQL section', () => {
    expect(sfmcProfile.ruleContent()).to.include('## SQL for Data Extensions');
  });

  it('rule content contains Content Builder section', () => {
    expect(sfmcProfile.ruleContent()).to.include('## Content Builder');
  });

  it('rule content contains CloudPages section', () => {
    expect(sfmcProfile.ruleContent()).to.include('## CloudPages Development');
  });

  it('rule content contains Automation Studio section', () => {
    expect(sfmcProfile.ruleContent()).to.include('## Automation Studio');
  });

  it('rule content contains Error Handling section', () => {
    expect(sfmcProfile.ruleContent()).to.include('## Error Handling');
  });

  it('rule content does not reference Apex', () => {
    expect(sfmcProfile.ruleContent()).to.not.include('Apex');
  });

  it('rule content does not reference LWC', () => {
    expect(sfmcProfile.ruleContent()).to.not.include('LWC');
  });

  it('rule content does not reference sfdx-project.json', () => {
    expect(sfmcProfile.ruleContent()).to.not.include('sfdx-project.json');
  });

  it('rule content includes shared Consultative Design section', () => {
    expect(sfmcProfile.ruleContent()).to.include('## Consultative Design (CRITICAL)');
  });

  it('rule content includes shared Semantic Commits section', () => {
    expect(sfmcProfile.ruleContent()).to.include('## Semantic Commits');
  });

  it('rule content includes shared Interaction Preferences section', () => {
    expect(sfmcProfile.ruleContent()).to.include('## Interaction Preferences');
  });
});

describe('sfmcProfile.detect()', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'sfmc-detect-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns true when mc-project.json exists', () => {
    writeFileSync(join(tempDir, 'mc-project.json'), '{}');
    expect(sfmcProfile.detect!(tempDir)).to.equal(true);
  });

  it('returns true when .ampscript files exist', () => {
    writeFileSync(join(tempDir, 'welcome.ampscript'), '%%[SET @name = "test"]%%');
    expect(sfmcProfile.detect!(tempDir)).to.equal(true);
  });

  it('returns true when .ampscript files exist in subdirectories', () => {
    mkdirSync(join(tempDir, 'emails'));
    writeFileSync(join(tempDir, 'emails', 'template.ampscript'), '%%[SET @name = "test"]%%');
    expect(sfmcProfile.detect!(tempDir)).to.equal(true);
  });

  it('returns false for an empty directory', () => {
    expect(sfmcProfile.detect!(tempDir)).to.equal(false);
  });
});

describe('generateSfmcWorkflows()', () => {
  const VERSION = '1.0.0';

  it('returns create-cloudpage.md workflow', () => {
    expect(generateSfmcWorkflows(VERSION)).to.have.property('create-cloudpage.md');
  });

  it('returns build-journey.md workflow', () => {
    expect(generateSfmcWorkflows(VERSION)).to.have.property('build-journey.md');
  });

  it('returns data-extension-query.md workflow', () => {
    expect(generateSfmcWorkflows(VERSION)).to.have.property('data-extension-query.md');
  });

  it('returns exactly 3 workflows', () => {
    expect(Object.keys(generateSfmcWorkflows(VERSION))).to.have.lengthOf(3);
  });

  it('workflow content includes version stamp', () => {
    expect(generateSfmcWorkflows(VERSION)['create-cloudpage.md']).to.include(VERSION);
  });
});
