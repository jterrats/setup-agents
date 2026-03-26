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
import { generateQaWorkflows } from '../generators/workflow-generator.js';
import type { Profile } from './types.js';

export const qaProfile: Profile = {
  id: 'qa',
  label: 'QA / Test Automation (Playwright)',
  ruleFile: 'qa-standards.mdc',
  extensions: ['ms-playwright.playwright', 'dbaeumer.vscode-eslint', 'esbenp.prettier-vscode'],
  detect(cwd: string): boolean {
    return existsSync(join(cwd, 'playwright.config.ts')) || existsSync(join(cwd, 'playwright.config.js'));
  },
  workflows: generateQaWorkflows,
  ruleContent(): string {
    return [
      '---',
      'description: QA / Test Automation Standards (Playwright)',
      'globs:',
      'alwaysApply: true',
      '---',
      '',
      '# QA / Test Automation Standards (Playwright)',
      '',
      '> Role: QA / Test Automation Engineer — Salesforce Servicios Profesionales.',
      '',
      '## Framework: Playwright',
      '- **Playwright** is the base framework for all end-to-end and UI tests.',
      '- All tests must be runnable via `npx playwright test`.',
      '- Use `playwright.config.ts` for configuration — never hardcode base URLs or credentials.',
      '- Store credentials in environment variables or `.env` files (never committed to git).',
      '',
      '## Page Object Model (MANDATORY)',
      '- Every page or major UI section must have a corresponding **Page Object** class.',
      '- Page Objects encapsulate selectors and actions. Tests must not contain raw selectors.',
      '- Naming: `<PageName>Page.ts` (e.g., `OpportunityPage.ts`, `LoginPage.ts`).',
      '- Selectors priority: `data-testid` > ARIA role > text > CSS. Never use XPath or positional CSS.',
      '',
      '## Test Isolation',
      '- Each test must be fully independent — no shared state between tests.',
      '- Use `beforeEach` / `afterEach` for setup and teardown.',
      '- Never rely on test execution order.',
      '- Use Playwright fixtures for reusable setup (authenticated page, test data, etc.).',
      '',
      '## Salesforce-specific',
      '- Log in via **API** (not UI) when possible to speed up test setup.',
      '- Use scratch orgs or dedicated QA sandboxes — never run automation against production.',
      '- Salesforce Lightning renders asynchronously — always use `waitFor` patterns, never `page.waitForTimeout`.',
      '- Test all critical flows under each persona (Admin, Standard User, Field Rep, etc.).',
      '',
      '## Accessibility Testing',
      '- Integrate `@axe-core/playwright` for automated accessibility checks on key pages.',
      '- Assert zero critical WCAG 2.1 violations on every page under test.',
      '',
      '## Assertions',
      "- Use Playwright's built-in `expect` (auto-retrying). Never use `setTimeout` to wait.",
      '- One logical assertion per test step. Group related assertions only when they form a single behavior.',
      '- Test both happy path and key error/edge case scenarios.',
      '',
      '## Reporting',
      '- Generate HTML reports via Playwright reporter: `npx playwright show-report`.',
      '- Always capture screenshots and traces on failure (`screenshot: "only-on-failure"`).',
      '',
      '## Sub-agent Handover',
      '- Pass to sub-agents: the Page Object for the feature under test, the persona being tested,',
      '  the org/environment URL (from env var), and the test data setup approach.',
    ].join('\n');
  },
};
