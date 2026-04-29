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

/**
 * Declarative registry of third-party MCP integrations.
 *
 * Each entry describes a single MCP server that can be configured in
 * `.cursor/mcp.json`. The registry is consumed by the CLI (`sf setup-agents mcp`)
 * and the VS Code extension to auto-detect relevant integrations and prompt
 * the user.
 */

import type { ProfileId } from '../profiles/types.js';

// ─── Types ──────────────────────────────────────────────────────────────────

export type EnvVarSpec = {
  name: string;
  label: string;
  description: string;
  secret: boolean;
  obtainUrl?: string;
};

export type McpIntegrationConfig =
  | { transport: 'stdio'; command: string; args: string[]; env?: Record<string, string> }
  | { transport: 'http'; url: string };

export type SetupGuide = {
  steps: string[];
  learnMore: string;
};

export type McpIntegration = {
  id: string;
  label: string;
  profiles: Set<ProfileId>;
  config: McpIntegrationConfig;
  envVars: EnvVarSpec[];
  setupGuide: SetupGuide;
};

// ─── Figma ──────────────────────────────────────────────────────────────────

const FIGMA: McpIntegration = {
  id: 'figma',
  label: 'Figma',
  profiles: new Set<ProfileId>(['ux', 'ba', 'architect']),
  config: {
    transport: 'http',
    url: 'https://mcp.figma.com/mcp',
  },
  envVars: [],
  setupGuide: {
    steps: [
      [
        '**Step 1 — Verify your Figma account**',
        '1. Open your browser and go to [figma.com](https://www.figma.com)',
        '2. Log in with your Figma account',
        '3. Confirm you can open at least one design file',
        '',
        '*If you do not have a Figma account, ask your team lead for an invitation.*',
      ].join('\n'),
      [
        '**Step 2 — No installation needed**',
        'Figma provides an official remote server — there is nothing to install.',
        'The agent will add the connection to your editor automatically.',
      ].join('\n'),
      [
        '**Step 3 — Authorize on first use**',
        'The first time the agent accesses Figma, a browser window will open',
        'asking you to log in and grant access. Click **"Allow"**.',
        '',
        '*This only happens once. After that, the agent can read your designs,',
        'export screenshots, and search your design system.*',
      ].join('\n'),
    ],
    learnMore: 'https://www.figma.com/developers',
  },
};

// ─── Jira ───────────────────────────────────────────────────────────────────

const JIRA: McpIntegration = {
  id: 'jira',
  label: 'Jira Cloud',
  profiles: new Set<ProfileId>(['pm', 'ba', 'developer', 'qa', 'devops']),
  config: {
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@nexus2520/jira-mcp-server'],
    env: {
      JIRA_BASE_URL: '',
      JIRA_EMAIL: '',
      JIRA_API_TOKEN: '',
    },
  },
  envVars: [
    {
      name: 'JIRA_BASE_URL',
      label: 'Jira URL',
      description: 'Your Jira Cloud URL (e.g., https://yourcompany.atlassian.net)',
      secret: false,
    },
    {
      name: 'JIRA_EMAIL',
      label: 'Atlassian Email',
      description: 'The email address you use to log in to Jira',
      secret: false,
    },
    {
      name: 'JIRA_API_TOKEN',
      label: 'Jira API Token',
      description: 'An API token for your Atlassian account',
      secret: true,
      obtainUrl: 'https://id.atlassian.com/manage-profile/security/api-tokens',
    },
  ],
  setupGuide: {
    steps: [
      [
        '**Step 1 — Find your Jira URL**',
        '1. Open Jira in your browser',
        '2. Look at the address bar — it will look like `https://yourcompany.atlassian.net`',
        '3. Copy this URL (you will need it in Step 3)',
      ].join('\n'),
      [
        '**Step 2 — Create an API Token**',
        '1. Go to [id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)',
        '2. Log in with your Atlassian account',
        '3. Click **"Create API token"**',
        '4. Give it a name (e.g., "Cursor Agent") and click **"Create"**',
        '5. Click **"Copy"** to copy the token',
        '',
        '*Keep this token safe — you will need it in the next step.*',
        '*If you see a permissions error, ask your Jira admin for help.*',
      ].join('\n'),
      [
        '**Step 3 — Provide your credentials**',
        'The agent will ask you for three things:',
        '- Your **Jira URL** (from Step 1)',
        '- Your **email** (the one you use to log in to Jira)',
        '- Your **API token** (from Step 2)',
        '',
        '**Important:** The API token is stored locally in your editor config.',
        'It is never shared or uploaded anywhere.',
      ].join('\n'),
    ],
    learnMore: 'https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/',
  },
};

