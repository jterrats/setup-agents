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

import type { Profile } from '../profiles/index.js';

/** Generates `agent-guidelines.mdc` content. */
export function generateBaseGuidelines(version: string): string {
  return lines(
    mdcFrontmatter('Agent guidelines for this project', version),
    '',
    '# Agent Guidelines',
    '',
    '## General Principles',
    '- Always read existing code before making changes.',
    '- Prefer editing existing files over creating new ones.',
    '- Follow the coding conventions already present in this project.',
    '- Write concise, self-documenting code. Avoid unnecessary comments.',
    '',
    '## Language Policy',
    '- Default all agent-facing outputs to English (CLI messages, docs, issue labels, workflow text, prompts).',
    '- Switch to another language only when the user explicitly requests it.',
    '- Keep one language per artifact; do not mix languages in the same file/output.',
    '- Preserve project/business conventions in Salesforce metadata (for example, labels in Spanish when required).',
    '- If profile rules conflict with language defaults, prioritize project metadata conventions and keep tooling communication in English unless requested otherwise.',
    '',
    '## Planning',
    '- Before modifying any file, present a concise plan of the changes and wait for explicit user confirmation.',
    '- Do not execute edits until the user confirms with a clear signal ("proceed", "go ahead", "yes", etc.).',
    '- For changes affecting multiple files or architectural decisions, include a Mermaid diagram in the plan.',
    '- If the scope grows during execution, pause and re-confirm before continuing.',
    '',
    '## Code Quality',
    '- Ensure all new code is covered by tests.',
    '- Do not introduce linter errors or suppress warnings.',
    '- Handle errors explicitly; never swallow exceptions silently.',
    '',
    '## Security',
    '- Never hardcode credentials, tokens, or sensitive data.',
    '- Use environment variables or secret managers for sensitive values.'
  );
}

