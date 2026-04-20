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
  generateBaseWorkflows,
  generateDeveloperWorkflows,
  generateArchitectWorkflows,
  generateDevopsWorkflows,
  generateQaWorkflows,
  generateCrmaWorkflows,
} from '../../../src/generators/workflow-generator.js';

const VERSION = '0.1.0';

describe('workflow-generator', () => {
  describe('generateBaseWorkflows()', () => {
    it('returns deploy, run-tests, validate and code-quality files', () => {
      const workflows = generateBaseWorkflows(VERSION);
      expect(workflows).to.have.keys(['deploy.md', 'run-tests.md', 'validate.md', 'code-quality.md']);
    });

    it('each workflow includes the setup-agents version comment', () => {
      for (const content of Object.values(generateBaseWorkflows(VERSION))) {
        expect(content).to.include(`<!-- setup-agents: ${VERSION} -->`);
      }
    });

    it('deploy workflow includes sf project deploy start command', () => {
      expect(generateBaseWorkflows(VERSION)['deploy.md']).to.include('sf project deploy start');
    });

    it('run-tests workflow includes sf apex test run command', () => {
      expect(generateBaseWorkflows(VERSION)['run-tests.md']).to.include('sf apex test run');
    });

    it('code-quality workflow references sf code-analyzer run', () => {
      const cq = generateBaseWorkflows(VERSION)['code-quality.md'];
      expect(cq).to.include('sf code-analyzer run');
    });

    it('code-quality workflow includes Apex PMD rule selectors', () => {
      const cq = generateBaseWorkflows(VERSION)['code-quality.md'];
      expect(cq).to.include('pmd:Recommended,pmd:Security,pmd:Performance');
    });

    it('code-quality workflow includes LWC ESLint rule selectors', () => {
      const cq = generateBaseWorkflows(VERSION)['code-quality.md'];
      expect(cq).to.include('eslint:Recommended,eslint:Security');
    });

    it('code-quality workflow filters .js and .html under lwc/ excluding __tests__', () => {
      const cq = generateBaseWorkflows(VERSION)['code-quality.md'];
      expect(cq).to.include('/lwc/');
      expect(cq).to.include('__tests__');
      expect(cq).to.include('.js');
      expect(cq).to.include('.html');
    });

    it('code-quality workflow uses --severity-threshold 1', () => {
      const cq = generateBaseWorkflows(VERSION)['code-quality.md'];
      expect(cq).to.include('--severity-threshold 1');
    });

    it('code-quality workflow includes fallback for HTML targets', () => {
      const cq = generateBaseWorkflows(VERSION)['code-quality.md'];
      expect(cq).to.include('HTML targets unsupported');
    });
  });

  describe('generateDeveloperWorkflows()', () => {
    it('returns create-apex-class, create-lwc and create-trigger files', () => {
      const workflows = generateDeveloperWorkflows(VERSION);
      expect(workflows).to.have.keys(['create-apex-class.md', 'create-lwc.md', 'create-trigger.md']);
    });

    it('create-trigger workflow references Kevin OHara pattern', () => {
      expect(generateDeveloperWorkflows(VERSION)['create-trigger.md']).to.include("Kevin O'Hara");
    });
  });

  describe('generateArchitectWorkflows()', () => {
    it('returns adr.md', () => {
      expect(generateArchitectWorkflows(VERSION)).to.have.key('adr.md');
    });

    it('adr workflow references ADR-NNN format', () => {
      expect(generateArchitectWorkflows(VERSION)['adr.md']).to.include('ADR-NNN');
    });
  });

  describe('generateDevopsWorkflows()', () => {
    it('returns release and create-scratch-org files', () => {
      expect(generateDevopsWorkflows(VERSION)).to.have.keys(['release.md', 'create-scratch-org.md']);
    });
  });

  describe('generateQaWorkflows()', () => {
    it('returns run-playwright and generate-test-report files', () => {
      expect(generateQaWorkflows(VERSION)).to.have.keys(['run-playwright.md', 'generate-test-report.md']);
    });

    it('playwright workflow references npx playwright test', () => {
      expect(generateQaWorkflows(VERSION)['run-playwright.md']).to.include('npx playwright test');
    });
  });

  describe('generateCrmaWorkflows()', () => {
    it('returns deploy-analytics.md', () => {
      expect(generateCrmaWorkflows(VERSION)).to.have.key('deploy-analytics.md');
    });
  });
});
