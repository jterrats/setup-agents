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

export function generatePmWorkflows(version: string): Record<string, string> {
  return {
    'sprint-plan.md': workflow(
      version,
      'Create Sprint Plan',
      `
## 1. Gather Sprint Context

Ask:
- Sprint number and dates (start/end)
- Team capacity (members × available days)
- Carry-over items from previous sprint

Read existing sprint plans in \`/docs/sprints/\` to determine the next sprint number.

## 2. Build Sprint Backlog

Collect candidate items from the backlog. For each item confirm:
- Backlog Item ID
- Priority (P1 / P2 / P3)
- Story points estimate
- Assignee

Validate total story points do not exceed team velocity (average of last 3 sprints).

## 3. Generate Gantt Timeline

Produce a Mermaid Gantt chart showing the sprint timeline:

\`\`\`mermaid
gantt
  title Sprint N
  dateFormat YYYY-MM-DD
  section Development
    US-101 :a1, 2026-01-06, 3d
    US-102 :a2, after a1, 2d
  section Testing
    QA US-101 :b1, after a1, 1d
\`\`\`

## 4. Document Sprint Plan

Create \`/docs/sprints/sprint-NNN.md\` with:
- Sprint goal (one sentence)
- Capacity and velocity reference
- Sprint backlog table (ID, Story, Points, Assignee, Priority)
- Gantt chart
- Risks and dependencies

## 5. Get Agreement

Present the sprint plan and confirm commitment before the sprint starts.
`
    ),
    'status-report.md': workflow(
      version,
      'Generate Weekly Status Report',
      `
## 1. Gather Status Data

Collect from the team:
- Completed items this week (with Backlog Item IDs)
- In-progress items and % completion
- Blockers and escalations
- Risks (new or updated)

## 2. Calculate Metrics

- Planned vs actual story points completed
- Sprint burndown position (on track / behind / ahead)
- Overall project health: Scope / Schedule / Budget (Red / Amber / Green)

## 3. Generate Report

Create or update \`/docs/status/week-YYYY-WNN.md\` with:

\`\`\`markdown
# Weekly Status Report — Week NN

> Author: Salesforce Professional Services | Date: YYYY-MM-DD

## Health Dashboard

| Dimension | Status | Notes |
|-----------|--------|-------|
| Scope     | 🟢     | On track |
| Schedule  | 🟡     | 2 items at risk |
| Budget    | 🟢     | Within allocation |

## Accomplishments
- [US-101] Completed: <description>

## Upcoming
- [US-201] In progress (60%)

## Blockers
- [BLK-01] <description> — Owner: <name> — Age: N days

## Risks
| ID | Risk | Probability | Impact | Mitigation |
|----|------|-------------|--------|------------|
| R-01 | ... | High | High | ... |
\`\`\`

## 4. Share

Attach the report link to the appropriate Slack channel or email distribution.
`
    ),
    'risk-register.md': workflow(
      version,
      'Maintain Risk Register',
      `
## 1. Review Current Risks

Read \`/docs/risk-register.md\` to see existing risks. If the file does not exist, create it.

## 2. Identify New Risks

Ask the team about:
- Technical risks (integration failures, data quality, performance)
- Schedule risks (dependencies, resource availability, scope creep)
- External risks (vendor delays, regulatory changes)

## 3. Assess and Document

For each risk, capture:

| Field | Description |
|-------|-------------|
| ID | Sequential (R-NNN) |
| Description | Clear statement of the risk |
| Probability | Low / Medium / High |
| Impact | Low / Medium / High |
| Mitigation | Actions to reduce probability or impact |
| Owner | Person responsible for monitoring |
| Status | Open / Mitigated / Closed |

## 4. Update Register

Update \`/docs/risk-register.md\` with new and modified entries. Never delete closed risks — mark them as Closed with resolution date.

## 5. Escalation

Risks with both High probability and High impact must be escalated immediately.
Flag any blocker older than 3 business days.
`
    ),
  };
}
