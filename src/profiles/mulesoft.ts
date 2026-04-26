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
import { generateMulesoftWorkflows } from '../generators/workflows/mulesoft.js';
import type { Profile } from './types.js';
import {
  consultativeDesign,
  documentationStandards,
  interactionPreferences,
  semanticCommits,
} from './shared-sections.js';

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
  workflows: generateMulesoftWorkflows,
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
      '> Role: MuleSoft Architect / Developer — Salesforce Professional Services.',
      '',
      '## Codebase Contextualization',
      '- **Always scan existing Mule project files, RAML/OAS specs, and `mule-app.properties`** before proposing changes.',
      '- Reuse existing API fragments, DataWeave modules, and error handling patterns.',
      '',
      ...consultativeDesign('API design decisions (RAML vs OAS, sync vs async)'),
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
      '## DataWeave Standards',
      '- Name DataWeave modules descriptively: `transformContactToCanonical.dwl`, `mapOrderLineItems.dwl`.',
      '- Extract reusable transformations into `/src/main/resources/dwl/` modules.',
      '- Write DataWeave unit tests using MUnit `dw::test` framework for complex transformations.',
      '- Avoid inline DataWeave in flows — externalize all non-trivial transformations to `.dwl` files.',
      '- Handle null/missing fields explicitly with `default` operator — never assume field presence.',
      '',
      '## API Naming & Versioning',
      '- Follow **API-led naming**: `sys-<system>-api`, `proc-<process>-api`, `exp-<experience>-api`.',
      '- URL-based versioning: `/api/v1/`, `/api/v2/`. Never break existing consumers without version bump.',
      '- Deprecation policy: announce deprecation 2 sprints before removal. Document in API spec.',
      '- API lifecycle: Design → Implement → Test → Publish → Deprecate → Retire.',
      '',
      '## MuleSoft Deployment',
      '- Target environments: **CloudHub** (SaaS), **Runtime Fabric** (container), or **on-premise** (standalone).',
      '- CI/CD: use `mule-maven-plugin` for automated deployment. Pipeline: build → MUnit → deploy → health check.',
      '- Never hardcode environment-specific values — use `mule-app.properties` with environment-specific overrides.',
      '- After deployment: verify the health endpoint and check Anypoint Monitoring for errors.',
      '- This replaces the standard `sf project deploy` workflow — MuleSoft has its own deployment lifecycle.',
      '',
      ...documentationStandards(),
      '',
      ...semanticCommits(),
      '',
      '## Sub-agent Handover',
      '- Pass to sub-agents: API spec location, API-led layer being implemented,',
      '  external system endpoints (from Named Credentials), and error handling strategy.',
      '',
      ...interactionPreferences(),
    ].join('\n');
  },
};
