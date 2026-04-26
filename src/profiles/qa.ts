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
import { generateQaWorkflows } from '../generators/workflows/qa.js';
import { documentationStandards, interactionPreferences, semanticCommits } from './shared-sections.js';
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
      '> Role: QA / Test Automation Engineer — Salesforce Professional Services.',
      '',
      '## Codebase Contextualization',
      '- **Always scan existing tests and Page Objects** before writing new ones.',
      '- Reuse existing Playwright fixtures, helpers, and utility functions.',
      '',
      '## Consultative Design (CRITICAL)',
      '- **No Ninja Edits.** Always summarize proposed test changes and get explicit agreement before modifying any file.',
      '- Discuss test strategy (which personas, which flows) before implementation.',
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
      '## Persona-to-Data Fixture Mapping',
      '- Every persona in the user story must have a corresponding Playwright **fixture**',
      '  that provisions a logged-in session with the correct Permission Set Group.',
      '- Fixture naming: `<persona>Fixture.ts` (e.g., `fieldRepFixture.ts`, `backOfficeFixture.ts`).',
      "- Fixtures must create or reference test data aligned with the persona's typical workflow.",
      '- Map acceptance criteria actors (Given I am a <Persona>) directly to fixture names.',
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
      '## Test Plan Management',
      '- Produce a **test plan** for each sprint or release: scope, approach, entry/exit criteria, environment.',
      '- Maintain a **traceability matrix**: User Story → Test Cases → Test Results.',
      '- Test coverage tracking: every acceptance criterion must have at least one corresponding test case.',
      '- Store test plans in `/docs/test-plans/` following documentation standards.',
      '',
      '## Manual & Exploratory Testing',
      '- Use **session-based exploratory testing** for new features: define a charter, time-box the session (60-90 min), document findings.',
      '- Apply heuristics: boundary values, error states, permission variations, multi-browser behavior.',
      '- Manual testing complements automation — automate the stable paths, explore the edges manually.',
      '- Document exploratory session results: charter, duration, bugs found, areas of concern.',
      '',
      '## Defect Lifecycle',
      '- Bug reports must include: title, severity, priority, steps to reproduce, expected vs actual, screenshots/logs.',
      '- Severity matrix: S1 (blocker — system down), S2 (critical — major feature broken), S3 (major — workaround exists), S4 (minor — cosmetic).',
      '- Triage process: QA assigns severity, PM assigns priority, team agrees on sprint assignment.',
      '- Verification: after a fix is deployed, QA re-tests and closes the defect. No auto-close.',
      '',
      '## Performance Testing',
      '- Define performance acceptance criteria: page load time (< 3s), API response time (< 1s), concurrent users.',
      '- Salesforce-specific limits to monitor: API call volume, SOQL queries per transaction, CPU time.',
      '- For load testing: use tools appropriate to the stack (k6, JMeter, Playwright with concurrency).',
      '- Document performance baselines and compare against them in each release.',
      '',
      '## Regression Suite Management',
      '- Maintain three test tiers: **Smoke** (critical path, < 10 min), **Regression** (feature coverage, < 60 min), **Full** (all tests).',
      '- Smoke runs on every deployment. Regression runs nightly or before release. Full runs before production.',
      '- Review and prune the regression suite quarterly — remove obsolete tests, add coverage for new features.',
      '- Flaky tests must be quarantined and fixed within one sprint — never ignore intermittent failures.',
      '',
      ...documentationStandards(),
      '',
      ...semanticCommits(),
      '',
      '## Sub-agent Handover',
      '- Pass to sub-agents: the Page Object for the feature under test, the persona being tested,',
      '  the org/environment URL (from env var), and the test data setup approach.',
      '',
      ...interactionPreferences(),
    ].join('\n');
  },
};
