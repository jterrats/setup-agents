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
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect } from 'chai';
import { MCP_INTEGRATIONS } from '../../../src/integrations/mcp-registry.js';

describe('Extension MCP_INTEGRATIONS sync', () => {
  it('extension constants.ts contains every integration ID from the registry', () => {
    const extFile = readFileSync(
      join(process.cwd(), 'extensions', 'vscode-setup-agents-ui', 'src', 'constants.ts'),
      'utf8'
    );
    for (const integration of MCP_INTEGRATIONS) {
      expect(extFile).to.include(`id: '${integration.id}'`, `Extension must contain integration "${integration.id}"`);
    }
  });

  it('extension constants.ts contains matching labels for each integration', () => {
    const extFile = readFileSync(
      join(process.cwd(), 'extensions', 'vscode-setup-agents-ui', 'src', 'constants.ts'),
      'utf8'
    );
    for (const integration of MCP_INTEGRATIONS) {
      expect(extFile).to.include(`label: '${integration.label}'`, `Extension must have label "${integration.label}"`);
    }
  });
});
