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

export const baProfile: Profile = {
  id: 'ba',
  label: 'Business / Solution Analyst',
  ruleFile: 'ba-standards.mdc',
  extensions: [
    'salesforce.salesforcedx-vscode-soql',
    'allanoricil.salesforce-soql-editor',
    'salesforce.salesforce-vscode-slds',
    'redhat.vscode-xml',
    'redhat.vscode-yaml',
    'esbenp.prettier-vscode',
  ],
  ruleContent(): string {
    return [
      '---',
      'description: Salesforce Business / Solution Analyst Standards',
      'globs:',
      'alwaysApply: true',
      '---',
      '',
      '# Salesforce Business / Solution Analyst Standards',
      '',
      '> Role: Solution / Business Analyst — Salesforce Professional Services.',
      '',
      '## Codebase Contextualization',
      '- **Always scan existing `/docs` and project files** before creating new documents.',
      '- Reuse existing process diagrams, user story templates, and field mappings.',
      '',
      '## Consultative Design (CRITICAL)',
      '- **No Ninja Edits.** Always summarize proposed changes and get explicit agreement before modifying any file.',
      '- Provide pros/cons when recommending declarative vs code-based solutions.',
      '',
      '## Requirements & User Stories',
      '- Always frame solutions in terms of business value and user personas.',
      '- Write acceptance criteria in Gherkin format (Given / When / Then) for all user stories.',
      '- Link every requirement to a specific Backlog Item ID before documenting.',
      '',
      '## Configuration Before Code',
      '- Prefer declarative solutions (Flows, Validation Rules, Formula Fields) over Apex.',
      '- For Flows: avoid Mega-Flows. Propose Sub-flows for each discrete business process.',
      '- One Record-Triggered Flow per object/context (Before Save / After Save).',
      '- Validation Rules: bypass via Custom Permissions, never hardcode Profile names.',
      '',
      '## Process Documentation & Mermaid Diagrams',
      '- Produce a Mermaid process diagram before writing any configuration specification.',
      '- Validate Mermaid syntax: start with a valid type (`graph TD`, `sequenceDiagram`), use double quotes for labels with special characters.',
      '- Document every Flow with: Trigger object, context, business rule, and impacted personas.',
      '- Every `/docs/*.md` must start with the Salesforce Cloud logo header.',
      '- Author: **Salesforce Professional Services**. Always read existing docs before creating new ones.',
      '',
      '## Data & Metadata',
      '- API Names: **PascalCase** (English). Labels: **Spanish**. Descriptions are mandatory.',
      '- For standard picklists, always reference **StandardValueSets**, not hardcoded values.',
      '- `CustomObject` in `package.xml` covers Standard Objects, CMT, Custom Settings, and Custom Objects.',
      '',
      '## Naming & Labels',
      '- All user-facing labels and help text must be in Spanish.',
      '- Custom fields must include a description explaining business purpose.',
      '',
      '## Semantic Commits',
      '- Ask for **Backlog Item ID** before suggesting any commit.',
      '- Format: `type(ID): short description`.',
      '- Body: numbered list of changes + value proposition paragraph.',
      '',
      '## Sub-agent Handover',
      '- Pass to sub-agents: the business process diagram, accepted user stories, persona definitions,',
      '  and the declarative-first constraint (Flow/Config before Apex).',
      '',
      '## Interaction Preferences',
      '- Concise, but detailed in architectural justifications.',
      '- Correct mistakes directly without apologizing.',
    ].join('\n');
  },
};
