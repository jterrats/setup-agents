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

import { workflow } from '../workflow-generator.js';

export function generateAiWorkflows(version: string): Record<string, string> {
  return {
    'create-agent.md': workflow(
      version,
      'Create Agentforce Agent',
      `
## 1. Gather Requirements

Ask:
- **Agent purpose:** What business problem does this agent solve?
- **Topics:** What are the primary intents/topics the agent should handle?
- **Actions:** Which Apex classes, Flows, or Einstein capabilities will back agent actions?
- **Grounding:** What data sources should the agent use for context (Salesforce records, Data Cloud)?

Scan existing \`force-app/main/default/bots/\`, \`force-app/main/default/aiApplications/\`,
and \`force-app/main/default/promptTemplates/\` before creating new ones.

## 2. Generate the Agent Spec

Use the CLI to scaffold the agent YAML specification:

\`\`\`bash
sf agent generate agent-spec --output-dir force-app/main/default/aiApplications/
\`\`\`

Review the generated spec YAML and define:
- \`name\` and \`description\` of the agent
- \`topics\` with description and instructions for each
- \`actions\` mapped to Apex, Flow, or Einstein capabilities

## 3. Create the Agent in the Org

\`\`\`bash
sf agent create --spec force-app/main/default/aiApplications/<AgentName>.yaml --target-org <alias>
\`\`\`

Verify the agent appears in Setup → Agents.

## 4. Package for DX

Generate the authoring bundle to bring the agent into the metadata project:

\`\`\`bash
sf agent generate authoring-bundle --agent-api-name <AgentApiName> --target-org <alias> --output-dir force-app/main/default/
\`\`\`

## 5. Store Prompt Templates

Place prompt templates in \`force-app/main/default/promptTemplates/\`.
Use Flex templates for dynamic content. Always include fallback instructions.

## 6. Deploy

\`\`\`bash
sf project deploy validate -d force-app/main/default/aiApplications/ --target-org <alias>
sf project deploy quick --target-org <alias>
\`\`\`
`
    ),
    'test-agent.md': workflow(
      version,
      'Test Agentforce Agent',
      `
## 1. Generate the Test Spec

\`\`\`bash
sf agent generate test-spec --agent-api-name <AgentApiName> --output-dir .agent-tests/ --target-org <alias>
\`\`\`

Review the generated test YAML. Add edge case scenarios:
- **Empty input:** What does the agent do when the user provides no details?
- **Ambiguous input:** Topics that could match multiple intents.
- **Out-of-scope input:** Questions the agent should decline.

## 2. Run the Test Suite

\`\`\`bash
sf agent test run --test-file .agent-tests/<AgentName>-tests.yaml --target-org <alias> --result-format human
\`\`\`

## 3. Review Metrics

Target thresholds:
- **Topic match rate:** ≥ 80%
- **Action invocation accuracy:** ≥ 85%
- **Fallback rate:** ≤ 10%

If topic match rate is below threshold:
- Add more training utterances per topic (target 20+ per intent)
- Review topic descriptions for clarity and specificity
- Check for topic boundary overlap

## 4. Iterate

After adjusting topics or actions, re-run the full test spec:

\`\`\`bash
sf agent test run --test-file .agent-tests/<AgentName>-tests.yaml --target-org <alias>
\`\`\`

Repeat until all thresholds are met before activating the agent in production.
`
    ),
    'deploy-agent.md': workflow(
      version,
      'Deploy and Activate Agentforce Agent',
      `
## 1. Pre-deployment Checklist

Before deploying, verify:
- All Apex action classes are deployed and covered by tests (≥ 90%)
- All referenced Flows are active in the target org
- Prompt templates are complete with fallback instructions
- Agent test spec passes with ≥ 80% topic match rate

## 2. Validate the Deployment Package

\`\`\`bash
sf project deploy validate -d force-app/main/default/ --target-org <alias> --test-level RunLocalTests
\`\`\`

Wait for validation to complete. Check for:
- Metadata conflicts
- Missing dependencies
- Test coverage failures

## 3. Deploy

\`\`\`bash
sf project deploy quick --target-org <alias>
\`\`\`

## 4. Activate the Agent

\`\`\`bash
sf agent publish --agent-api-name <AgentApiName> --target-org <alias>
\`\`\`

Verify activation in Setup → Agents → the agent status shows **Active**.

## 5. Post-deployment Validation

Run a quick smoke test via the Agent Builder Preview panel:
- Test at least one topic from each category
- Verify grounding returns real org data
- Confirm out-of-scope inputs are declined gracefully

## 6. Monitor

After activation, monitor:
- Topic match rate in Agent Analytics
- Escalation/fallback rate
- User satisfaction signals

Set alerts if topic match rate drops below 75%.
`
    ),
  };
}
