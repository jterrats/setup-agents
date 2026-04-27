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

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { generateAiWorkflows } from '../generators/workflows/ai.js';
import {
  consultativeDesign,
  documentationStandards,
  interactionPreferences,
  semanticCommits,
} from './shared-sections.js';
import type { Profile } from './types.js';

export const aiProfile: Profile = {
  id: 'ai',
  label: 'AI / Agentforce Specialist',
  ruleFile: 'ai-standards.mdc',
  extensions: ['salesforce.salesforcedx-vscode', 'salesforce.salesforcedx-vscode-lwc', 'continue.continue'],
  detect(cwd: string): boolean {
    return (
      existsSync(join(cwd, 'force-app/main/default/bots')) ||
      existsSync(join(cwd, 'force-app/main/default/aiApplications'))
    );
  },
  workflows: generateAiWorkflows,
  ruleContent(): string {
    return [
      '---',
      'description: Salesforce AI / Agentforce Specialist Standards',
      'globs:',
      'alwaysApply: true',
      '---',
      '',
      '# Salesforce AI / Agentforce Specialist Standards',
      '',
      '> Role: AI / Agentforce Specialist — Salesforce Professional Services.',
      '',
      ...consultativeDesign('agent design and orchestration decisions'),
      '',
      '## Codebase Contextualization',
      '- Scan existing `bots/`, `aiApplications/`, and `promptTemplates/` before creating new ones.',
      '- Check for existing Apex action classes and Flows that can be reused as agent actions.',
      '- Identify the target org alias before scaffolding any agent spec or running agent CLI commands.',
      '',
      '## Agent Design Principles',
      '- Ground every agent response in org data — avoid static, hardcoded answers.',
      '- Define clear topic boundaries: each topic must have a distinct description and non-overlapping instructions.',
      '- One agent per use case. Multi-agent orchestration requires explicit justification and architectural sign-off.',
      '- Always define what the agent will NOT do (out-of-scope topics) as clearly as what it will do.',
      '',
      '## Agent Builder Workflow',
      '- Use `sf agent generate agent-spec` to scaffold the spec YAML before creating anything in an org.',
      '- Use `sf agent create` to create the agent in the target org from the spec.',
      '- Use `sf agent generate authoring-bundle` to package the agent for DX source format.',
      '- Never create agents manually in Setup without a corresponding spec YAML in version control.',
      '',
      '## Prompt Templates',
      '- Store all prompt templates in `force-app/main/default/promptTemplates/`.',
      '- Use **Flex templates** for dynamic prompts that vary by record context.',
      '- Always include fallback instructions for when grounding data is unavailable.',
      '- Prompt template names: `<AgentName>_<TopicName>_<Action>` (PascalCase).',
      '',
      '## Topics & Actions',
      '- Each topic must have a `description` and `instructions` field — both are mandatory.',
      '- Actions should map to existing Apex classes, Flows, or Einstein capabilities — avoid duplicating logic.',
      '- Use invocable Apex methods for complex data operations. Keep action methods bulkified.',
      "- Document each action's input/output variables in the action definition.",
      '',
      '## Testing',
      '- Use `sf agent generate test-spec` to generate the test YAML for the agent.',
      '- Use `sf agent test run` to execute the test suite against the target org.',
      '- Target ≥ 80% topic match rate across all test scenarios.',
      '- Include edge case tests: empty input, ambiguous input, and out-of-scope requests.',
      '- Re-run tests after any change to topics, instructions, or prompt templates.',
      '',
      '## Grounding & Context',
      '- Prefer **Einstein Search Grounding** over static context for real-time org data.',
      '- Use **Data Cloud** for real-time customer data grounding when deep personalization is required.',
      '- Document the grounding strategy in the agent spec YAML and in `/docs/`.',
      '',
      '## Guardrails',
      '- Define explicit out-of-scope topics in the agent spec — never leave guardrails implicit.',
      '- Never expose PII through agent responses. Audit all action output variables for sensitive fields.',
      '- Always set `disableGenerativeAnswers: false` for production agents.',
      "- Review the agent's response in Agent Builder Preview before activating in production.",
      '',
      '## Deployment',
      '- Validate with `sf project deploy validate` before creating the agent in any org.',
      '- Use `sf agent publish` for activation after deployment.',
      '- Deploy Apex action classes and Flows before deploying the agent spec.',
      '',
      ...documentationStandards(),
      '',
      ...semanticCommits(),
      '',
      ...interactionPreferences('agent architecture'),
      '',
      '## Sub-agent Handover',
      '- Pass: agent spec YAML path, topic list, Apex action class names, and target org alias.',
      '- Sub-agents must follow: one Assert per test, zero logic in triggers.',
    ].join('\n');
  },
};
