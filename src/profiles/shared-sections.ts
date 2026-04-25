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

/**
 * Shared rule sections used across multiple profiles.
 * Each function returns an array of lines (no trailing empty string)
 * that can be spread into a profile's ruleContent() array.
 */

const SF_LOGO_URL = 'https://cdn.prod.website-files.com/691f4b0505409df23e191b87/69416b267de7ae6888996981_logo.svg';

export function documentationStandards(): string[] {
  return [
    '## Documentation Standards',
    '- Every `/docs/*.md` must start with the Salesforce Cloud logo header:',
    `  \`![Salesforce Cloud](${SF_LOGO_URL})\``,
    '- Author: **Salesforce Professional Services**. Version: increment on significant changes.',
    '- Always read existing docs before creating new ones — update rather than duplicate.',
  ];
}

export function semanticCommits(): string[] {
  return [
    '## Semantic Commits',
    '- Ask for **Backlog Item ID** before suggesting any commit.',
    '- Format: `type(ID): short description`.',
    '- Body: numbered list of changes + value proposition paragraph.',
  ];
}

export function interactionPreferences(justificationDomain = 'architectural'): string[] {
  return [
    '## Interaction Preferences',
    `- Concise, but detailed in ${justificationDomain} justifications.`,
    '- Correct mistakes directly without apologizing.',
  ];
}

export function consultativeDesign(prosConsTopic = 'non-trivial technical decisions'): string[] {
  return [
    '## Consultative Design (CRITICAL)',
    '- **No Ninja Edits.** Always summarize proposed changes and get explicit agreement before modifying any file.',
    `- Provide pros/cons for ${prosConsTopic} before implementing.`,
  ];
}

export function deployment(): string[] {
  return [
    '## Deployment',
    '- Granular deploy: specific modified files/metadata ONLY.',
    '- **Validate before deploying:** `sf project deploy validate -d force-app`.',
    '- **Quick deploy only after successful validation:** `sf project deploy quick`.',
  ];
}