// ─── Draw.io ────────────────────────────────────────────────────────────────

const DRAWIO: McpIntegration = {
  id: 'drawio',
  label: 'draw.io',
  profiles: new Set<ProfileId>(['architect', 'ba', 'ux', 'developer']),
  config: {
    transport: 'stdio',
    command: 'npx',
    args: ['-y', 'drawio-mcp'],
  },
  envVars: [],
  setupGuide: {
    steps: [
      [
        '**Step 1 — No installation needed**',
        'The draw.io MCP server runs via `npx` — nothing to install globally.',
        'It will be downloaded automatically on first use.',
      ].join('\n'),
      [
        '**Step 2 — Prepare your diagrams**',
        'Create `.drawio` or `.drawio.svg` files in your project.',
        'The agent can read, create, and modify diagrams for you.',
      ].join('\n'),
    ],
    learnMore: 'https://github.com/jgraph/drawio-mcp',
  },
};

// ─── GitHub ─────────────────────────────────────────────────────────────────

const GITHUB: McpIntegration = {
  id: 'github',
  label: 'GitHub',
  profiles: new Set<ProfileId>(['developer', 'architect', 'devops', 'qa', 'pm']),
  config: {
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: {
      GITHUB_PERSONAL_ACCESS_TOKEN: '',
    },
  },
  envVars: [
    {
      name: 'GITHUB_PERSONAL_ACCESS_TOKEN',
      label: 'Personal Access Token',
      description: 'A GitHub PAT with repo, read:org, and read:user scopes',
      secret: true,
      obtainUrl: 'https://github.com/settings/tokens',
    },
  ],
  setupGuide: {
    steps: [
      [
        '**Step 1 — Create a Personal Access Token**',
        '1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)',
        '2. Click **"Generate new token (classic)"**',
        '3. Select scopes: `repo`, `read:org`, `read:user`',
        '4. Click **"Generate token"** and copy it immediately',
        '',
        '*Store the token safely — GitHub will not show it again.*',
      ].join('\n'),
      [
        '**Step 2 — Provide the token**',
        'The agent will ask for your **Personal Access Token**.',
        'It is stored locally in your editor config and never shared.',
      ].join('\n'),
    ],
    learnMore: 'https://github.com/modelcontextprotocol/servers/tree/main/src/github',
  },
};

// ─── Elements.cloud ─────────────────────────────────────────────────────────

const ELEMENTS: McpIntegration = {
  id: 'elements',
  label: 'Elements.cloud',
  profiles: new Set<ProfileId>(['ba', 'pm', 'architect']),
  config: {
    transport: 'stdio',
    command: 'bash',
    args: ['.setup-agents/skills/elements-sync/scripts/push-to-elements.sh'],
    env: {
      ELEMENTS_API_KEY: '',
      ELEMENTS_SPACE_NAME: '',
    },
  },
  envVars: [
    {
      name: 'ELEMENTS_API_KEY',
      label: 'API Key',
      description: 'Your Elements.cloud API token (Space Management → Developer → API Tokens)',
      secret: true,
      obtainUrl: 'https://app.elements.cloud',
    },
    {
      name: 'ELEMENTS_SPACE_NAME',
      label: 'Space Name',
      description: 'The name of your Elements.cloud Space (shown in the app)',
      secret: false,
    },
  ],
  setupGuide: {
    steps: [
      [
        '**Step 1 — Open your Elements Space**',
        '1. Go to [app.elements.cloud](https://app.elements.cloud)',
        '2. Log in and open your Space',
        '3. Note the **Space name** shown in the top-left (you will need it below)',
      ].join('\n'),
      [
        '**Step 2 — Create an API Token**',
        '1. In the Space, go to **Space Management** (gear icon) → **Developer** → **API Tokens**',
        '2. Click **"Create API Token"**',
        '3. Give it a name (e.g., "Cursor Agent") and select the required scopes',
        '4. **Copy the token immediately** — it is shown only once',
        '',
        '*Keep this token safe. Store it in a password manager, not in code.*',
      ].join('\n'),
      [
        '**Step 3 — Provide your credentials**',
        'The agent will ask for:',
        '- Your **API Key** (from Step 2)',
        '- Your **Space Name** (from Step 1)',
        '',
        'These are stored locally in your editor environment and never uploaded.',
      ].join('\n'),
    ],
    learnMore: 'https://developer.elements.cloud/docs/elements-api',
  },
};

// ─── Registry ───────────────────────────────────────────────────────────────

export const MCP_INTEGRATIONS: McpIntegration[] = [FIGMA, JIRA, DRAWIO, GITHUB, ELEMENTS];