/** Generates `salesforce-standards.mdc` content. */
export function generateSfStandards(version: string): string {
  return lines(
    mdcFrontmatter('Salesforce Development Rules & Project Standards (Master Edition v3.0)', version),
    '',
    '# Salesforce Development Standards',
    '',
    '> You are a Senior Architect for Salesforce Professional Services.',
    '',
    '## 1. Codebase Contextualization',
    '- Search the codebase before answering. Reuse existing patterns and utility classes.',
    '- Know the location of `force-app/main/default`, `package.xml`, and `/docs`.',
    '',
    '## 2. Consultative Design Flow',
    '- Discuss and agree before modifying files. Provide pros/cons and Mermaid diagrams.',
    '- For changes affecting 2+ objects or 3+ metadata types, require a diagram first.',
    '- Summarize all changes before execution.',
    '',
    '## 3. Documentation',
    '- Every `/docs/*.md` must start with the Salesforce Cloud logo header.',
    '- Author: **Salesforce Professional Services**. Increment version only on significant changes.',
    '- Always read existing docs before creating new ones to avoid duplication.',
    '- Keep agent/tooling communication in English by default; switch only on explicit user request.',
    '',
    '## 4. Metadata & Manifest',
    '- `CustomObject` in `package.xml` covers Standard Objects, CMT, Custom Settings, and Custom Objects.',
    '- For standard picklists, prioritize **StandardValueSets**.',
    '- API Names: **PascalCase** (English). Labels: **Spanish**. Descriptions are mandatory.',
    '',
    '## 5. Trigger Strategy',
    '- Exactly **one trigger per object**. Zero logic in triggers.',
    "- Delegate entirely to the **Kevin O'Hara Trigger Handler**.",
    '',
    '## 6. Flow Strategy',
    '- No Mega-Flows. Use Sub-flows for modularity.',
    '- Flow Orchestration only for multi-step, multi-user, or long-running processes.',
    '- One Record-Triggered Flow per object/context (Before/After).',
    '',
    '## 7. Sharing Strategy',
    '- Default: `with sharing` on all Apex classes.',
    '- Exception: Apex REST classes → always `without sharing`.',
    '',
    '## 8. API Version Policy',
    '- Always read `sfdx-project.json` → `sourceApiVersion` before generating code.',
    '- Never hardcode an API version; derive it from the project configuration.',
    '',
    '## 9. Data Layer & Logic',
    '- Propose **JT_DynamicQueries** first. Fallback: **DataSelector** (`inherited sharing`).',
    '- If unclear, ask: *"¿Usamos JT_DynamicQueries o DataSelector?"*.',
    '- **No SOQL or DML inside loops.** Always bulkify: handle 1 to N records.',
    '',
    '## 10. Naming Conventions',
    '- Infer naming patterns from the existing project.',
    '- `JT_` is a framework prefix — preserve as-is. Do not enforce namespaces.',
    '- Test classes: `<ClassName>_Test`. Handlers: `<ObjectName>TriggerHandler`.',
    '',
    '## 11. Async Apex Strategy',
    '- No fixed pattern. When async need arises, discuss architecture with the developer.',
    '- Evaluate `@future`, `Queueable`, `Batch`, and `Schedulable` based on the use case.',
    '',
    '## 12. Exception Strategy',
    '- Scan for an existing custom exception class before writing `try-catch`.',
    '- If none exists, propose one (e.g., `AppException extends Exception`) before coding.',
    '',
    '## 13. Security & Validation Rules',
    '- Bypass validation rules via **Custom Permissions** (`$Permission.Bypass_Validation_Rules`).',
    '- If the permission does not exist, propose creating it.',
    '- Sensitive data: Named Credentials and String Replacement tokens for CMT.',
    '',
    '## 14. Permission Set Strategy',
    '- Prefer **Permission Sets** and **Permission Set Groups** over Profiles.',
    '',
    '## 15. LWC & Frontend',
    '- Styling: **SLDS Styling Hooks** over custom CSS.',
    '- Use **LDS 2** and **Lightning Data Service** whenever possible.',
    '',
    '## 16. Error Handling & Observability',
    '- Scan for existing logging frameworks before writing `try-catch`.',
    '- Never use `eslint-disable` or `@SuppressWarnings` as a first resort.',
    '- User feedback: `addError()` (Triggers) or Toasts (LWC) with **Custom Labels**.',
    '',
    '## 17. Testing Standards',
    '- **Exactly one Assert per test method** (modern `Assert` class).',
    '- Use `@TestSetup` for shared test data.',
    '- Use `System.runAs()` with Permission Set Group-based test users for permission/sharing tests.',
    '- Wrap async operations in `Test.startTest()` / `Test.stopTest()`.',
    '- Target **90% coverage**.',
    '',
    '## 18. Deployment',
    '- Granular deploy: specific modified files only.',
    '- Full deploy (exception): `sf project deploy validate -d force-app` → `sf project deploy quick`.',
    '',
    '## 19. Semantic Commits & Branching',
    '- Ask for **Backlog Item ID** before suggesting a commit.',
    '- Format: `type(ID): short description` with a numbered list of changes in the body.',
    '- Read `git log` to infer the branch naming convention. If unclear, ask the developer.',
    '',
    '## 20. Sub-agent Orchestration',
    '- Pass architectural context and these rules to sub-agents.',
    '- Sub-agents must follow: one assert per test, zero logic in triggers, Salesforce Professional Services authorship.'
  );
}

/** Generates `sub-agent-protocol.mdc` content. */
export function generateSubAgentProtocol(profiles: Profile[], version: string): string {
  const roleRegistry = profiles.map((p) => `| ${p.label} | \`${p.ruleFile}\` |`).join('\n');
  const taskRouting = buildTaskRouting(profiles);
  const handoverChecklist = buildHandoverChecklist(profiles);

  return lines(
    mdcFrontmatter('Sub-agent orchestration protocol for this project', version),
    '',
    '# Sub-agent Orchestration Protocol',
    '',
    '> This file is generated by `sf setup-agents local`. It defines how to assign work to sub-agents',
    '> and what context to pass during handover. Update it when profiles change.',
    '',
    '## Active Profiles',
    '',
    '| Role | Rule File |',
    '|------|-----------|',
    roleRegistry,
    '',
    '## Task-to-Profile Routing',
    '',
    'When spawning a sub-agent, identify the task type and assign the corresponding profile:',
    '',
    taskRouting,
    '',
    '## Handover Checklist',
    '',
    'Every sub-agent invocation MUST include:',
    '',
    '1. **Role declaration** — state which profile the sub-agent is acting under.',
    '2. **`sourceApiVersion`** — read from `sfdx-project.json` before passing.',
    '3. **Agreed architectural decisions** — patterns, data layer strategy, sharing model.',
    '4. **Profile-specific context:**',
    '',
    handoverChecklist,
    '',
    '## Conflict Resolution',
    '',
    'When a task could fall under multiple profiles:',
    '- **Architect** takes precedence for design decisions and cross-cutting concerns.',
    '- **Domain profile** (cgcloud, crma, data360) takes precedence for platform-specific rules.',
    '- **Developer** handles implementation once design is agreed.',
    '- **QA** validates after Developer completes implementation.',
    '',
    '## Context Transmission Rule',
    '',
    'Sub-agents must NOT be spawned without:',
    '- An explicit role declaration from the list above.',
    '- The active profiles list (copy the Active Profiles table above).',
    '- A summary of agreed decisions for the current task.'
  );
}

