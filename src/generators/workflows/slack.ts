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

import { workflow } from '../workflow-generator.js';

export function generateSlackWorkflows(version: string): Record<string, string> {
  return {
    'create-bolt-app.md': workflow(
      version,
      'Create Bolt.js Slack App',
      `
## 1. Gather Requirements

Ask:
- **App purpose:** What does this Slack app do?
- **Mode:** Socket Mode (development) or HTTP (production)?
- **Salesforce org:** Which org alias will the app integrate with?
- **Scopes:** What bot token scopes are needed? (Minimal — only what is required.)

Scan existing \`listeners/\` and \`handlers/\` directories before adding new ones.

## 2. Scaffold the App

\`\`\`bash
npm init -y
npm install @slack/bolt
npm install --save-dev typescript @types/node ts-node
\`\`\`

Create \`app.ts\`:

\`\`\`typescript
import { App } from '@slack/bolt';

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,                       // Change to false for HTTP in production
  appToken: process.env.SLACK_APP_TOKEN,  // Required for Socket Mode
});

(async () => {
  await app.start();
  console.log('Bolt app running');
})();
\`\`\`

## 3. Configure the App Manifest

Maintain \`manifest.json\` with minimal bot scopes:

\`\`\`json
{
  "display_information": { "name": "<AppName>" },
  "features": { "bot_user": { "display_name": "<AppName>" } },
  "oauth_config": {
    "scopes": { "bot": ["chat:write", "commands"] }
  },
  "settings": { "socket_mode_enabled": true }
}
\`\`\`

## 4. Set Environment Variables

Never hardcode tokens. Use a \`.env\` file (excluded from version control):

\`\`\`bash
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
SLACK_APP_TOKEN=xapp-...   # Socket Mode only
\`\`\`

## 5. Run Locally

\`\`\`bash
npx ts-node app.ts
\`\`\`

Verify the app connects to Slack without errors before adding listeners.
`
    ),
    'add-slash-command.md': workflow(
      version,
      'Add Slash Command to Bolt App',
      `
## 1. Define the Command in the App Manifest

Add the command to \`manifest.json\`:

\`\`\`json
{
  "features": {
    "slash_commands": [
      {
        "command": "/<command-name>",
        "description": "Short description of what this command does",
        "usage_hint": "[optional parameters]"
      }
    ]
  }
}
\`\`\`

Reinstall the app to the workspace after changing the manifest.

## 2. Implement the Listener

Create \`listeners/commands/<command-name>.ts\`:

\`\`\`typescript
import type { App } from '@slack/bolt';

export function registerCommandListeners(app: App): void {
  app.command('/<command-name>', async ({ command, ack, respond, logger }) => {
    await ack();  // Acknowledge within 3 seconds

    try {
      // Business logic here
      const result = await performAction(command.text);

      await respond({
        response_type: 'ephemeral',
        text: \`Result: \${result}\`,
      });
    } catch (error) {
      logger.error(error);
      await respond({ response_type: 'ephemeral', text: 'An error occurred. Please try again.' });
    }
  });
}
\`\`\`

## 3. Register in app.ts

\`\`\`typescript
import { registerCommandListeners } from './listeners/commands/<command-name>.js';
registerCommandListeners(app);
\`\`\`

## 4. Write Tests

\`\`\`bash
npm install --save-dev jest @types/jest ts-jest
\`\`\`

Mock the Bolt \`App\` client and assert \`ack()\` is called and \`respond()\` receives the expected payload.

## 5. Verify Signature Verification

Confirm \`SLACK_SIGNING_SECRET\` is set. Bolt validates signatures automatically when the env var is present.
`
    ),
    'deploy-slack-app.md': workflow(
      version,
      'Deploy Slack App to Production',
      `
## 1. Switch from Socket Mode to HTTP

Update \`app.ts\` to use HTTP mode for production:

\`\`\`typescript
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  // socketMode: false (default)
});

(async () => {
  await app.start(Number(process.env.PORT) || 3000);
  console.log('Bolt app running on HTTP');
})();
\`\`\`

Update the Request URL in your Slack app settings to point to your production endpoint.

## 2. Configure Secrets Manager

Never pass tokens as plain environment variables in production.
Store them in AWS Secrets Manager, Azure Key Vault, or Salesforce Named Credentials:

\`\`\`bash
# Example: AWS Secrets Manager
aws secretsmanager create-secret --name slack/bot-token --secret-string "xoxb-..."
aws secretsmanager create-secret --name slack/signing-secret --secret-string "..."
\`\`\`

Load secrets at startup — never log their values.

## 3. Run Tests Before Deploying

\`\`\`bash
npm test
\`\`\`

All tests must pass. Block deployment on any test failure.

## 4. Deploy to Your Platform

\`\`\`bash
# Example: Heroku
git push heroku main

# Example: Docker
docker build -t slack-app .
docker push <registry>/slack-app:latest
kubectl apply -f k8s/deployment.yaml
\`\`\`

## 5. Update App Manifest for Production

\`\`\`bash
# Update request URLs in manifest.json to production endpoints
# Reinstall the app or update via the Slack API
\`\`\`

## 6. Verify Signature Verification in Production

Send a test slash command and confirm:
- The app responds within 3 seconds
- No signature verification errors appear in logs
- Salesforce integration calls succeed with the production org alias
`
    ),
  };
}
