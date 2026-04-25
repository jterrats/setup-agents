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
  generateBaWorkflows,
  generateCgcloudWorkflows,
  generateCrmaWorkflows,
  generateData360Workflows,
  generateDeveloperWorkflows,
  generateArchitectWorkflows,
  generateDevopsWorkflows,
  generateMulesoftWorkflows,
  generateQaWorkflows,
  generateUxWorkflows,
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

    it('deploy workflow includes active monitoring directive', () => {
      const deploy = generateBaseWorkflows(VERSION)['deploy.md'];
      expect(deploy).to.include('Active Monitoring');
      expect(deploy).to.include('sf project deploy report');
    });

    it('validate workflow includes active monitoring directive', () => {
      const validate = generateBaseWorkflows(VERSION)['validate.md'];
      expect(validate).to.include('Active Monitoring');
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
    it('returns adr, architecture-review and data-model-design files', () => {
      expect(generateArchitectWorkflows(VERSION)).to.have.keys([
        'adr.md',
        'architecture-review.md',
        'data-model-design.md',
      ]);
    });

    it('adr workflow references ADR-NNN format', () => {
      expect(generateArchitectWorkflows(VERSION)['adr.md']).to.include('ADR-NNN');
    });

    it('architecture-review workflow includes pattern selection and governor limits', () => {
      const review = generateArchitectWorkflows(VERSION)['architecture-review.md'];
      expect(review).to.include('Pattern Selection');
      expect(review).to.include('Governor Limit');
    });

    it('data-model-design workflow includes ERD and junction objects', () => {
      const erd = generateArchitectWorkflows(VERSION)['data-model-design.md'];
      expect(erd).to.include('ERD');
      expect(erd).to.include('Junction');
    });
  });

  describe('generateDevopsWorkflows()', () => {
    it('returns release and create-scratch-org files', () => {
      expect(generateDevopsWorkflows(VERSION)).to.have.keys(['release.md', 'create-scratch-org.md']);
    });

    it('release workflow includes active monitoring before tagging', () => {
      const release = generateDevopsWorkflows(VERSION)['release.md'];
      expect(release).to.include('Active Monitoring');
      expect(release).to.include('Only tag after successful validation');
    });

    it('scratch-org workflow includes active monitoring for deploy', () => {
      const scratch = generateDevopsWorkflows(VERSION)['create-scratch-org.md'];
      expect(scratch).to.include('Active Monitoring');
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

  describe('generateBaWorkflows()', () => {
    it('returns refine-stories and groom-backlog files', () => {
      expect(generateBaWorkflows(VERSION)).to.have.keys(['refine-stories.md', 'groom-backlog.md']);
    });

    it('refine-stories workflow includes Refinement Checklist', () => {
      const refine = generateBaWorkflows(VERSION)['refine-stories.md'];
      expect(refine).to.include('Refinement Checklist');
      expect(refine).to.include('Gherkin');
      expect(refine).to.include('Ready');
    });

    it('groom-backlog workflow includes MoSCoW and Value vs Effort', () => {
      const groom = generateBaWorkflows(VERSION)['groom-backlog.md'];
      expect(groom).to.include('MoSCoW');
      expect(groom).to.include('Value vs Effort');
      expect(groom).to.include('Backlog Sync');
    });
  });

  describe('generateMulesoftWorkflows()', () => {
    it('returns create-mule-api, run-munit and deploy-mule-app files', () => {
      expect(generateMulesoftWorkflows(VERSION)).to.have.keys([
        'create-mule-api.md',
        'run-munit.md',
        'deploy-mule-app.md',
      ]);
    });

    it('create-mule-api workflow includes RAML and APIkit', () => {
      const api = generateMulesoftWorkflows(VERSION)['create-mule-api.md'];
      expect(api).to.include('RAML');
      expect(api).to.include('APIkit');
    });

    it('run-munit workflow includes active monitoring', () => {
      expect(generateMulesoftWorkflows(VERSION)['run-munit.md']).to.include('Active Monitoring');
    });

    it('deploy-mule-app workflow includes CloudHub and health check', () => {
      const deploy = generateMulesoftWorkflows(VERSION)['deploy-mule-app.md'];
      expect(deploy).to.include('CloudHub');
      expect(deploy).to.include('health');
    });
  });

  describe('generateUxWorkflows()', () => {
    it('returns ux-audit and design-review files', () => {
      expect(generateUxWorkflows(VERSION)).to.have.keys(['ux-audit.md', 'design-review.md']);
    });

    it('ux-audit workflow includes LWC Interaction Checklist items', () => {
      const audit = generateUxWorkflows(VERSION)['ux-audit.md'];
      expect(audit).to.include('Cancel vs Submit');
      expect(audit).to.include('Accessibility');
      expect(audit).to.include('Custom Labels');
    });

    it('design-review workflow includes SLDS and WCAG compliance', () => {
      const review = generateUxWorkflows(VERSION)['design-review.md'];
      expect(review).to.include('SLDS Compliance');
      expect(review).to.include('WCAG');
    });
  });

  describe('generateCgcloudWorkflows()', () => {
    it('returns deploy-cgcloud and setup-cgcloud-sandbox files', () => {
      expect(generateCgcloudWorkflows(VERSION)).to.have.keys(['deploy-cgcloud.md', 'setup-cgcloud-sandbox.md']);
    });

    it('deploy-cgcloud workflow enforces CMDT-first order', () => {
      const deploy = generateCgcloudWorkflows(VERSION)['deploy-cgcloud.md'];
      expect(deploy).to.include('CMDT');
      expect(deploy).to.include('Active Monitoring');
    });

    it('setup-cgcloud-sandbox workflow includes PSG assignment and seed data', () => {
      const setup = generateCgcloudWorkflows(VERSION)['setup-cgcloud-sandbox.md'];
      expect(setup).to.include('Permission Set');
      expect(setup).to.include('sf data import tree');
    });
  });

  describe('generateData360Workflows()', () => {
    it('returns setup-data-stream and validate-identity-resolution files', () => {
      expect(generateData360Workflows(VERSION)).to.have.keys([
        'setup-data-stream.md',
        'validate-identity-resolution.md',
      ]);
    });

    it('setup-data-stream workflow includes field mapping and refresh frequency', () => {
      const stream = generateData360Workflows(VERSION)['setup-data-stream.md'];
      expect(stream).to.include('field mapping');
      expect(stream).to.include('Refresh Frequency');
    });

    it('validate-identity-resolution workflow includes match rate and spot-check', () => {
      const ir = generateData360Workflows(VERSION)['validate-identity-resolution.md'];
      expect(ir).to.include('Match rate');
      expect(ir).to.include('Spot-check');
    });
  });

  describe('generateCrmaWorkflows()', () => {
    it('returns deploy-analytics, create-recipe and create-dashboard files', () => {
      expect(generateCrmaWorkflows(VERSION)).to.have.keys([
        'deploy-analytics.md',
        'create-recipe.md',
        'create-dashboard.md',
      ]);
    });

    it('create-recipe workflow includes data lineage and incremental loads', () => {
      const recipe = generateCrmaWorkflows(VERSION)['create-recipe.md'];
      expect(recipe).to.include('lineage');
      expect(recipe).to.include('incremental');
    });

    it('create-dashboard workflow includes primary question and 12 widgets limit', () => {
      const dashboard = generateCrmaWorkflows(VERSION)['create-dashboard.md'];
      expect(dashboard).to.include('primary question');
      expect(dashboard).to.include('12 widgets');
    });
  });
});