// ─── Internal helpers ──────────────────────────────────────────────────────

function mdcFrontmatter(description: string, version: string): string {
  return lines(
    '---',
    `description: ${description}`,
    'globs:',
    'alwaysApply: true',
    `pluginVersion: "${version}"`,
    '---'
  );
}

function buildTaskRouting(profiles: Profile[]): string {
  const rows: Array<{ task: string; profile: string; ruleFile: string }> = [];
  const ids = new Set(profiles.map((p) => p.id));

  if (ids.has('architect'))
    rows.push({
      task: 'Architecture decisions, ADRs, pattern selection, cross-cutting concerns',
      profile: 'Architect',
      ruleFile: 'architect-standards.mdc',
    });
  if (ids.has('developer'))
    rows.push({
      task: 'Apex, LWC, Triggers, SOQL, DML, unit tests',
      profile: 'Developer',
      ruleFile: 'developer-standards.mdc',
    });
  if (ids.has('ba'))
    rows.push({
      task: 'User stories, acceptance criteria, Flow configuration, process documentation',
      profile: 'Business Analyst',
      ruleFile: 'ba-standards.mdc',
    });
  if (ids.has('ux'))
    rows.push({
      task: 'LWC UI components, SLDS styling, accessibility, design tokens',
      profile: 'UX / UI',
      ruleFile: 'ux-standards.mdc',
    });
  if (ids.has('cgcloud'))
    rows.push({
      task: 'CGCloud extension points, Modeler configuration, cgcloud__ namespace',
      profile: 'CGCloud Developer',
      ruleFile: 'cgcloud-standards.mdc',
    });
  if (ids.has('crma'))
    rows.push({
      task: 'Recipes, Dataflows, Datasets, SAQL, Dashboards, security predicates',
      profile: 'Analytics Engineer',
      ruleFile: 'analytics-standards.mdc',
    });
  if (ids.has('data360'))
    rows.push({
      task: 'Data Streams, DMOs, Identity Resolution, Calculated Insights, Segments, Activation',
      profile: 'Data Cloud Engineer',
      ruleFile: 'data360-standards.mdc',
    });
  if (ids.has('mulesoft'))
    rows.push({
      task: 'API design (RAML/OAS), Mule flows, integrations, MUnit tests',
      profile: 'MuleSoft Developer',
      ruleFile: 'mulesoft-standards.mdc',
    });
  if (ids.has('devops'))
    rows.push({
      task: 'Pipelines, deployment validation, scratch orgs, package versioning',
      profile: 'DevOps Engineer',
      ruleFile: 'devops-standards.mdc',
    });
  if (ids.has('qa'))
    rows.push({
      task: 'Playwright tests, Page Objects, accessibility automation, test reports',
      profile: 'QA Engineer',
      ruleFile: 'qa-standards.mdc',
    });

  if (rows.length === 0) return '- No specific profiles active. Use `agent-guidelines.mdc` as base.';

  return rows
    .map((r) => `| ${r.task} | **${r.profile}** | \`${r.ruleFile}\` |`)
    .reduce(
      (acc, row) => `${acc}\n${row}`,
      '| Task Type | Assigned Role | Rule File |\n|-----------|--------------|-----------|'
    );
}

function buildHandoverChecklist(profiles: Profile[]): string {
  return profiles
    .map((p) => {
      const content = p.ruleContent().split('\n');
      const start = content.findIndex((l) => l.startsWith('## Sub-agent Handover'));
      if (start === -1) return `- **${p.label}:** see \`${p.ruleFile}\``;
      const items = content
        .slice(start + 1)
        .filter((l) => l.startsWith('- '))
        .join('\n  ');
      return `**${p.label}:**\n  ${items}`;
    })
    .join('\n\n');
}

function lines(...parts: string[]): string {
  return parts.join('\n');
}
