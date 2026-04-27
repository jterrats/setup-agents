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

export function generateFslWorkflows(version: string): Record<string, string> {
  return {
    'work-order-setup.md': workflow(
      version,
      'Work Order Setup',
      `
## 1. Gather Requirements

Ask:
- **Work Type:** What category of work does this work order represent (e.g., Installation, Maintenance, Repair)?
- **Required skills:** Which skill types and minimum levels are mandatory for technician assignment?
- **SLA milestones:** Are there response time or resolution time milestones to enforce?
- **Line items:** Will parts, products consumed, or service items be tracked on work order line items?

Check \`force-app/main/default/objects/WorkType/\` for existing work types before creating duplicates.

## 2. Configure Work Type

- Create or update the Work Type in Setup → Field Service → Work Types.
- Set **Estimated Duration** (used by the scheduling engine for appointment slot calculation).
- Assign required **Skills**: navigate to the Work Type's Skills related list, add Skill Type + minimum Skill Level.
- Enable **Auto-Create Service Appointment** if appointments should be generated automatically on work order creation.

## 3. Define Status Transitions

Use a Record-Triggered Flow (After Save, no logic in triggers) to enforce valid status transitions:

- Allowed path: New → In Progress → Completed → Closed.
- Block backward transitions (e.g., Completed → In Progress) unless a specific bypass permission is present.
- On status = Completed, trigger any downstream automation (invoice generation, asset update, survey send).
- Use **Custom Labels** for all error messages surfaced via \`addError()\` or flow fault paths.

## 4. Deploy Work Type and Related Metadata

\`\`\`bash
sf project deploy start \\
  --source-dir force-app/main/default/objects/WorkOrder \\
  --source-dir force-app/main/default/flows/<FlowApiName>.flow-meta.xml \\
  --target-org <alias>
\`\`\`

- Activate flows after deployment.
- Verify the Work Type appears in the target org and the Skills related list is populated correctly.
`
    ),
    'scheduling-policy.md': workflow(
      version,
      'Scheduling Policy Configuration',
      `
## 1. Define Policy Objectives

Ask:
- **Primary optimization goal:** Minimize travel time, minimize overtime, or maximize skills match?
- **Hard constraints:** Required skills, working hours compliance, resource capacity limits — violations must never be scheduled.
- **Soft constraints:** Preferred technician, preferred territory, travel time threshold — violations are penalized but allowed.
- **Policy scope:** Is this a global default policy or object/use-case specific?

## 2. Configure Scheduling Policy in Setup

Navigate to: Setup → Field Service → Scheduling Policies → New.

1. **Add Work Rules** (hard constraints first):
   - **Required Skills:** Match service appointment skills to resource skill levels.
   - **Working Hours:** Restrict scheduling to resource working hours.
   - **Resource Availability:** Block double-booking.
2. **Add Service Objectives** (soft constraints, ranked by weight):
   - **Minimize Travel:** Weight 10. Penalizes assignments requiring long travel.
   - **Skill Level:** Weight 8. Prefer resources with a higher skill match score.
   - **Preferred Resource:** Weight 5. Bias toward the account's preferred technician.
3. Set the **Objective Function Weight** for each objective proportional to business priority.

## 3. Assign Policy to Service Territories

- Navigate to the Service Territory record → Scheduling Policy field.
- Set different policies per territory if SLA or staffing models differ (e.g., urban vs. rural territories).
- Verify operating hours on each territory align with the Working Hours work rule.

## 4. Test with In-Console Scheduling

\`\`\`bash
# Deploy policy-related custom fields and page layouts if modified:
sf project deploy start \\
  --source-dir force-app/main/default/objects/ServiceTerritory \\
  --target-org <alias>
\`\`\`

- Open the Dispatcher Console → select a test service appointment → click **Schedule**.
- Verify the engine proposes candidates matching required skills and respects working hours.
- Run the **Optimization** job on a small territory to validate objective weighting produces expected results.
`
    ),
    'mobile-configuration.md': workflow(
      version,
      'FSL Mobile App Configuration',
      `
## 1. Gather Requirements

Ask:
- **Mobile actions needed:** Which quick actions should technicians perform from mobile (Start Travel, Complete Work Order, Add Parts, Upload Photos)?
- **Offline fields:** Which fields must be available offline for inspections or forms completed in the field?
- **Required fields for completion:** What must be filled before a technician can mark a work order Complete?
- **Mobile flows:** Are there guided flows for status updates (e.g., arrival confirmation, completion checklist)?

## 2. Configure FSL Mobile Settings

Navigate to: Setup → Field Service Mobile Settings.

- Enable **Offline Sync** for Work Order, Service Appointment, and related objects.
- Set **Sync Frequency** appropriate for field connectivity (recommend 15–30 minutes for areas with intermittent signal).
- Configure **Priming**: define which related records sync to the device (Work Order Line Items, Products Consumed, Assets).

## 3. Build Mobile Page Layouts

- Create dedicated **Mobile Page Layouts** for Work Order and Service Appointment — separate from desktop layouts.
- Place fields technicians need at a glance (status, address, scheduled time, customer contact) in the top section.
- Add a **Quick Actions** section with: Start Travel, Mark Arrived, Complete Work Order, Add Product Consumed.
- Remove related lists not relevant on mobile to reduce load time.

## 4. Create Mobile Flows for Status Updates

Build Screen Flows triggered from Quick Actions:

- **Start Travel Flow:** Sets Service Appointment status to Dispatched, captures GPS timestamp.
- **Mark Arrived Flow:** Sets status to In Progress, records actual arrival time, enforces arrival window compliance check.
- **Complete Work Order Flow:** Collects required completion fields (work summary, parts used, customer signature), validates all required fields, transitions Work Order to Completed.

\`\`\`bash
sf project deploy start \\
  --source-dir force-app/main/default/flows/<MobileFlowName>.flow-meta.xml \\
  --source-dir force-app/main/default/quickActions \\
  --source-dir force-app/main/default/layouts \\
  --target-org <alias>
\`\`\`

- Test each flow on a real mobile device or the FSL Mobile Simulator to verify form rendering and offline behavior.
`
    ),
  };
}
