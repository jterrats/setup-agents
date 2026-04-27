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
import { aiProfile } from '../../../src/profiles/ai.js';
import { generateAiWorkflows } from '../../../src/generators/workflows/ai.js';

const VERSION = '0.1.0';

describe('aiProfile', () => {
  it('has id "ai"', () => {
    expect(aiProfile.id).to.equal('ai');
  });

  it('has label "AI / Agentforce Specialist"', () => {
    expect(aiProfile.label).to.equal('AI / Agentforce Specialist');
  });

  it('has ruleFile "ai-standards.mdc"', () => {
    expect(aiProfile.ruleFile).to.equal('ai-standards.mdc');
  });

  it('includes salesforcedx-vscode extension', () => {
    expect(aiProfile.extensions).to.include('salesforce.salesforcedx-vscode');
  });

  describe('ruleContent()', () => {
    const content = aiProfile.ruleContent();

    it('returns a non-empty string', () => {
      expect(content).to.be.a('string').and.not.be.empty;
    });

    it('includes alwaysApply frontmatter', () => {
      expect(content).to.include('alwaysApply: true');
    });

    it('contains Agent Design Principles section', () => {
      expect(content).to.include('## Agent Design Principles');
    });

    it('contains Agent Builder Workflow section', () => {
      expect(content).to.include('## Agent Builder Workflow');
    });

    it('contains Prompt Templates section', () => {
      expect(content).to.include('## Prompt Templates');
    });

    it('contains Topics & Actions section', () => {
      expect(content).to.include('## Topics & Actions');
    });

    it('contains Testing section', () => {
      expect(content).to.include('## Testing');
    });

    it('contains Grounding & Context section', () => {
      expect(content).to.include('## Grounding & Context');
    });

    it('contains Guardrails section', () => {
      expect(content).to.include('## Guardrails');
    });

    it('references sf agent generate agent-spec', () => {
      expect(content).to.include('sf agent generate agent-spec');
    });

    it('references sf agent test run', () => {
      expect(content).to.include('sf agent test run');
    });

    it('references sf agent publish', () => {
      expect(content).to.include('sf agent publish');
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
      tempDir = mkdtempSync(join(tmpdir(), 'ai-detect-'));
    });

    afterEach(() => {
      rmSync(tempDir, { recursive: true, force: true });
    });

    it('returns true when bots directory exists', () => {
      mkdirSync(join(tempDir, 'force-app/main/default/bots'), { recursive: true });
      expect(aiProfile.detect!(tempDir)).to.equal(true);
    });

    it('returns true when aiApplications directory exists', () => {
      mkdirSync(join(tempDir, 'force-app/main/default/aiApplications'), { recursive: true });
      expect(aiProfile.detect!(tempDir)).to.equal(true);
    });

    it('returns false for an empty directory', () => {
      expect(aiProfile.detect!(tempDir)).to.equal(false);
    });
  });

  describe('workflows()', () => {
    it('returns create-agent, test-agent, and deploy-agent files', () => {
      expect(generateAiWorkflows(VERSION)).to.have.keys(['create-agent.md', 'test-agent.md', 'deploy-agent.md']);
    });

    it('each workflow includes the setup-agents version comment', () => {
      for (const content of Object.values(generateAiWorkflows(VERSION))) {
        expect(content).to.include(`<!-- setup-agents: ${VERSION} -->`);
      }
    });
  });
});
