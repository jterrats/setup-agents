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

import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { generateSfmcWorkflows } from '../generators/workflows/sfmc.js';
import { consultativeDesign, interactionPreferences, semanticCommits } from './shared-sections.js';
import type { Profile } from './types.js';

function hasAmpscriptFiles(cwd: string): boolean {
  try {
    return readdirSync(cwd, { recursive: true }).some(
      (f) => typeof f === 'string' && f.endsWith('.ampscript')
    );
  } catch {
    return false;
  }
}

export const sfmcProfile: Profile = {
  id: 'sfmc',
  label: 'Marketing Cloud (SFMC)',
  ruleFile: 'sfmc-standards.mdc',
  extensions: ['sergey-agadzhanov.ampscript', 'markus-edenhauser.mc-devtools'],
  workflows: generateSfmcWorkflows,
  detect(cwd: string): boolean {
    return existsSync(join(cwd, 'mc-project.json')) || hasAmpscriptFiles(cwd);
  },
  ruleContent(): string {
    return [
      '---',
      'description: Marketing Cloud (SFMC) Standards',
      'globs:',
      'alwaysApply: true',
      '---',
      '',
      '# Marketing Cloud (SFMC) Standards',
      '',
      '> Role: Marketing Cloud Developer — Salesforce Professional Services.',
      '',
      ...consultativeDesign('SFMC architecture and data model decisions'),
      '',
      '## AMPscript Best Practices',
      '- Use `%%[` / `]%%` delimiters consistently. Prefer block-level AMPscript over inline for readability.',
      '- Declare variables with `SET @varName = value` at the top of the script block.',
      '- Use `Lookup()`, `LookupRows()`, and `LookupOrderedRows()` for Data Extension reads — choose based on single vs. multi-row needs.',
      '- Prefer `TreatAsContent()` for dynamic content rendering instead of nested `%%=v()=%%` chains.',
      '- Use `Output()` and `OutputLine()` for debugging — remove before production.',
      '- Use `FOR @i = 1 TO RowCount(@rows) DO` for iterating row sets. Always check `RowCount() > 0` first.',
      '- Use `IIF()` for simple conditionals, `IF/ELSEIF/ELSE/ENDIF` for complex branching.',
      '- Avoid deeply nested AMPscript in HTML — extract reusable snippets into Content Blocks.',
      '- Use `ContentBlockByKey()` or `ContentBlockByName()` to reference shared AMPscript libraries.',
      '',
      '## AMPscript Functions Reference',
      '- **String:** `Concat()`, `Substring()`, `Length()`, `Replace()`, `Trim()`, `Uppercase()`, `Lowercase()`, `IndexOf()`.',
      '- **Date:** `Now()`, `DateAdd()`, `DateDiff()`, `DatePart()`, `Format()`, `SystemDateToLocalDate()`.',
      '- **Data:** `Lookup()`, `LookupRows()`, `LookupOrderedRows()`, `InsertDE()`, `UpdateDE()`, `UpsertDE()`, `DeleteDE()`.',
      '- **HTTP:** `HTTPGet()`, `HTTPPost()`, `HTTPPost2()` — always wrap in error handling.',
      '- **Utility:** `GUID()`, `Base64Encode()`, `Base64Decode()`, `SHA256()`, `EncryptSymmetric()`, `DecryptSymmetric()`.',
      '',
      '## Server-Side JavaScript (SSJS)',
      '- Always begin scripts with `<script runat="server">` and `Platform.Load("core", "1.1.5");`.',
      '- Use `Platform.Function.Lookup()` for DE reads and `Platform.Function.InsertDE()` / `UpdateDE()` for writes.',
      '- Use `Platform.Function.TreatAsContent()` to render AMPscript from SSJS context.',
      '- SSJS is synchronous — there are no Promises or async/await. Plan execution flow accordingly.',
      '- Use `try { } catch (e) { Write(Stringify(e)); }` for error handling. Log to a dedicated "Error_Log" Data Extension in production.',
      '- Use `HTTPHeader.SetValue("Content-Type", "application/json")` for API-style CloudPages.',
      '- Prefer SSJS over AMPscript for: complex JSON parsing, REST API integrations, and multi-step transactional logic.',
      '- Use `Variable.SetValue()` to pass values between SSJS and AMPscript blocks in the same page.',
      '',
      '## Journey Builder Design',
      '- **Entry Sources:** Use Data Extension Entry, API Event, or CloudPages Form Post. Prefer DE Entry for batch campaigns.',
      '- **Decision Splits:** Base on DE field values or engagement data. Keep split logic simple — max 5 branches per split.',
      '- **Wait Steps:** Use relative waits ("Wait 1 day") for drip campaigns. Use "Wait until date" for date-anchored journeys.',
      '- **Exit Criteria:** Always define exit criteria to prevent contacts from receiving irrelevant messages (e.g., `Unsubscribed = true` or goal reached).',
      '- **Goals:** Set a measurable goal (e.g., purchase made, form submitted) to track journey effectiveness.',
      '- **Contact Frequency:** Respect frequency caps to prevent over-messaging. Use Einstein STO when available.',
      '- **Naming:** `[BU]-[CampaignType]-[Audience]-[YYYY-MM]` (e.g., `CORP-Welcome-NewSubs-2026-04`).',
      '- **Testing:** Always use a test DE with seed contacts before activating. Verify each path end-to-end.',
      '',
      '## SQL for Data Extensions',
      '- Use `SELECT` with explicit column lists — never `SELECT *` in production queries.',
      '- Use `INNER JOIN` or `LEFT JOIN` with clear aliases: `FROM Subscribers s INNER JOIN Orders o ON s.SubscriberKey = o.SubscriberKey`.',
      '- Use `CONVERT(DATE, GETDATE())` for date comparisons, not string casting.',
      '- Use `DATEADD()`, `DATEDIFF()`, and `GETDATE()` for relative date filtering.',
      '- Index Data Extensions on fields used in `WHERE` and `JOIN` clauses (set as Primary Key or add to Sendable Relationship).',
      '- Use `TOP` for result limiting when testing queries. Use `DISTINCT` only when genuinely needed — it is expensive.',
      '- For deduplication: `ROW_NUMBER() OVER (PARTITION BY SubscriberKey ORDER BY ModifiedDate DESC)` pattern.',
      '- Always test SQL queries in Query Studio (Automation Studio) before scheduling.',
      '- **Max query runtime:** 30 minutes. Optimize JOINs and WHERE clauses for large Data Extensions (>1M rows).',
      '',
      '## Content Builder',
      '- **Folder Structure:** Organize by campaign type → year → month (e.g., `Welcome/2026/04/`).',
      '- **Naming Convention:** `[Type]-[CampaignName]-[Variant]` (e.g., `Email-WelcomeSeries-V1`).',
      '- Use **Content Blocks** for reusable components: headers, footers, preference centers, legal disclaimers.',
      '- Reference Content Blocks by **External Key** (`ContentBlockByKey()`) — more stable than name or ID.',
      '- Use **Dynamic Content** blocks for personalization variations based on subscriber attributes.',
      '- Always include a **plain-text version** for accessibility and deliverability.',
      '',
      '## Sender Profiles & Deliverability',
      '- Configure Sender Authentication Package (SAP): branded domain, authenticated sending, dedicated IP (for high volume).',
      '- Use **Reply Mail Management** (RMM) to handle auto-replies and out-of-office.',
      '- Set up **Sender Profiles** per business unit or campaign type — never use the default profile in production.',
      '- Monitor deliverability: check bounce rates (target <2%), spam complaint rates (<0.1%), and engagement metrics.',
      '- Use **List Detective** to identify known bad addresses before sending. Clean subscriber lists quarterly.',
      '',
      '## CloudPages Development',
      '- Structure CloudPages as: AMPscript data logic at top → HTML/CSS body → SSJS for API endpoints.',
      '- Use `RequestParameter()` to read query strings and form POST data.',
      '- Validate all input: check for empty values, sanitize strings, and validate email format before processing.',
      '- For forms: use hidden fields with `GUID()` tokens to prevent CSRF. Validate tokens server-side.',
      '- Use `Redirect()` after form POST processing to prevent resubmission on refresh (PRG pattern).',
      '- Use `CloudPagesURL()` to generate authenticated links to other CloudPages with encrypted parameters.',
      '- For JSON APIs: set `HTTPHeader.SetValue("Content-Type", "application/json")` and use `Write(Stringify(response))`.',
      '',
      '## Automation Studio',
      '- **SQL Activities:** Run in sequence when one depends on another\'s output DE. Use overwrite or append mode deliberately.',
      '- **Script Activities:** Use for SSJS-based processing (API calls, complex transformations). Log results to a monitoring DE.',
      '- **Import Activities:** Map columns explicitly. Set notification on error. Use "Add and Update" for incremental loads.',
      '- **Extract Activities:** Use for data exports to SFTP (Safehouse). Set file naming with date stamps.',
      '- **Scheduling:** Use "Recurring" for daily/weekly automations. Set a monitoring notification email on failure.',
      '- **Naming:** `[BU]-[Purpose]-[Frequency]` (e.g., `CORP-EngagementSync-Daily`).',
      '- **Error Handling:** Add a verification SQL query step after critical steps to validate row counts.',
      '',
      '## Data Extension Design',
      '- **Primary Keys:** Always define a primary key. Use `SubscriberKey` for subscriber-related DEs, `GUID()` for transactional DEs.',
      '- **Data Types:** Use `Text(254)` for general strings, `EmailAddress` for emails, `Date` for dates, `Boolean` for flags, `Decimal(18,2)` for currency.',
      '- **Retention Policy:** Set data retention on high-volume DEs. Options: delete after N days, or delete individual records after N days since last modified.',
      '- **Sendable DEs:** Link to `Subscribers` on `SubscriberKey`. Mark as "Used for Sending" only when needed for sends.',
      '- **Naming:** `[BU]_[Domain]_[Purpose]` (e.g., `CORP_Orders_Transactions`, `CORP_Prefs_EmailOptIn`).',
      '- **Field Naming:** PascalCase for field names (`FirstName`, `OrderDate`). Add `_Flag` suffix for booleans (`Active_Flag`).',
      '- **Nullable Fields:** Make non-required fields nullable. Never default to empty string — use `NULL`.',
      '',
      '## Error Handling',
      '- **AMPscript:** Use `RaiseError()` to halt execution with a user-facing message. Use `RaiseError(msg, true)` to also log to tracking.',
      '- **SSJS:** Wrap critical blocks in `try/catch`. Log errors to a dedicated `Error_Log` Data Extension with: `Timestamp`, `Source`, `ErrorMessage`, `SubscriberKey`.',
      '- **Automation Studio:** Configure failure notification emails. Add verification steps to validate output row counts.',
      '- **Journey Builder:** Use Decision Splits to handle null/missing data gracefully — route to a "data incomplete" path rather than erroring.',
      '- Never silently swallow errors. Every catch block must either log, alert, or re-raise.',
      '',
      '## Deployment & Package Management',
      '- Use **SFMC DevTools** (`mcdev`) for source control and deployment of SFMC metadata.',
      '- Store all retrievable assets in version control: emails, CloudPages, automations, queries, scripts, Data Extensions (definitions only).',
      '- Use `mcdev retrieve` to pull from BU, `mcdev deploy` to push. Never deploy directly in the UI for production changes.',
      '- Maintain separate BU configs for development, staging, and production.',
      '- **Package naming:** Follow the `mc-project.json` configuration. Keep BU mappings up to date.',
      '',
      ...semanticCommits(),
      '',
      '## Sub-agent Handover',
      '- Pass to sub-agents: BU configuration, Data Extension schema, Journey naming conventions, and mcdev project structure.',
      '- Sub-agents must follow: input validation on CloudPages, explicit column lists in SQL, and error logging to dedicated DEs.',
      '',
      ...interactionPreferences('SFMC architecture and data model'),
    ].join('\n');
  },
};
