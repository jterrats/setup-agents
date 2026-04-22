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

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Profile } from './types.js';

export const mulesoftProfile: Profile = {
  id: 'mulesoft',
  label: 'MuleSoft Architect / Developer',
  ruleFile: 'mulesoft-standards.mdc',
  extensions: [
    'humao.rest-client',
    'blzjns.vscode-raml',
    'rangav.vscode-thunder-client',
    'redhat.vscode-xml',
    'redhat.vscode-yaml',
  ],
  detect(cwd: string): boolean {
    return existsSync(join(cwd, 'mule-artifact.json')) || existsSync(join(cwd, 'pom.xml'));
  },
  ruleContent(): string {
    return [
      '---',
      'description: MuleSoft Architect / Developer Standards',
      'globs:',
      'alwaysApply: true',
      '---',
      '',
      '# MuleSoft Architect / Developer Standards',
      '',
      '> Role: MuleSoft Architect / Developer — Salesforce Servicios Profesionales.',
      '',
      '## Consultative Design (CRITICAL)',
      '- **No Ninja Edits.** Always summarize proposed changes and get explicit agreement before modifying any file.',
      '- Provide pros/cons for API design decisions (RAML vs OAS, sync vs async) before implementing.',
      '',
      '## API Design First',
      '- Define APIs using **RAML** or **OAS 3.0** before implementing any Mule flow.',
      '- Publish API specs to **Anypoint Exchange** before development starts.',
      '- Use **API Fragments** (traits, resource types, data types) for reusability.',
      '',
      '## Integration Patterns',
      '- Use **Named Credentials** on the Salesforce side for all outbound connections.',
      '- Never hardcode endpoints, credentials, or environment-specific values in flows.',
      '- Use **External Properties** (`mule-app.properties`) for environment-specific config.',
      '- Apply the **API-led Connectivity** model: System → Process → Experience layers.',
      '',
      '## Error Handling',
      '- Every flow must have an explicit **On Error Propagate** or **On Error Continue** scope.',
      '- Log errors using the standard Logger component before re-throwing.',
      '- Return meaningful HTTP status codes (4xx for client errors, 5xx for server errors).',
      '- Never swallow exceptions silently.',
      '',
      '## Security',
      '- Enforce **OAuth 2.0** or **Client ID Enforcement** on all Experience APIs.',
      '- Use **Secure Properties** (encrypted) for sensitive configuration values.',
      '- Apply **IP Allowlisting** at the API Gateway level where applicable.',
      '',
      '## Performance & Reliability',
      '- Use **Batch Processing** for large dataset operations (> 200 records).',
      '- Apply **Until Successful** scope for retry logic with exponential backoff.',
      '- Avoid synchronous flows for long-running operations — use async with callbacks.',
      '',
      '## Testing',
      '- Write **MUnit** tests for all flows. Target 80% coverage minimum.',
      '- Mock all external dependencies in MUnit tests (no live calls in tests).',
      '- Test both happy path and error scenarios.',
      '',
      '## Documentation Standards',
      '- Every `/docs/*.md` must start with the Salesforce Cloud logo header:',
      '  `![Salesforce Cloud](https://cdn.prod.website-files.com/691f4b0505409df23e191b87/69416b267de7ae6888996981_logo.svg)`',
      '- Author: **Salesforce Servicios Profesionales**. Version: increment on significant changes.',
      '- Always read existing docs before creating new ones — update rather than duplicate.',
      '',
      '## Semantic Commits',
      '- Ask for **Backlog Item ID** before suggesting any commit.',
      '- Format: `type(ID): short description`.',
      '- Body: numbered list of changes + value proposition paragraph.',
      '',
      '## Sub-agent Handover',
      '- Pass to sub-agents: API spec location, API-led layer being implemented,',
      '  external system endpoints (from Named Credentials), and error handling strategy.',
      '',
      '## Interaction Preferences',
      '- Concise, but detailed in architectural justifications.',
      '- Correct mistakes directly without apologizing.',
    ].join('\n');
  },
};
