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
import { generateServiceWorkflows } from '../generators/workflows/service.js';
import {
  consultativeDesign,
  deployment,
  documentationStandards,
  interactionPreferences,
  salesforceReferences,
  semanticCommits,
} from './shared-sections.js';
import type { Profile } from './types.js';

export const serviceProfile: Profile = {
  id: 'service',
  label: 'Service Cloud',
  ruleFile: 'service-standards.mdc',
  extensions: ['salesforce.salesforcedx-vscode'],
  detect(cwd: string): boolean {
    return (
      existsSync(join(cwd, 'force-app/main/default/objects/Case')) ||
      existsSync(join(cwd, 'force-app/main/default/entitlementProcesses')) ||
      existsSync(join(cwd, 'force-app/main/default/bots'))
    );
  },
  workflows: generateServiceWorkflows,
  ruleContent(): string {
    return [
      '---',
      'description: Salesforce Service Cloud Standards',
      'globs:',
      'alwaysApply: true',
      '---',
      '',
      '# Salesforce Service Cloud Standards',
      '',
      '> Role: Service Cloud Consultant — Salesforce Professional Services.',
      '',
      ...consultativeDesign('service case management and entitlement decisions'),
      '',
      '## Case Management',
      '- **Case Assignment Rules:** Define criteria-based rules (origin, subject keywords, record type) before using round-robin queues. Document the rule logic.',
      '- **Escalation Rules:** Set time-based escalation triggers tied to business hours. Escalate to a queue, not a specific user — queues survive re-orgs.',
      '- **Case Teams:** Use predefined Case Team Roles (Internal Agent, Supervisor, Subject Matter Expert). Pre-populate teams via assignment rules.',
      '- **Case Queues:** Name queues by channel + tier: `Email_Tier1`, `Chat_Tier2`. Assign Permission Set to control who can pull from each queue.',
      '- **Email-to-Case:** Use On-Demand Email-to-Case for TLS support. Configure routing addresses per product/region. Set thread-ID format.',
      '- **Web-to-Case:** Validate all input fields. Use a CAPTCHA or rate limit to prevent spam.',
      '- **Case Merge:** Enable Case Merge for duplicate detection. Define the master record selection rule (most recent activity or highest case number).',
      '- **Case Status Lifecycle:** New → Open → Pending Customer → Escalated → Resolved → Closed. Map transitions to business process, not technical convenience.',
      '',
      '## Entitlement Processes & Milestones',
      '- **Entitlement Processes:** Define one process per SLA tier (Standard, Premium, Enterprise). Attach to Accounts and Assets.',
      '- **Business Hours:** Create dedicated Business Hours records per region/timezone. Reference in entitlement processes and escalation rules.',
      '- **Milestones:** Define 2–4 milestones per process: First Response, Assignment, Resolution. Set time-based criteria in business hours.',
      '- **Milestone Actions:** Use auto-responses (email alerts) at 50%/75%/100% elapsed. Reassign at 90% to escalation queue.',
      '- **SLA Clock Behavior:** Pause-and-resume requires Entitlement Milestone Stops (set status = "Pending Customer" to pause). Document pause rules explicitly.',
      '- **Entitlement Verification in Apex:** Use `EntitlementProcess` and `Milestone` objects when querying SLA data. Never hardcode milestone names.',
      '',
      '## Knowledge Management',
      '- **Article Types / Record Types:** Use record types to separate FAQ, How-To, and Reference articles. Each type should have a dedicated page layout.',
      '- **Data Categories:** Design a 2-level hierarchy (top: product/domain, child: sub-topic). Categories drive search and visibility rules.',
      '- **Publishing Workflow:** Draft → In Review → Published. Use Approval Processes for external articles. Assign review to a dedicated Knowledge team queue.',
      '- **Article Versioning:** Every edit creates a new version. Archive instead of delete. Set a review reminder every 6 months using a scheduled flow.',
      '- **Knowledge Search Tuning:** Promote articles with high deflection scores. Use keyword synonyms. Surface articles in Lightning Service Console sidebar.',
      '- **Smart Links:** Use Knowledge Article Version IDs for stable links. Never link to article URLs that contain record IDs — they change with drafts.',
      '- **Case Deflection Metrics:** Track article views from case, article attach rate, and CSAT correlation per article.',
      '',
      '## Omni-Channel Routing',
      '- **Queue-Based Routing:** Assign work items to queues; agents pull manually. Simpler to configure; use for low-volume or unstructured work.',
      '- **Skills-Based Routing:** Route work items to agents with matching skills and capacity. Requires Skill definitions and agent skill assignments.',
      '- **Capacity Model:** Define capacity units per channel (chat = 3 units, voice = 5, email = 1). Total agent capacity = sum across all active work.',
      '- **Presence Configuration:** Create Presence Statuses per channel (Available for Chat, Available for Email). Control which statuses allow which work types.',
      '- **Routing Priority:** Higher priority work items pre-empt lower priority. Set priority at the queue level. Use flow to set priority dynamically.',
      '- **Supervisor Panel:** Use Omni-Channel Supervisor in Service Console. Configure real-time monitoring for queue depth, handle time, and agent availability.',
      '',
      '## Einstein Bots',
      '- **Dialog Design:** Start with: Greeting → Intent Recognition → Main Menu → Task-specific dialogs → Handoff/Close.',
      '- **NLU Intent Training:** Provide 20+ training utterances per intent. Use the Intent Model accuracy dashboard to track precision and recall.',
      '- **Entity Extraction:** Define entities for key data (case number, order ID, product name). Use system entities for dates and numbers.',
      '- **Bot-to-Agent Handoff:** Use the Transfer to Agent dialog with context variables. Pre-populate case fields from bot conversation before transfer.',
      '- **Bot Analytics:** Monitor deflection rate, containment rate, and transfer rate. Set alerts for high transfer rates (>60% may indicate poor intent coverage).',
      '- **Multi-Language:** Configure language-specific intent models per locale. Use Custom Labels for bot response text.',
      '',
      '## Macros & Quick Text',
      '- **Macro Structure:** Header (set subject/status) → Instructions (body text) → Close action (set status = Closed). Keep macros atomic.',
      '- **Quick Text:** Organize by category (Greeting, Troubleshooting, Escalation, Closing). Grant access via Permission Set.',
      '- **Permission:** Create a Permission Set `ServiceAgent_Macros` — assign only to agents who need each macro. Avoid broad profile-level access.',
      '',
      '## Messaging Channels',
      '- **Channel Setup:** Configure SMS/WhatsApp/Facebook via Messaging in Setup. Each channel = one Messaging Channel record + one Routing Config.',
      '- **Messaging Sessions:** Sessions are separate from Cases. Link via a flow that creates a case on first inbound message and associates subsequent messages.',
      '- **Consent Management:** WhatsApp requires opt-in. Track consent in a custom field on Contact. Block outbound if `MessagingConsentStatus != OptedIn`.',
      '- **Session Routing:** Route messaging sessions via Omni-Channel using the same skills/queue model as other channels.',
      '',
      ...documentationStandards(),
      '',
      ...deployment(),
      '',
      ...semanticCommits(),
      '',
      ...salesforceReferences(),
      '',
      ...interactionPreferences('service configuration'),
    ].join('\n');
  },
};
