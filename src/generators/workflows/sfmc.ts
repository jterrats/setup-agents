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

export function generateSfmcWorkflows(version: string): Record<string, string> {
  return {
    'create-cloudpage.md': workflow(
      version,
      'Create CloudPage',
      `
## 1. Gather Requirements

Ask:
- Page purpose (landing page, form, preference center, JSON API endpoint)
- Data Extensions involved (subscriber data, form submissions, transactional data)
- Authentication needs (public page vs. authenticated via \`CloudPagesURL()\`)

## 2. Structure the Page

Build with the standard CloudPage pattern:
1. **AMPscript block** at the top: variable declarations, DE lookups, form processing
2. **HTML body**: SFMC-compatible HTML with inline CSS (no external stylesheets for email clients)
3. **SSJS section** (if needed): API calls, JSON responses, complex logic

\`\`\`
%%[
SET @subKey = RequestParameter("sk")
SET @rows = LookupRows("MyDE", "SubscriberKey", @subKey)
IF RowCount(@rows) > 0 THEN
  SET @row = Row(@rows, 1)
  SET @firstName = Field(@row, "FirstName")
ENDIF
]%%

<!DOCTYPE html>
<html>
<head><title>My CloudPage</title></head>
<body>
  <h1>Hello, %%=v(@firstName)=%%</h1>
</body>
</html>
\`\`\`

## 3. Form Handling (if applicable)

- Use POST method with a hidden CSRF token: \`<input type="hidden" name="token" value="%%=GUID()=%%" />\`
- Process form data with \`RequestParameter()\`
- Use \`InsertDE()\` or \`UpsertDE()\` to persist submissions
- Redirect after POST to prevent resubmission (\`Redirect()\`)

## 4. Validate & Publish

- Test with seed subscriber keys from a test DE
- Verify all DE lookups return expected data
- Check error paths (missing parameters, empty DE results)
- Publish via Content Builder → CloudPages collection
`
    ),
    'build-journey.md': workflow(
      version,
      'Build Journey',
      `
## 1. Define Journey Architecture

Ask:
- Campaign type (welcome series, re-engagement, transactional, lifecycle)
- Entry source (Data Extension Entry, API Event, CloudPages Form Post)
- Target audience and segmentation criteria
- Expected volume and send frequency

## 2. Configure Entry Source

- **DE Entry:** Create or identify the entry DE with required fields (\`SubscriberKey\`, \`EmailAddress\`, segmentation fields)
- **API Event:** Define the Event Definition in Journey Builder with the schema
- Set contact entry mode: "Re-entry anytime", "Re-entry only after exiting", or "No re-entry"

## 3. Build the Journey Canvas

1. **Entry → Wait** (if drip): set relative wait duration
2. **Decision Split**: branch on subscriber attributes or engagement data
   - Keep splits to ≤5 branches for maintainability
   - Always include a "Default / Other" path
3. **Activities**: Email, SMS, Wait, Update Contact, Custom Activity
4. **Goal**: define a measurable conversion event (purchase, form submit, click)
5. **Exit Criteria**: \`Unsubscribed = true\`, goal met, or max duration reached

## 4. Test the Journey

- Create a test DE with 5–10 seed contacts covering each decision path
- Activate in **Test Mode** first — verify each path end-to-end
- Check wait step durations and decision split logic
- Verify exit criteria correctly eject contacts

## 5. Activate & Monitor

- Name: \`[BU]-[CampaignType]-[Audience]-[YYYY-MM]\`
- Set journey-level frequency cap if applicable
- Monitor: open rates, click rates, goal conversion, and error contacts
`
    ),
    'data-extension-query.md': workflow(
      version,
      'Data Extension Query',
      `
## 1. Clarify the Query Goal

Ask:
- Source Data Extensions and their key fields
- Desired output: new DE (overwrite vs. append) or inline result
- Filters: date ranges, subscriber segments, engagement criteria
- Scheduling: one-time or recurring in Automation Studio

## 2. Write the SQL Query

Use explicit column lists and clear aliases:

\`\`\`sql
SELECT
    s.SubscriberKey,
    s.EmailAddress,
    s.FirstName,
    o.OrderId,
    o.OrderDate,
    o.TotalAmount
FROM Subscribers AS s
INNER JOIN Orders AS o
    ON s.SubscriberKey = o.SubscriberKey
WHERE o.OrderDate >= DATEADD(day, -30, GETDATE())
  AND s.Status = 'Active'
\`\`\`

### Optimization Tips
- Filter early: put the most restrictive \`WHERE\` clause on the largest table
- Use \`TOP\` during development to limit result sets
- For deduplication: \`ROW_NUMBER() OVER (PARTITION BY SubscriberKey ORDER BY ModifiedDate DESC)\`
- Avoid \`SELECT DISTINCT\` on large DEs — use \`GROUP BY\` or window functions instead
- Target DE must have matching column names and compatible data types

## 3. Create the Target Data Extension

- Define columns matching the SELECT list (name and data type)
- Set a Primary Key on the deduplication column (\`SubscriberKey\` or composite key)
- Configure data retention if the DE will grow continuously

## 4. Test in Query Studio

- Run the query in Automation Studio → Query Studio
- Verify row count matches expectations
- Check for NULL values in key fields
- Validate date calculations with known data points

## 5. Schedule (if recurring)

- Create an Automation with the SQL Query Activity
- Set overwrite or append based on use case
- Add a verification step: second query that checks output row count > 0
- Configure failure notification email
`
    ),
  };
}
