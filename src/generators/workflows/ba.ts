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

import { workflow } from '../workflow-generator.js';

export function generateBaWorkflows(version: string): Record<string, string> {
  return {
    'refine-stories.md': workflow(
      version,
      'Refine User Stories',
      `
## 1. Identify Stories to Refine

Ask: Which epic or set of user stories should we refine?

Read the story map from \`/docs/story-maps/\` to identify candidate stories.

## 2. Apply Refinement Checklist

For each story, verify:

1. **Persona** — Is a persona linked? If not, ask: *"Who is the primary user?"*
2. **Acceptance Criteria** — Are they in Gherkin format (Given / When / Then)?
3. **Fields & Objects** — Are impacted Salesforce objects and fields listed?
4. **Dependencies** — Are cross-story or cross-epic dependencies documented?
5. **T-shirt Size** — Is an estimate assigned (XS / S / M / L / XL)?
6. **Architect Review** — For M+ stories, has the Architect confirmed feasibility?

## 3. Output

Update the story map with refined stories. Mark each story as **Ready** or **Not Ready**.
Produce a summary table: US ID | Title | Status (Ready/Not Ready) | Missing Items.
`
    ),
    'groom-backlog.md': workflow(
      version,
      'Groom Backlog',
      `
## 1. Load Current Backlog

Read the story map from \`/docs/story-maps/\`.
List all stories with: US ID, Title, MoSCoW, Priority, T-shirt Size, Sprint assignment.

## 2. Prioritize

Apply MoSCoW classification if not already assigned.
Within each MoSCoW category, sort by Priority (P1 > P2 > P3).

Present a **Value vs Effort Matrix**:
- X-axis: Effort (T-shirt size)
- Y-axis: Business Value (from MoSCoW + Priority)
- Highlight quick wins (high value, low effort) and flag complex items (XL) for breakdown.

## 3. Sprint Assignment

Ask: Which sprint are we planning for? What is the team capacity?

Assign stories to the sprint until capacity is filled, prioritizing P1 Must-haves.
Produce the sprint backlog table: US ID | Title | Priority | Size | Assignee.

## 4. Sync to Issue Tracker (Optional)

If the user wants to push stories to an issue tracker, use the **Backlog Sync** skill.
`
    ),
  };
}
