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

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { generateSlackWorkflows } from '../generators/workflows/slack.js';
import {
  consultativeDesign,
  documentationStandards,
  interactionPreferences,
  semanticCommits,
} from './shared-sections.js';
import type { Profile } from './types.js';

export const slackProfile: Profile = {
  id: 'slack',
  label: 'Slack Developer (Bolt.js)',
  ruleFile: 'slack-standards.mdc',
  extensions: ['dbaeumer.vscode-eslint', 'esbenp.prettier-vscode', 'humao.rest-client'],
  detect(cwd: string): boolean {
    return existsSync(join(cwd, 'slack.json')) || existsSync(join(cwd, 'manifest.json'));
  },
  workflows: generateSlackWorkflows,
  ruleContent(): string {
    return [
      '---',
      'description: Slack Developer (Bolt.js) Standards',
      'globs:',
      'alwaysApply: true',
      '---',
      '',
      '# Slack Developer (Bolt.js) Standards',
      '',
      '> Role: Slack Developer — Salesforce Professional Services.',
      '',
      ...consultativeDesign('Bolt.js architecture and Salesforce integration decisions'),
      '',
      '## Codebase Contextualization',
      '- Scan existing `listeners/` and `handlers/` directories before writing new ones.',
      '- Check `manifest.json` for existing bot scopes before adding new permissions.',
      '- Identify the Salesforce org alias the app integrates with before writing any org calls.',
      '',
      '## Framework',
      '- Use **Bolt.js** (`@slack/bolt`). Node.js >= 18 required.',
      '- All listener callbacks must be `async`.',
      '- Use `app.start()` for Socket Mode (development) and HTTP mode (production).',
      '- Organize listeners by type: `listeners/commands/`, `listeners/actions/`, `listeners/events/`, `listeners/shortcuts/`.',
      '',
      '## App Manifest',
      '- Always maintain `manifest.json` in version control.',
      '- Bot token scopes must be **minimal** — request only what the feature requires.',
      '- Use **Socket Mode** for local development. Switch to HTTP for production deployments.',
      '- After any manifest change, reinstall the app to the workspace.',
      '',
      '## Event Listeners',
      '- Register listeners with: `app.message()`, `app.action()`, `app.shortcut()`, `app.command()`.',
      '- **Always call `ack()` within 3 seconds** — Slack will retry after 3 seconds if no acknowledgement.',
      '- Perform long-running work asynchronously after `ack()`. Use `respond()` or `say()` for deferred responses.',
      '- Never block the event loop in a listener body.',
      '',
      '## Salesforce Integration',
      '- Use `jsforce` or the SF CLI session for org access from the Slack app.',
      '- **Never hardcode org credentials** — use environment variables or a Secrets Manager.',
      '- Authenticate to Salesforce using JWT Bearer Flow or Named Credentials for production.',
      '- Store the org alias or instance URL in `process.env.SF_TARGET_ORG` or equivalent.',
      '',
      '## Security',
      '- Verify Slack request signatures on every webhook endpoint.',
      '- Use `SLACK_SIGNING_SECRET` environment variable — Bolt validates signatures automatically.',
      '- **Never log token values** — redact all `xoxb-`, `xoxp-`, and `xapp-` prefixed strings.',
      '- Rotate tokens if accidental exposure occurs. Audit token usage quarterly.',
      '',
      '## Error Handling',
      '- Wrap all listener bodies in `try/catch`.',
      '- Use `logger.error()` for structured error logging.',
      '- Post a user-friendly error message to the channel or as an ephemeral message — never expose stack traces.',
      '- Handle Slack API rate limits: respect `Retry-After` headers and implement exponential backoff.',
      '',
      '## State Management',
      "- Use Bolt's built-in `installationStore` for multi-workspace apps.",
      '- For single-workspace apps, environment variables are sufficient.',
      '- Never store user tokens in plaintext databases — encrypt at rest.',
      '',
      '## Modals & Block Kit',
      '- Use **Block Kit Builder** (https://api.slack.com/tools/block-kit-builder) for UI design.',
      '- Validate all modal form submissions server-side — never trust client-submitted values.',
      '- Use `view.update()` to show a loading state while processing long-running modal submissions.',
      '- Keep modals focused: one task per modal. Avoid nested modals.',
      '',
      '## Testing',
      '- Use **Jest** with `@slack/bolt` test helpers.',
      '- Mock the Bolt `App` client for unit tests — do not make real Slack API calls in tests.',
      '- Use a Slack test workspace for integration tests.',
      '- Test that `ack()` is always called within listener handlers.',
      '',
      ...documentationStandards(),
      '',
      ...semanticCommits(),
      '',
      ...interactionPreferences('Bolt.js and Salesforce integration'),
      '',
      '## Sub-agent Handover',
      '- Pass: Bolt app file path, Salesforce org alias, Block Kit payload, and Slack event type.',
    ].join('\n');
  },
};
