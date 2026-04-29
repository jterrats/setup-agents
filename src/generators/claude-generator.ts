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
 * Generates the slim root `CLAUDE.md` that uses `@` imports to load per-profile
 * rule files from `.claude/rules/`. Claude Code reads all `@`-imported files at
 * conversation start, keeping the root file short and each profile file focused.
 */
export function generateClaudeMd(profiles: Profile[], version: string): string {
  const imports = profiles.map((p) => `@.claude/rules/${p.id}.md`).join('\n');

  const lines = [
    '# CLAUDE.md — Project Guidelines',
    `<!-- setup-agents: ${version} -->`,
    '',
    'This file provides guidance to Claude Code when working with this project.',
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

  if (imports) {
    lines.push('', '## Profile Rules', imports);
  }

  return lines.join('\n');
}

/** Generates per-profile rule file content for `.claude/rules/<id>.md`. */
export function generateClaudeProfileRule(profile: Profile, version: string): string {
  const skillSections = getPortableSkillSections([profile.id])
    .map((s) => s.body)
    .join('\n\n---\n\n');
  const profileBody = stripMdcFrontmatter(profile.ruleContent()).trimStart();
  const parts = [`<!-- setup-agents: ${version} -->`, '', profileBody];
  if (skillSections) parts.push('', '---', '', skillSections);
  return parts.join('\n');
}
