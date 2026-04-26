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

import type { Profile } from '../profiles/index.js';

const BASE_EXTENSIONS = [
  'salesforce.salesforcedx-vscode',
  'salesforce.salesforcedx-vscode-core',
  'salesforce.salesforcedx-vscode-expanded',
  'salesforce.salesforcedx-vscode-apex',
  'salesforce.apex-language-server-extension',
  'salesforce.salesforcedx-vscode-lwc',
  'salesforce.salesforcedx-vscode-lightning',
  'salesforce.salesforcedx-vscode-visualforce',
  'salesforce.salesforce-vscode-slds',
  'salesforce.salesforcedx-vscode-soql',
  'allanoricil.salesforce-soql-editor',
  'salesforce.salesforcedx-einstein-gpt',
  'salesforce.salesforcedx-vscode-agents',
  'dbaeumer.vscode-eslint',
  'esbenp.prettier-vscode',
  'redhat.vscode-xml',
  'redhat.vscode-yaml',
];

/** Generates `.vscode/extensions.json` content. */
export function generateExtensionsJson(profiles: Profile[]): string {
  const profileExtensions = profiles.flatMap((p) => p.extensions);
  const recommendations = [...new Set([...BASE_EXTENSIONS, ...profileExtensions])];
  return JSON.stringify({ recommendations }, null, 2) + '\n';
}
