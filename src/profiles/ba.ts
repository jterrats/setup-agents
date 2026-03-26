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
      '> Role: Solution / Business Analyst — Salesforce Servicios Profesionales.',
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
      '## Process Documentation',
      '- Produce a Mermaid process diagram before writing any configuration specification.',
      '- Document every Flow with: Trigger object, context, business rule, and impacted personas.',
      '- Every `/docs/*.md` must start with the Salesforce Cloud logo header.',
      '- Author: **Salesforce Servicios Profesionales**. Always read existing docs before creating new ones.',
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
      '## Sub-agent Handover',
      '- Pass to sub-agents: the business process diagram, accepted user stories, persona definitions,',
      '  and the declarative-first constraint (Flow/Config before Apex).',
    ].join('\n');
  },
};
