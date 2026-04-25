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
import { baProfile } from '../../../src/profiles/ba.js';
import { developerProfile } from '../../../src/profiles/developer.js';
import { architectProfile } from '../../../src/profiles/architect.js';
import { qaProfile } from '../../../src/profiles/qa.js';
import {
  generateBaseGuidelines,
  generateSfStandards,
  generateSubAgentProtocol,
} from '../../../src/generators/mdc-generator.js';

const VERSION = '0.1.0';

describe('mdc-generator', () => {
  describe('generateBaseGuidelines()', () => {
    it('includes pluginVersion in frontmatter', () => {
      const content = generateBaseGuidelines(VERSION);
      expect(content).to.include(`pluginVersion: "${VERSION}"`);
    });

    it('includes alwaysApply: true', () => {
      expect(generateBaseGuidelines(VERSION)).to.include('alwaysApply: true');
    });

    it('includes General Principles section', () => {
      expect(generateBaseGuidelines(VERSION)).to.include('## General Principles');
    });

    it('includes Active Job Monitoring section', () => {
      const content = generateBaseGuidelines(VERSION);
      expect(content).to.include('## Active Job Monitoring');
      expect(content).to.include('monitor it to completion');
    });

    it('includes Planning section', () => {
      expect(generateBaseGuidelines(VERSION)).to.include('## Planning');
    });

    it('includes Language Policy section', () => {
      expect(generateBaseGuidelines(VERSION)).to.include('## Language Policy');
    });

    it('Language Policy defaults agent outputs to English', () => {
      const content = generateBaseGuidelines(VERSION);
      expect(content).to.include('Default all agent-facing outputs to English');
    });

    it('Language Policy preserves metadata language conventions', () => {
      const content = generateBaseGuidelines(VERSION);
      expect(content).to.include('Preserve project/business conventions in Salesforce metadata');
    });

    it('Planning section requires confirmation before edits', () => {
      const content = generateBaseGuidelines(VERSION);
      expect(content).to.include('wait for explicit user confirmation');
    });

    it('Planning section mentions scope re-confirmation', () => {
      const content = generateBaseGuidelines(VERSION);
      expect(content).to.include('pause and re-confirm');
    });

    it('includes Command Execution Safety section', () => {
      const content = generateBaseGuidelines(VERSION);
      expect(content).to.include('## Command Execution Safety (CRITICAL)');
    });

    it('Command Execution Safety forbids sudo', () => {
      const content = generateBaseGuidelines(VERSION);
      expect(content).to.include('NEVER use `sudo`');
    });

    it('Command Execution Safety recommends running CLI tools outside sandbox', () => {
      const content = generateBaseGuidelines(VERSION);
      expect(content).to.include('Run CLI tools outside the sandbox');
      expect(content).to.include('required_permissions');
    });

    it('includes Token-Efficient Visual Editing section', () => {
      const content = generateBaseGuidelines(VERSION);
      expect(content).to.include('## Token-Efficient Visual Editing');
      expect(content).to.include('visual tool');
      expect(content).to.include('mermaid-editor-live.vercel.app');
    });
  });

  describe('generateSfStandards()', () => {
    it('includes pluginVersion in frontmatter', () => {
      expect(generateSfStandards(VERSION)).to.include(`pluginVersion: "${VERSION}"`);
    });

    it('includes trigger strategy rule', () => {
      expect(generateSfStandards(VERSION)).to.include('## 5. Trigger Strategy');
    });

    it('includes sharing strategy rule', () => {
      expect(generateSfStandards(VERSION)).to.include('## 7. Sharing Strategy');
    });

    it('includes testing standards', () => {
      expect(generateSfStandards(VERSION)).to.include('## 17. Testing Standards');
    });

    it('includes documentation language guidance', () => {
      expect(generateSfStandards(VERSION)).to.include('Keep agent/tooling communication in English by default');
    });

    it('includes Setup Path Verification rule', () => {
      const content = generateSfStandards(VERSION);
      expect(content).to.include('Setup Path Verification (CRITICAL)');
      expect(content).to.include('VERIFY PATH');
    });

    it('includes Salesforce Documentation Citation rule', () => {
      const content = generateSfStandards(VERSION);
      expect(content).to.include('Documentation Citation (CRITICAL)');
      expect(content).to.include('help.salesforce.com');
      expect(content).to.include('developer.salesforce.com');
    });
  });

  describe('generateSubAgentProtocol()', () => {
    it('lists active profiles in the role registry', () => {
      const content = generateSubAgentProtocol([developerProfile], VERSION);
      expect(content).to.include('developer-standards.mdc');
    });

    it('includes task routing for all provided profiles', () => {
      const content = generateSubAgentProtocol([developerProfile, architectProfile], VERSION);
      expect(content).to.include('developer-standards.mdc');
      expect(content).to.include('architect-standards.mdc');
    });

    it('includes pluginVersion in frontmatter', () => {
      expect(generateSubAgentProtocol([developerProfile], VERSION)).to.include(`pluginVersion: "${VERSION}"`);
    });

    it('shows fallback message when no profiles are provided', () => {
      const content = generateSubAgentProtocol([], VERSION);
      expect(content).to.include('No specific profiles active');
    });

    it('includes Collaboration Flows when multiple profiles are active', () => {
      const content = generateSubAgentProtocol([baProfile, architectProfile, developerProfile, qaProfile], VERSION);
      expect(content).to.include('## Collaboration Flows');
      expect(content).to.include('BA → Architect');
      expect(content).to.include('Architect → Developer');
      expect(content).to.include('Developer → QA');
    });

    it('omits Collaboration Flows when no handoff pairs match', () => {
      const content = generateSubAgentProtocol([developerProfile], VERSION);
      expect(content).to.not.include('## Collaboration Flows');
    });
  });
});
