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
import { generateBaseWorkflows } from '../../../src/generators/workflow-generator.js';
import {
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
} from '../../../src/generators/workflows/index.js';

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

    it('deploy workflow mentions Active Monitoring', () => {
      expect(generateBaseWorkflows(VERSION)['deploy.md']).to.include('Active Monitoring');
    });

    it('deploy workflow includes sf project deploy report command', () => {
      expect(generateBaseWorkflows(VERSION)['deploy.md']).to.include('sf project deploy report');
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

    it('code-quality workflow targets /lwc/ directory', () => {
      expect(generateBaseWorkflows(VERSION)['code-quality.md']).to.include('/lwc/');
    });

    it('code-quality workflow excludes __tests__ folder', () => {
      expect(generateBaseWorkflows(VERSION)['code-quality.md']).to.include('__tests__');
    });

    it('code-quality workflow includes .js files', () => {
      expect(generateBaseWorkflows(VERSION)['code-quality.md']).to.include('.js');
    });

    it('code-quality workflow includes .html files', () => {
      expect(generateBaseWorkflows(VERSION)['code-quality.md']).to.include('.html');
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

    it('architecture-review workflow includes Pattern Selection', () => {
      expect(generateArchitectWorkflows(VERSION)['architecture-review.md']).to.include('Pattern Selection');
    });

    it('architecture-review workflow includes Governor Limit', () => {
      expect(generateArchitectWorkflows(VERSION)['architecture-review.md']).to.include('Governor Limit');
    });

    it('data-model-design workflow includes ERD', () => {
      expect(generateArchitectWorkflows(VERSION)['data-model-design.md']).to.include('ERD');
    });

    it('data-model-design workflow includes Junction objects', () => {
      expect(generateArchitectWorkflows(VERSION)['data-model-design.md']).to.include('Junction');
    });
  });

  describe('generateDevopsWorkflows()', () => {
    it('returns release and create-scratch-org files', () => {
      expect(generateDevopsWorkflows(VERSION)).to.have.keys(['release.md', 'create-scratch-org.md']);
    });

    it('release workflow includes Active Monitoring', () => {
      expect(generateDevopsWorkflows(VERSION)['release.md']).to.include('Active Monitoring');
    });

    it('release workflow requires tagging only after successful validation', () => {
      expect(generateDevopsWorkflows(VERSION)['release.md']).to.include('Only tag after successful validation');
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
      expect(generateBaWorkflows(VERSION)['refine-stories.md']).to.include('Refinement Checklist');
    });

    it('refine-stories workflow includes Gherkin format', () => {
      expect(generateBaWorkflows(VERSION)['refine-stories.md']).to.include('Gherkin');
    });

    it('refine-stories workflow includes Ready status', () => {
      expect(generateBaWorkflows(VERSION)['refine-stories.md']).to.include('Ready');
    });

    it('groom-backlog workflow includes MoSCoW prioritization', () => {
      expect(generateBaWorkflows(VERSION)['groom-backlog.md']).to.include('MoSCoW');
    });

    it('groom-backlog workflow includes Value vs Effort analysis', () => {
      expect(generateBaWorkflows(VERSION)['groom-backlog.md']).to.include('Value vs Effort');
    });

    it('groom-backlog workflow includes Backlog Sync', () => {
      expect(generateBaWorkflows(VERSION)['groom-backlog.md']).to.include('Backlog Sync');
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

    it('create-mule-api workflow includes RAML spec', () => {
      expect(generateMulesoftWorkflows(VERSION)['create-mule-api.md']).to.include('RAML');
    });

    it('create-mule-api workflow includes APIkit scaffolding', () => {
      expect(generateMulesoftWorkflows(VERSION)['create-mule-api.md']).to.include('APIkit');
    });

    it('run-munit workflow includes active monitoring', () => {
      expect(generateMulesoftWorkflows(VERSION)['run-munit.md']).to.include('Active Monitoring');
    });

    it('deploy-mule-app workflow includes CloudHub target', () => {
      expect(generateMulesoftWorkflows(VERSION)['deploy-mule-app.md']).to.include('CloudHub');
    });

    it('deploy-mule-app workflow includes health check', () => {
      expect(generateMulesoftWorkflows(VERSION)['deploy-mule-app.md']).to.include('health');
    });
  });

  describe('generateUxWorkflows()', () => {
    it('returns ux-audit and design-review files', () => {
      expect(generateUxWorkflows(VERSION)).to.have.keys(['ux-audit.md', 'design-review.md']);
    });

    it('ux-audit workflow includes Cancel vs Submit check', () => {
      expect(generateUxWorkflows(VERSION)['ux-audit.md']).to.include('Cancel vs Submit');
    });

    it('ux-audit workflow includes Accessibility check', () => {
      expect(generateUxWorkflows(VERSION)['ux-audit.md']).to.include('Accessibility');
    });

    it('ux-audit workflow includes Custom Labels check', () => {
      expect(generateUxWorkflows(VERSION)['ux-audit.md']).to.include('Custom Labels');
    });

    it('design-review workflow includes SLDS Compliance', () => {
      expect(generateUxWorkflows(VERSION)['design-review.md']).to.include('SLDS Compliance');
    });

    it('design-review workflow includes WCAG compliance', () => {
      expect(generateUxWorkflows(VERSION)['design-review.md']).to.include('WCAG');
    });
  });

  describe('generateCgcloudWorkflows()', () => {
    it('returns deploy-cgcloud and setup-cgcloud-sandbox files', () => {
      expect(generateCgcloudWorkflows(VERSION)).to.have.keys(['deploy-cgcloud.md', 'setup-cgcloud-sandbox.md']);
    });

    it('deploy-cgcloud workflow enforces CMDT-first order', () => {
      expect(generateCgcloudWorkflows(VERSION)['deploy-cgcloud.md']).to.include('CMDT');
    });

    it('deploy-cgcloud workflow includes Active Monitoring', () => {
      expect(generateCgcloudWorkflows(VERSION)['deploy-cgcloud.md']).to.include('Active Monitoring');
    });

    it('setup-cgcloud-sandbox workflow includes Permission Set assignment', () => {
      expect(generateCgcloudWorkflows(VERSION)['setup-cgcloud-sandbox.md']).to.include('Permission Set');
    });

    it('setup-cgcloud-sandbox workflow includes sf data import tree', () => {
      expect(generateCgcloudWorkflows(VERSION)['setup-cgcloud-sandbox.md']).to.include('sf data import tree');
    });
  });

  describe('generateData360Workflows()', () => {
    it('returns setup-data-stream and validate-identity-resolution files', () => {
      expect(generateData360Workflows(VERSION)).to.have.keys([
        'setup-data-stream.md',
        'validate-identity-resolution.md',
      ]);
    });

    it('setup-data-stream workflow includes field mapping', () => {
      expect(generateData360Workflows(VERSION)['setup-data-stream.md']).to.include('field mapping');
    });

    it('setup-data-stream workflow includes Refresh Frequency', () => {
      expect(generateData360Workflows(VERSION)['setup-data-stream.md']).to.include('Refresh Frequency');
    });

    it('validate-identity-resolution workflow includes Match rate', () => {
      expect(generateData360Workflows(VERSION)['validate-identity-resolution.md']).to.include('Match rate');
    });

    it('validate-identity-resolution workflow includes Spot-check', () => {
      expect(generateData360Workflows(VERSION)['validate-identity-resolution.md']).to.include('Spot-check');
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

    it('create-recipe workflow includes data lineage', () => {
      expect(generateCrmaWorkflows(VERSION)['create-recipe.md']).to.include('lineage');
    });

    it('create-recipe workflow includes incremental loads', () => {
      expect(generateCrmaWorkflows(VERSION)['create-recipe.md']).to.include('incremental');
    });

    it('create-dashboard workflow includes primary question', () => {
      expect(generateCrmaWorkflows(VERSION)['create-dashboard.md']).to.include('primary question');
    });

    it('create-dashboard workflow includes 12 widgets limit', () => {
      expect(generateCrmaWorkflows(VERSION)['create-dashboard.md']).to.include('12 widgets');
    });
  });
});
