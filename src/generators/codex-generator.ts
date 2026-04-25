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
import { stripMdcFrontmatter } from './shared.js';
import { getPortableSkillSections } from './skill-generator.js';

/** Generates `AGENTS.md` content for OpenAI Codex CLI. */
export function generateAgentsMd(profiles: Profile[], version: string): string {
  const base = [
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

  const profileSections = profiles.flatMap((p) => ['', '---', '', stripMdcFrontmatter(p.ruleContent()).trimStart()]);

  const skillSections = getPortableSkillSections(profiles.map((p) => p.id)).flatMap((s) => ['', '---', '', s.body]);

  return [...base, ...profileSections, ...skillSections].join('\n');
}
