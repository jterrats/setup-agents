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
import { generateFslWorkflows } from '../generators/workflows/fsl.js';
import { consultativeDesign, deployment, interactionPreferences, semanticCommits } from './shared-sections.js';
import type { Profile } from './types.js';

export const fslProfile: Profile = {
  id: 'fsl',
  label: 'Field Service (FSL)',
  ruleFile: 'fsl-standards.mdc',
  extensions: ['salesforce.salesforcedx-vscode'],
  detect(cwd: string): boolean {
    return (
      existsSync(join(cwd, 'force-app/main/default/objects/ServiceAppointment')) ||
      existsSync(join(cwd, 'force-app/main/default/objects/WorkOrder'))
    );
  },
  workflows: generateFslWorkflows,
  ruleContent(): string {
    return [
      '---',
      'description: Field Service (FSL) Standards',
      'globs:',
      'alwaysApply: true',
      '---',
      '',
      '# Field Service (FSL) Standards',
      '',
      '> Role: Field Service Developer — Salesforce Professional Services.',
      '',
      ...consultativeDesign('FSL scheduling and work order decisions'),
      '',
      '## Work Order Lifecycle',
      '- **Status stages:** New → In Progress → Completed → Closed. Block invalid backward transitions using a Record-Triggered Flow (After Save).',
      '- **Work Order Line Items:** track parts consumed, services rendered, and labor. Link each line item to a Product record for inventory reconciliation.',
      '- **Required vs. optional skills:** define required skills on the Work Type. Optional/preferred skills can be added at the work order level for scheduling preference.',
      '- **Work Type configuration:** set Estimated Duration on Work Types — the scheduling engine uses this to calculate appointment slots. Enable Auto-Create Service Appointment if appointments should generate on work order creation.',
      '- **SLA tracking:** configure Milestones on Work Orders (e.g., First Response, Resolution Time). Use Entitlements if SLA terms vary by account or contract.',
      '- **Status transitions via flows:** use Record-Triggered Flows (not Apex triggers) for declarative status enforcement. Escalate to Apex only when governor limits or complex logic require it.',
      '',
      '## Service Appointments',
      '- **Creation triggers:** manual (dispatcher), automated via Record-Triggered Flow on Work Order creation, or Apex for bulk/programmatic scenarios.',
      '- **Scheduling status lifecycle:** None → Scheduled → Dispatched → Completed → Cannot Complete. Each transition can trigger downstream automation.',
      '- **Arrival window:** configure the Arrival Window Start/End fields to give customers a time range rather than a fixed appointment time.',
      '- **Multi-resource appointments:** use the Service Appointment to Required Service Resource junction object to assign multiple technicians to a single appointment.',
      '- **Service duration estimation:** pull Estimated Duration from the Work Type. Allow dispatchers to override on individual appointments when scope is known to differ.',
      '',
      '## Scheduling Policies',
      '- **Soft constraints (service objectives):** preferred skills, preferred resources, travel time minimization — violations are penalized but the appointment can still be scheduled.',
      '- **Hard constraints (work rules):** required skills, working hours, resource capacity — violations must never result in a scheduled appointment.',
      '- **Optimization objectives (ranked by weight):**',
      '  1. Minimize Travel (reduces cost and improves customer density)',
      '  2. Minimize Overtime (respects working hours boundaries)',
      '  3. Maximize Skills Match (assigns the best-qualified technician)',
      '- **Policy weighting:** adjust Service Objective weights in Setup → Scheduling Policies to reflect business priority. Document the rationale for each weight.',
      '- Assign policies to Service Territories — use different policies for territories with different staffing models (e.g., urban vs. rural).',
      '',
      '## Territory & Service Resource Management',
      '- **Territory hierarchy:** root territory → parent territories → child (leaf) territories. Assign resources to the lowest-level territory where they work.',
      '- **Operating hours:** set per territory and per resource. The scheduling engine respects operating hours for appointment slot availability.',
      '- **Resource types:** Technician (individual person), Vehicle (asset assigned to appointments), Crew (group of resources acting as a unit).',
      '- **Skill types and levels:** define Skill Types (e.g., Electrical, HVAC) and Skill Levels (e.g., Beginner, Intermediate, Expert) in Field Service Settings. Assign skills to resources with an effective date range.',
      '- **Absences:** record resource absences (vacation, training) as Service Resource Absence records so the scheduler excludes those time slots.',
      '- **Territory member assignment:** a resource can be a member of multiple territories. Set one territory as primary for optimization and reporting.',
      '',
      '## Mobile App Configuration',
      '- **FSL Mobile page layouts:** create dedicated mobile layouts for Work Order and Service Appointment — separate from desktop layouts to reduce field clutter.',
      '- **Quick actions on mobile:** configure quick actions for status transitions (Start Travel, Mark Arrived, Complete) directly on the mobile layout.',
      '- **Offline sync configuration:** enable offline sync for Work Order, Service Appointment, Work Order Line Item, and related assets. Define priming rules to pre-fetch records the technician will need.',
      '- **Mobile flows for status updates:** build Screen Flows launched from quick actions to guide technicians through status transitions, enforce required fields, and capture completion data (signature, photos, notes).',
      '- **Required fields for mobile form submission:** define which fields must be filled before a technician can mark a work order Complete. Enforce via validation rules or flow decision elements — never rely on page layout required-field markers alone (they can be bypassed by API).',
      '',
      '## Parts & Inventory Management',
      '- **Products Consumed:** use Work Order Line Items with the Products Consumed related list to record parts used during a job. Each line item links to a Product2 record.',
      '- **Inventory locations:** configure Location records (warehouse, van stock, service center) and link products to locations via Product Item records.',
      "- **Van stock:** assign Product Items to a technician's van Location so the scheduling engine can factor parts availability into resource selection.",
      '- **Return Merchandise Authorization (RMA):** use Return Orders to track parts returned from the field. Link Return Order Line Items to the originating Work Order Line Item for traceability.',
      '- **Product transfers:** use Product Transfer records to move inventory between locations (warehouse to van, van to warehouse after job completion).',
      '',
      '## Crew & Complex Resource Scheduling',
      '- **Crew formation rules:** define crews as Service Resource records of type Crew. Use Crew Members (Resource Crew junction object) to assign individual technicians.',
      "- **Crew leader designation:** designate one crew member as leader on the Resource Crew record. The leader's schedule drives the crew's availability.",
      '- **Same-appointment multi-resource booking:** add multiple Required Service Resources to a single Service Appointment when the job requires concurrent technicians (not a crew).',
      '- **Resource sharing across territories:** a resource can be a member of multiple territories. Use the Service Territory Member record to define date-effective territory assignments.',
      '',
      '## Maintenance Plans',
      '- **Preventive maintenance templates:** create Maintenance Plans linked to an Asset or Account to schedule recurring work orders automatically.',
      '- **Maintenance work rules:** define frequency (daily, weekly, monthly, by meter reading) and the Work Type to use for auto-generated work orders.',
      "- **Auto-generation of work orders:** the FSL managed package generates work orders on schedule. Configure the Maintenance Plan's Start Date and Next Suggested Maintenance Date.",
      '- **Recurrence patterns:** supported patterns include daily, weekly (by day of week), monthly (by date or day of month), and asset-usage-based (by meter value increment).',
      '',
      '## Dispatcher Console Tips',
      '- **Gantt chart view:** configure visible columns (resource name, territory, utilization) and time scale (day/week/month) per dispatcher preference via FSL Console Settings.',
      '- **Map view:** use the map to identify geographic clusters of appointments. Color-code by status to quickly spot unscheduled or overdue appointments.',
      '- **Appointment booking API:** use the `FSL.ScheduleService` Apex class for programmatic self-scheduling in Experience Cloud or Apex triggers. It respects the configured scheduling policy.',
      '- **Resource utilization monitoring:** use the Utilization report in the Dispatcher Console to identify over- and under-utilized resources and rebalance workload proactively.',
      '',
      ...deployment(),
      '',
      ...semanticCommits(),
      '',
      ...interactionPreferences('Field Service configuration'),
    ].join('\n');
  },
};
