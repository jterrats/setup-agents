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
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect } from 'chai';
import { slackProfile } from '../../../src/profiles/slack.js';
import { generateSlackWorkflows } from '../../../src/generators/workflows/slack.js';

const VERSION = '0.1.0';

describe('slackProfile', () => {
  it('has id "slack"', () => {
    expect(slackProfile.id).to.equal('slack');
  });

  it('has label "Slack Developer (Bolt.js)"', () => {
    expect(slackProfile.label).to.equal('Slack Developer (Bolt.js)');
  });

  it('has ruleFile "slack-standards.mdc"', () => {
    expect(slackProfile.ruleFile).to.equal('slack-standards.mdc');
  });

  it('includes eslint extension', () => {
    expect(slackProfile.extensions).to.include('dbaeumer.vscode-eslint');
  });

  describe('ruleContent()', () => {
    const content = slackProfile.ruleContent();

    it('returns a non-empty string', () => {
      expect(content).to.be.a('string').and.not.be.empty;
    });

    it('includes alwaysApply frontmatter', () => {
      expect(content).to.include('alwaysApply: true');
    });

    it('contains Framework section', () => {
      expect(content).to.include('## Framework');
    });

    it('contains App Manifest section', () => {
      expect(content).to.include('## App Manifest');
    });

    it('contains Event Listeners section', () => {
      expect(content).to.include('## Event Listeners');
    });

    it('contains Salesforce Integration section', () => {
      expect(content).to.include('## Salesforce Integration');
    });

    it('contains Security section', () => {
      expect(content).to.include('## Security');
    });

    it('contains Modals & Block Kit section', () => {
      expect(content).to.include('## Modals & Block Kit');
    });

    it('references ack() within 3 seconds', () => {
      expect(content).to.include('ack()');
    });

    it('references SLACK_SIGNING_SECRET', () => {
      expect(content).to.include('SLACK_SIGNING_SECRET');
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
      tempDir = mkdtempSync(join(tmpdir(), 'slack-detect-'));
    });

    afterEach(() => {
      rmSync(tempDir, { recursive: true, force: true });
    });

    it('returns true when slack.json exists', () => {
      writeFileSync(join(tempDir, 'slack.json'), '{}');
      expect(slackProfile.detect!(tempDir)).to.equal(true);
    });

    it('returns true when manifest.json exists', () => {
      writeFileSync(join(tempDir, 'manifest.json'), '{}');
      expect(slackProfile.detect!(tempDir)).to.equal(true);
    });

    it('returns false for an empty directory', () => {
      expect(slackProfile.detect!(tempDir)).to.equal(false);
    });
  });

  describe('workflows()', () => {
    it('returns create-bolt-app, add-slash-command, and deploy-slack-app files', () => {
      expect(generateSlackWorkflows(VERSION)).to.have.keys([
        'create-bolt-app.md',
        'add-slash-command.md',
        'deploy-slack-app.md',
      ]);
    });

    it('each workflow includes the setup-agents version comment', () => {
      for (const content of Object.values(generateSlackWorkflows(VERSION))) {
        expect(content).to.include(`<!-- setup-agents: ${VERSION} -->`);
      }
    });
  });
});
