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

export function generateServiceWorkflows(version: string): Record<string, string> {
  return {
    'case-lifecycle-setup.md': workflow(
      version,
      'Case Lifecycle Setup',
      `
## 1. Define Case Record Types and Queues

Ask:
- **Case types:** Which business scenarios require distinct Record Types (e.g., Technical Support, Billing Inquiry, Field Service)?
- **Queues:** Which teams will own cases? Map each Record Type to one or more queues.
- **Default owner:** What is the fallback queue when no assignment rule matches?

Create queues in Setup → Queues. Assign the relevant Support User profiles and add them as queue members.

## 2. Configure Assignment Rules

Navigate to Setup → Case Assignment Rules and create one active rule with ordered criteria:

1. **Rule entry 1:** Case Type = Technical Support → assign to Technical Support Queue
2. **Rule entry 2:** Origin = Email AND Priority = High → assign to Priority Email Queue
3. **Rule entry N (catch-all):** Criteria: always true → assign to Default Support Queue

Set the active assignment rule in each Case Record Type's support process.

## 3. Build Escalation Rules

Navigate to Setup → Escalation Rules:
- **Age criteria:** escalate cases open longer than SLA threshold (e.g., 4 hours for High, 8 hours for Medium).
- **Escalation action:** reassign to Tier 2 queue AND send email to case owner's manager.
- **Business hours:** always attach a Business Hours record so escalation timers pause outside working hours.

## 4. Enable Email-to-Case

Navigate to Setup → Email-to-Case:
1. Enable Email-to-Case and On-Demand Email-to-Case.
2. Create a routing address per support tier (e.g., \`support@example.com\`, \`priority@example.com\`).
3. Map each routing address to the appropriate queue and set default Priority and Origin.
4. Add the routing email addresses to your MX/SPF records to avoid spam filtering.

## 5. Deploy and Validate

\`\`\`bash
sf project deploy start --source-dir force-app/main/default/objects/Case --target-org <alias>
sf project deploy start --source-dir force-app/main/default/queues --target-org <alias>
\`\`\`

Confirm assignment rules fire correctly by creating a test case matching each rule entry and verifying the owner changes as expected.
`
    ),
    'knowledge-base-structure.md': workflow(
      version,
      'Knowledge Base Structure',
      `
## 1. Plan Article Types and Data Categories

Ask:
- **Article types needed:** FAQ, How-To, Reference, Known Issue, or custom types?
- **Data category groups:** Which top-level groupings reflect your support taxonomy (e.g., Products, Channels, Internal)?
- **Channel visibility:** Which article types should be visible on the Customer Portal, Partner Portal, or internal only?

Define Data Category Groups in Setup → Data Categories. Keep hierarchy shallow (2–3 levels max) — deeply nested categories hurt search performance.

## 2. Configure Knowledge Settings

Navigate to Setup → Knowledge Settings:
1. Enable Salesforce Knowledge.
2. Select the default language and any additional languages for translation.
3. Enable \`Allow users to create and edit articles from the Cases tab\` if agents should link articles while working cases.
4. Set the article org-wide default sharing to "Public Read Only" for internal channels.

## 3. Create Article Types and Field Layout

For each article type:
1. Add a **Summary** (plain text, 255 chars) — this populates search result snippets.
2. Add a **Details** (rich text) for the full body.
3. Add a **Solution** section for How-To types with step-by-step instructions.
4. Assign the article type to the appropriate Data Category Group.

Apply Field-Level Security in the relevant Permission Sets so agents can create/edit articles.

## 4. Configure Publishing Workflow

Define the article lifecycle:
- **Draft → In Review:** agent submits for review; reviewer receives email notification via Flow.
- **In Review → Published:** knowledge manager approves; article becomes searchable.
- **Published → Archived:** article removed from search but retained for historical cases.

Use a Record-Triggered Flow on \`KnowledgeArticleVersion\` (After Save) to send notification emails at each stage transition.

## 5. Deploy and Seed

\`\`\`bash
sf project deploy start --source-dir force-app/main/default/knowledge --target-org <alias>
\`\`\`

Create 3–5 seed articles per article type in the target org to validate search indexing and category filtering.
`
    ),
    'omni-channel-configuration.md': workflow(
      version,
      'Omni-Channel Configuration',
      `
## 1. Define Routing Model and Capacity Plan

Ask:
- **Routing model:** Queue-Based (simple, static) or Skills-Based (dynamic, requires skill definitions)?
- **Capacity:** How many simultaneous work items can each agent handle per channel (chat, case, voice)?
- **Priority:** Which channels or queues should be served first when agents have remaining capacity?

Document answers before touching Setup — misconfigured capacity plans are hard to roll back without agent disruption.

## 2. Create Service Channels and Presence Configurations

Navigate to Setup → Service Channels:
1. Create a Service Channel for each work type: **Cases**, **Chats**, **Messaging Sessions**, **Voice Calls**.
2. Set the related Salesforce Object (Case, LiveChatTranscript, MessagingSession).

Navigate to Setup → Presence Configurations:
1. Create a configuration per agent tier (e.g., Tier1_Presence, Tier2_Presence).
2. Set the capacity limit (e.g., Tier 1: 3 chats + 5 cases simultaneously).
3. Enable \`Automatically accept work requests\` for high-volume queues if appropriate.

## 3. Configure Routing Configurations

Navigate to Setup → Routing Configurations:
1. Create one Routing Configuration per queue (e.g., TechSupport_Routing).
2. Set **Routing Priority** (lower number = higher priority).
3. Set **Routing Model**: Least Active (distributes evenly) or Most Available (fills agents sequentially).
4. Set **Units of Capacity** to match the weight of the work item type.

Assign each Routing Configuration to its corresponding Queue in Setup → Queues.

## 4. Set Up Skills-Based Routing (if applicable)

1. Navigate to Setup → Skills. Create skills aligned to product lines or languages (e.g., Billing_Expert, Spanish_Support).
2. Navigate to Setup → Service Resources. Create a Service Resource record for each agent.
3. Assign skills to each Service Resource with a proficiency level (0–10 scale).
4. In the Routing Configuration, enable Skills-Based Routing and define the skill requirements per work item type.

## 5. Deploy and Pilot Test

\`\`\`bash
sf project deploy start --source-dir force-app/main/default/serviceChannels --target-org <alias>
sf project deploy start --source-dir force-app/main/default/presenceConfigurations --target-org <alias>
\`\`\`

Have 2–3 pilot agents log in with Omni-Channel, set status to Available, and route test cases through each queue. Verify capacity counters decrement correctly and work items are accepted.
`
    ),
  };
}
