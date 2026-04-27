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

export function generateTableauWorkflows(version: string): Record<string, string> {
  return {
    'connect-salesforce-data.md': workflow(
      version,
      'Connect Salesforce Data to Tableau',
      `
## 1. Gather Requirements

Ask:
- **Connection type:** Live connection or extract? (Prefer live for Salesforce CRM Analytics.)
- **Objects:** Which Salesforce objects or reports are needed?
- **Refresh schedule:** If extract, how often must data be refreshed?
- **Row-level security:** Is field-level or record-level access required?

Scan existing \`datasources/\` before creating new ones to avoid duplicates.

## 2. Configure the Salesforce Connector

In Tableau Desktop or Tableau Cloud:
1. **Connect** → Salesforce (or Salesforce CRM Analytics for live CRMA data)
2. Authenticate with Salesforce SSO — never use username/password in published datasources
3. Select the objects or SOQL query needed
4. Apply filters at the datasource level to limit row count

## 3. Define Row-Level Security

Use User Attribute Functions for RLS — never bake security into the workbook:

\`\`\`
// Calculated field: RLS Filter
[OwnerId] = USERNAME()
  OR ISMEMBEROF("Admin")
\`\`\`

Configure User Attributes in Tableau Cloud that map to Salesforce User fields.

## 4. Pre-aggregate When Possible

For large datasets, create a CRM Analytics recipe or Salesforce report as the source:

\`\`\`bash
# If using CRM Analytics dataflow
# Document each dataflow step in the recipe description field
\`\`\`

## 5. Publish the Datasource

\`\`\`bash
# Using tableau-server-client (Python)
import tableauserverclient as TSC

server = TSC.Server(os.environ['TABLEAU_SERVER_URL'])
tableau_auth = TSC.PersonalAccessTokenAuth(
    os.environ['TABLEAU_TOKEN_NAME'],
    os.environ['TABLEAU_TOKEN_SECRET'],
    os.environ['TABLEAU_SITE_ID'],
)
with server.auth.sign_in(tableau_auth):
    project = next(p for p in TSC.Pager(server.projects) if p.name == '<ProjectName>')
    datasource = TSC.DatasourceItem(project.id)
    server.datasources.publish(datasource, 'datasources/<DatasourceName>.tdsx', TSC.Server.PublishMode.Overwrite)
\`\`\`

## 6. Set the Refresh Schedule

In Tableau Cloud, assign a refresh schedule to the published datasource. Document the schedule in the datasource description field.
`
    ),
    'publish-workbook.md': workflow(
      version,
      'Publish Tableau Workbook',
      `
## 1. Pre-publish Checklist

Verify:
- All datasource connections point to production (not local files or dev sandboxes)
- Row-level security is configured via User Attribute Functions
- Dashboard has no more than 3 data sources
- Each view has fewer than 10 marks for performance
- Calculated fields have meaningful names (not Calculation_1)
- Related calculations are grouped in folders

## 2. Performance Review

Before publishing, run the Performance Recorder:
1. Help → Settings and Performance → Start Performance Recording
2. Navigate through all dashboard views
3. Stop recording and analyze the report

Optimize any query taking > 5 seconds:
- Replace dashboard filter actions with set actions or parameter actions
- Move heavy calculations to the datasource layer (pre-aggregate)
- Use LOD expressions instead of table calculations where possible

## 3. Validate Mobile Layout

Switch to the **Phone** layout in Tableau Desktop and verify:
- Key KPIs are visible without scrolling
- Touch targets are large enough (minimum 44x44px equivalent)
- No text is truncated

## 4. Publish

\`\`\`bash
# Using tableau-server-client (Python)
import tableauserverclient as TSC, os

server = TSC.Server(os.environ['TABLEAU_SERVER_URL'])
tableau_auth = TSC.PersonalAccessTokenAuth(
    os.environ['TABLEAU_TOKEN_NAME'],
    os.environ['TABLEAU_TOKEN_SECRET'],
    os.environ['TABLEAU_SITE_ID'],
)
with server.auth.sign_in(tableau_auth):
    project = next(p for p in TSC.Pager(server.projects) if p.name == '<ProjectName>')
    workbook = TSC.WorkbookItem(project.id)
    server.workbooks.publish(workbook, 'workbooks/<WorkbookName>.twbx', TSC.Server.PublishMode.Overwrite)
\`\`\`

## 5. Post-publish Validation

After publishing:
- Open the workbook in Tableau Cloud and verify all views load
- Confirm RLS is active by testing with a non-admin user
- Check that the refresh schedule is attached to connected datasources
`
    ),
    'embed-analytics.md': workflow(
      version,
      'Embed Tableau Analytics in Salesforce',
      `
## 1. Configure the Connected App

In Salesforce Setup → App Manager → New Connected App:
- Enable OAuth settings
- Enable "Use digital signatures" for JWT flow
- Add Tableau Cloud as an allowed callback URL
- Grant \`api\` and \`full\` OAuth scopes (minimum required)

## 2. Configure Tableau Embedding API v3

Add the Tableau Embedding API to your LWC or Visualforce page:

\`\`\`html
<script type="module" src="https://embedding.tableauusercontent.com/tableau.embedding.3.latest.min.js"></script>

<tableau-viz
  id="tableauViz"
  src="\${process.env.TABLEAU_VIEW_URL}"
  token="\${process.env.TABLEAU_JWT_TOKEN}"
  hide-tabs
  toolbar="hidden">
</tableau-viz>
\`\`\`

**Never hardcode** \`src\` or \`token\` — always read from environment variables or Named Credentials.

## 3. Generate the JWT Token Server-Side

Use Connected Apps JWT flow for SSO. Generate the token in Apex or a middleware service:

\`\`\`bash
# Never generate JWT tokens client-side
# Token must be short-lived (< 10 minutes)
# Include the Salesforce username as the subject claim
\`\`\`

## 4. Implement in LWC

\`\`\`javascript
// In your LWC controller
import { LightningElement, wire } from 'lwc';
import getTableauToken from '@salesforce/apex/TableauTokenController.getToken';

export default class TableauEmbed extends LightningElement {
  token;
  viewUrl = process.env.TABLEAU_VIEW_URL;  // Set via Custom Metadata or Named Credential

  @wire(getTableauToken)
  wiredToken({ data, error }) {
    if (data) this.token = data;
    if (error) console.error(error);
  }
}
\`\`\`

## 5. Verify Row-Level Security

Test the embedded view as a non-admin Salesforce user:
- Confirm the user only sees data scoped to their Salesforce profile
- Verify the JWT subject claim matches the Tableau User Attribute
- Check that no admin-level data leaks through filter bypasses
`
    ),
  };
}
