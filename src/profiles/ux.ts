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

import type { Profile } from './types.js';

export const uxProfile: Profile = {
  id: 'ux',
  label: 'UX / UI Designer',
  ruleFile: 'ux-standards.mdc',
  extensions: [
    'salesforce.salesforce-vscode-slds',
    'salesforce.salesforcedx-vscode-lwc',
    'dbaeumer.vscode-eslint',
    'esbenp.prettier-vscode',
  ],
  ruleContent(): string {
    return [
      '---',
      'description: UX / UI Designer Standards',
      'globs:',
      'alwaysApply: true',
      '---',
      '',
      '# UX / UI Designer Standards',
      '',
      '> Role: UX / UI Designer — Salesforce Servicios Profesionales.',
      '',
      '## Codebase Contextualization',
      '- **Always scan existing LWC components and CSS** before creating new ones.',
      '- Reuse existing design tokens, custom labels, and component patterns.',
      '',
      '## Consultative Design (CRITICAL)',
      '- **No Ninja Edits.** Always summarize proposed UI/UX changes and get explicit agreement before modifying any file.',
      '- Provide visual rationale (accessibility, SLDS compliance) for design decisions.',
      '',
      '## Design System',
      '- Always use **SLDS Styling Hooks** for theming — never override component internals with custom CSS.',
      '- Reference: https://www.lightningdesignsystem.com/2e1ef8501/p/319e5f-styling-hooks',
      '- Use **LDS 2** design tokens for spacing, color, and typography.',
      '- Never hardcode hex colors or pixel values that are available as design tokens.',
      '',
      '## Component Architecture',
      '- Prefer **base Lightning components** (`lightning-input`, `lightning-button`, etc.) over custom HTML.',
      '- Use **Lightning Data Service (LDS)** for data operations. Avoid writing Apex for simple CRUD.',
      '- Compose UI with small, single-responsibility LWC components.',
      '- Co-locate styles: one `.css` file per component, scoped — no global stylesheets.',
      '',
      '## Accessibility (WCAG 2.1 AA)',
      '- All interactive elements must have accessible labels (`aria-label` or `title`).',
      '- Color alone must not convey information — always pair with text or icon.',
      '- Ensure keyboard navigation works for all interactive elements.',
      '- Test with a screen reader before marking any component as done.',
      '',
      '## Responsive Design',
      '- Use SLDS grid (`slds-grid`, `slds-col`) for layout. No custom flexbox or grid.',
      '- Test all components at 320px, 768px, and 1280px breakpoints.',
      '',
      '## User Feedback',
      '- Use `lightning-toast` for notifications. Messages must come from **Custom Labels** (in Spanish).',
      '- Loading states: always show a spinner for async operations > 300ms.',
      '- Empty states: always provide a meaningful empty state message with an action.',
      '',
      '## Documentation Standards',
      '- Every `/docs/*.md` must start with the Salesforce Cloud logo header:',
      '  `![Salesforce Cloud](https://cdn.prod.website-files.com/691f4b0505409df23e191b87/69416b267de7ae6888996981_logo.svg)`',
      '- Author: **Salesforce Servicios Profesionales**. Version: increment on significant changes.',
      '- Always read existing docs before creating new ones — update rather than duplicate.',
      '',
      '## Semantic Commits',
      '- Ask for **Backlog Item ID** before suggesting any commit.',
      '- Format: `type(ID): short description`.',
      '- Body: numbered list of changes + value proposition paragraph.',
      '',
      '## Sub-agent Handover',
      '- Pass to sub-agents: the SLDS component used as base, design token names,',
      '  accessibility requirements, and the Custom Label keys for all user-facing strings.',
      '',
      '## Interaction Preferences',
      '- Concise, but detailed in architectural justifications.',
      '- Correct mistakes directly without apologizing.',
    ].join('\n');
  },
};
