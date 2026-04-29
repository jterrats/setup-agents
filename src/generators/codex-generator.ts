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
import { stripMdcFrontmatter } from './shared.js';
import { getPortableSkillSections } from './skill-generator.js';

/**
 * Generates the slim root `AGENTS.md` for OpenAI Codex CLI.
 * Per-profile rules live in `.codex/<id>.md` and are referenced via an
 * explicit `read` instruction. When `force-app/` exists, a focused
 * `force-app/AGENTS.md` is generated separately via `generateAgentsMdForceApp()`.
 */
export function generateAgentsMd(profiles: Profile[], version: string): string {
  const profileRefs = profiles.map((p) => `- \`.codex/${p.id}.md\` — ${p.label} rules`).join('\n');

  const lines = [
    '# Agent Guidelines',
    `<!-- setup-agents: ${version} -->`,
    '',
    '## General Principles',
    '- Always read existing code before making changes.',
    '- Prefer editing existing files over creating new ones.',
    '- Follow the coding conventions already present in this project.',
    '- Write concise, self-documenting code. Avoid unnecessary comments.',
    '',
    '## Code Quality',
    '- Ensure all new code is covered by tests.',
    '- Do not introduce linter errors or suppress warnings.',
    '- Handle errors explicitly; never swallow exceptions silently.',
    '',
    '## Security',
    '- Never hardcode credentials, tokens, or sensitive data.',
    '- Use environment variables or secret managers for sensitive values.',
  ];

  if (profileRefs) {
    lines.push(
      '',
      '## Profile Rules',
      'Read the following files for role-specific standards before generating code:',
      profileRefs
    );
  }

  return lines.join('\n');
}

/** Generates per-profile rule file content for `.codex/<id>.md`. */
export function generateCodexProfileRule(profile: Profile, version: string): string {
  const skillSections = getPortableSkillSections([profile.id])
    .map((s) => s.body)
    .join('\n\n---\n\n');
  const profileBody = stripMdcFrontmatter(profile.ruleContent()).trimStart();
  const parts = [`<!-- setup-agents: ${version} -->`, '', profileBody];
  if (skillSections) parts.push('', '---', '', skillSections);
  return parts.join('\n');
}

/**
 * Generates `force-app/AGENTS.md` focused on Salesforce-specific rules.
 * Codex auto-loads AGENTS.md files from parent directories as it navigates
 * into subdirectories, so this file is activated whenever Codex touches
 * anything under `force-app/`.
 */
export function generateAgentsMdForceApp(profiles: Profile[], version: string): string {
  const apexProfiles = profiles.filter((p) => ['developer', 'architect', 'qa', 'devops'].includes(p.id));
  if (apexProfiles.length === 0) return '';

  const lines = [
    '# Salesforce Source Rules',
    `<!-- setup-agents: ${version} -->`,
    '',
    '> Auto-loaded by Codex when working inside `force-app/`. Supplements the root `AGENTS.md`.',
    '',
    '## Apex',
    '- Default: `with sharing`. Exception: `@RestResource` classes → `without sharing`.',
    '- No SOQL or DML inside loops.',
    '- One trigger per object. Zero logic in triggers — delegate to trigger handler.',
    '- Always bulkify: handle 1 to N records.',
    '',
    '## LWC',
    '- Prioritize SLDS Styling Hooks over custom CSS.',
    '- Use LDS 2 and Lightning Data Service whenever possible.',
    '- User feedback: Toasts with Custom Labels. Never hardcode strings.',
    '',
    '## Testing',
    '- Exactly one Assert per test method using the modern `Assert` class.',
    '- Use `@TestSetup` for shared test data.',
    '- Target 90% code coverage.',
  ];

  const profileRefs = apexProfiles.map((p) => `- \`.codex/${p.id}.md\``).join('\n');
  lines.push('', '## Full Standards', 'See profile files at root level:', profileRefs);

  return lines.join('\n');
}
