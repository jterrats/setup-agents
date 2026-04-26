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
import { expect } from 'chai';
import { MCP_INTEGRATIONS } from '../../../src/integrations/mcp-registry.js';
import { getRelevantIntegrations, buildMcpEntry, formatSetupGuide } from '../../../src/integrations/mcp-setup.js';

describe('MCP Integration Registry', () => {
  describe('MCP_INTEGRATIONS', () => {
    it('contains Figma and Jira entries', () => {
      const ids = MCP_INTEGRATIONS.map((i) => i.id);
      expect(ids).to.include('figma');
      expect(ids).to.include('jira');
    });

    it('each integration has a non-empty label', () => {
      for (const integration of MCP_INTEGRATIONS) {
        expect(integration.label).to.be.a('string').and.not.be.empty;
      }
    });

    it('each integration has at least one profile', () => {
      for (const integration of MCP_INTEGRATIONS) {
        expect(integration.profiles.size).to.be.greaterThan(0);
      }
    });

    it('each integration has a setup guide with at least one step', () => {
      for (const integration of MCP_INTEGRATIONS) {
        expect(integration.setupGuide.steps.length).to.be.greaterThan(0);
      }
    });

    it('each integration has a non-empty learn more link', () => {
      for (const integration of MCP_INTEGRATIONS) {
        expect(integration.setupGuide.learnMore).to.be.a('string').and.not.be.empty;
      }
    });

    it('Figma uses http transport', () => {
      const figma = MCP_INTEGRATIONS.find((i) => i.id === 'figma')!;
      expect(figma.config.transport).to.equal('http');
    });

    it('Figma has no env vars', () => {
      const figma = MCP_INTEGRATIONS.find((i) => i.id === 'figma')!;
      expect(figma.envVars).to.be.empty;
    });

    it('Jira uses stdio transport', () => {
      const jira = MCP_INTEGRATIONS.find((i) => i.id === 'jira')!;
      expect(jira.config.transport).to.equal('stdio');
    });

    it('Jira has exactly 3 env vars', () => {
      const jira = MCP_INTEGRATIONS.find((i) => i.id === 'jira')!;
      expect(jira.envVars).to.have.lengthOf(3);
    });

    it('Jira env vars include JIRA_BASE_URL', () => {
      const jira = MCP_INTEGRATIONS.find((i) => i.id === 'jira')!;
      const names = jira.envVars.map((v) => v.name);
      expect(names).to.include('JIRA_BASE_URL');
    });

    it('Jira env vars include JIRA_EMAIL', () => {
      const jira = MCP_INTEGRATIONS.find((i) => i.id === 'jira')!;
      const names = jira.envVars.map((v) => v.name);
      expect(names).to.include('JIRA_EMAIL');
    });

    it('Jira env vars include JIRA_API_TOKEN', () => {
      const jira = MCP_INTEGRATIONS.find((i) => i.id === 'jira')!;
      const names = jira.envVars.map((v) => v.name);
      expect(names).to.include('JIRA_API_TOKEN');
    });

    it('Jira API token is marked as secret', () => {
      const jira = MCP_INTEGRATIONS.find((i) => i.id === 'jira')!;
      const token = jira.envVars.find((v) => v.name === 'JIRA_API_TOKEN')!;
      expect(token.secret).to.be.true;
    });
  });

  describe('getRelevantIntegrations()', () => {
    it('returns Figma for ux profile', () => {
      const result = getRelevantIntegrations(['ux']);
      const ids = result.map((i) => i.id);
      expect(ids).to.include('figma');
    });

    it('returns Jira for pm profile', () => {
      const result = getRelevantIntegrations(['pm']);
      const ids = result.map((i) => i.id);
      expect(ids).to.include('jira');
    });

    it('returns both Figma and Jira for ba profile', () => {
      const result = getRelevantIntegrations(['ba']);
      const ids = result.map((i) => i.id);
      expect(ids).to.include('figma');
      expect(ids).to.include('jira');
    });

    it('returns Jira for developer profile', () => {
      const result = getRelevantIntegrations(['developer']);
      const ids = result.map((i) => i.id);
      expect(ids).to.include('jira');
    });

    it('returns drawio for developer profile', () => {
      const result = getRelevantIntegrations(['developer']);
      const ids = result.map((i) => i.id);
      expect(ids).to.include('drawio');
    });

    it('returns github for developer profile', () => {
      const result = getRelevantIntegrations(['developer']);
      const ids = result.map((i) => i.id);
      expect(ids).to.include('github');
    });

    it('does not return Figma for developer profile', () => {
      const result = getRelevantIntegrations(['developer']);
      const ids = result.map((i) => i.id);
      expect(ids).to.not.include('figma');
    });

    it('returns empty for profiles with no integrations', () => {
      const result = getRelevantIntegrations(['crma']);
      expect(result).to.be.empty;
    });

    it('returns empty for empty profile list', () => {
      const result = getRelevantIntegrations([]);
      expect(result).to.be.empty;
    });

    it('deduplicates when multiple profiles match the same integration', () => {
      const result = getRelevantIntegrations(['ba', 'pm', 'developer']);
      const jiraCount = result.filter((i) => i.id === 'jira').length;
      expect(jiraCount).to.equal(1);
    });

    it('returns all integrations when profiles span all', () => {
      const result = getRelevantIntegrations(['ux', 'pm', 'developer']);
      expect(result).to.have.lengthOf(MCP_INTEGRATIONS.length);
    });
  });

  describe('buildMcpEntry()', () => {
    it('builds HTTP entry for Figma (url only, no credentials)', () => {
      const figma = MCP_INTEGRATIONS.find((i) => i.id === 'figma')!;
      const entry = buildMcpEntry(figma, {});
      expect(entry.url).to.equal('https://mcp.figma.com/mcp');
      expect(entry.command).to.be.undefined;
      expect(entry.args).to.be.undefined;
    });

    it('Jira stdio entry sets command to npx', () => {
      const jira = MCP_INTEGRATIONS.find((i) => i.id === 'jira')!;
      const entry = buildMcpEntry(jira, {
        JIRA_BASE_URL: 'https://acme.atlassian.net',
        JIRA_EMAIL: 'user@acme.com',
        JIRA_API_TOKEN: 'secret-token',
      });
      expect(entry.command).to.equal('npx');
    });

    it('Jira stdio entry args include -y flag', () => {
      const jira = MCP_INTEGRATIONS.find((i) => i.id === 'jira')!;
      const entry = buildMcpEntry(jira, {
        JIRA_BASE_URL: 'https://acme.atlassian.net',
        JIRA_EMAIL: 'user@acme.com',
        JIRA_API_TOKEN: 'secret-token',
      });
      expect(entry.args).to.include('-y');
    });

    it('Jira stdio entry args include the jira-mcp-server package', () => {
      const jira = MCP_INTEGRATIONS.find((i) => i.id === 'jira')!;
      const entry = buildMcpEntry(jira, {
        JIRA_BASE_URL: 'https://acme.atlassian.net',
        JIRA_EMAIL: 'user@acme.com',
        JIRA_API_TOKEN: 'secret-token',
      });
      expect(entry.args).to.include('@nexus2520/jira-mcp-server');
    });

    it('Jira stdio entry passes JIRA_BASE_URL in env', () => {
      const jira = MCP_INTEGRATIONS.find((i) => i.id === 'jira')!;
      const entry = buildMcpEntry(jira, {
        JIRA_BASE_URL: 'https://acme.atlassian.net',
        JIRA_EMAIL: 'user@acme.com',
        JIRA_API_TOKEN: 'secret-token',
      });
      expect(entry.env!.JIRA_BASE_URL).to.equal('https://acme.atlassian.net');
    });

    it('Jira stdio entry passes JIRA_EMAIL in env', () => {
      const jira = MCP_INTEGRATIONS.find((i) => i.id === 'jira')!;
      const entry = buildMcpEntry(jira, {
        JIRA_BASE_URL: 'https://acme.atlassian.net',
        JIRA_EMAIL: 'user@acme.com',
        JIRA_API_TOKEN: 'secret-token',
      });
      expect(entry.env!.JIRA_EMAIL).to.equal('user@acme.com');
    });

    it('Jira stdio entry passes JIRA_API_TOKEN in env', () => {
      const jira = MCP_INTEGRATIONS.find((i) => i.id === 'jira')!;
      const entry = buildMcpEntry(jira, {
        JIRA_BASE_URL: 'https://acme.atlassian.net',
        JIRA_EMAIL: 'user@acme.com',
        JIRA_API_TOKEN: 'secret-token',
      });
      expect(entry.env!.JIRA_API_TOKEN).to.equal('secret-token');
    });

    it('Jira stdio entry sets type to stdio', () => {
      const jira = MCP_INTEGRATIONS.find((i) => i.id === 'jira')!;
      const entry = buildMcpEntry(jira, {
        JIRA_BASE_URL: 'https://acme.atlassian.net',
        JIRA_EMAIL: 'user@acme.com',
        JIRA_API_TOKEN: 'secret-token',
      });
      expect(entry.type).to.equal('stdio');
    });

    it('defaults JIRA_BASE_URL to empty string when credentials are missing', () => {
      const jira = MCP_INTEGRATIONS.find((i) => i.id === 'jira')!;
      const entry = buildMcpEntry(jira, {});
      expect(entry.env!.JIRA_BASE_URL).to.equal('');
    });

    it('defaults JIRA_EMAIL to empty string when credentials are missing', () => {
      const jira = MCP_INTEGRATIONS.find((i) => i.id === 'jira')!;
      const entry = buildMcpEntry(jira, {});
      expect(entry.env!.JIRA_EMAIL).to.equal('');
    });

    it('defaults JIRA_API_TOKEN to empty string when credentials are missing', () => {
      const jira = MCP_INTEGRATIONS.find((i) => i.id === 'jira')!;
      const entry = buildMcpEntry(jira, {});
      expect(entry.env!.JIRA_API_TOKEN).to.equal('');
    });
  });

  describe('formatSetupGuide()', () => {
    it('includes integration label in header', () => {
      const figma = MCP_INTEGRATIONS.find((i) => i.id === 'figma')!;
      const guide = formatSetupGuide(figma);
      expect(guide).to.include('## Figma Setup Guide');
    });

    it('includes Step 1 for Jira', () => {
      const jira = MCP_INTEGRATIONS.find((i) => i.id === 'jira')!;
      const guide = formatSetupGuide(jira);
      expect(guide).to.include('Step 1');
    });

    it('includes Step 2 for Jira', () => {
      const jira = MCP_INTEGRATIONS.find((i) => i.id === 'jira')!;
      const guide = formatSetupGuide(jira);
      expect(guide).to.include('Step 2');
    });

    it('includes Step 3 for Jira', () => {
      const jira = MCP_INTEGRATIONS.find((i) => i.id === 'jira')!;
      const guide = formatSetupGuide(jira);
      expect(guide).to.include('Step 3');
    });

    it('includes learn more label in guide', () => {
      const jira = MCP_INTEGRATIONS.find((i) => i.id === 'jira')!;
      const guide = formatSetupGuide(jira);
      expect(guide).to.include('Learn more:');
    });

    it('includes atlassian link in learn more section', () => {
      const jira = MCP_INTEGRATIONS.find((i) => i.id === 'jira')!;
      const guide = formatSetupGuide(jira);
      expect(guide).to.include('atlassian');
    });
  });
});
