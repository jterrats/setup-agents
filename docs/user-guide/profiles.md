# Role Profiles

`setup-agents` supports 22 role profiles. Each generates dedicated rule content for all configured AI tools (Cursor, VS Code, Codex, Claude, Agentforce) and contributes extensions to `.vscode/extensions.json`.

Profiles are **combinable** — select as many as apply to your role on the project.

---

## Profile Overview

| Profile | Flag | Rule File | Auto-detect |
|---------|------|-----------|-------------|
| [Developer](#-developer) | `developer` | `developer-standards.mdc` | — |
| [Architect](#-architect) | `architect` | `architect-standards.mdc` | — |
| [Business Analyst](#-business--solution-analyst) | `ba` | `ba-standards.mdc` | — |
| [Project Manager](#-project-manager) | `pm` | `pm-standards.mdc` | — |
| [MuleSoft](#-mulesoft-architect--developer) | `mulesoft` | `mulesoft-standards.mdc` | `mule-artifact.json` / `pom.xml` |
| [UX / UI](#-ux--ui-designer) | `ux` | `ux-standards.mdc` | — |
| [CGCloud](#-consumer-goods-cloud-cgcloud) | `cgcloud` | `cgcloud-standards.mdc` | `cgcloud__` in `package.xml` |
| [DevOps](#-devops--release-manager) | `devops` | `devops-standards.mdc` | `.github/workflows` / `azure-pipelines.yml` |
| [QA](#-qa--test-automation) | `qa` | `qa-standards.mdc` | `playwright.config.ts/js` |
| [CRM Analytics](#-crm-analytics-engineer-crma) | `crma` | `analytics-standards.mdc` | `WaveDashboard` / `WaveDataflow` in `package.xml` |
| [Data Cloud](#-data-cloud-architect--engineer) | `data360` | `data360-standards.mdc` | `DataStream` / `DataModelObject` in `package.xml` |
| [Admin / Configurator](#-admin--configurator) | `admin` | `admin-standards.mdc` | `force-app/` directory |
| [Marketing Cloud (SFMC)](#-marketing-cloud-sfmc) | `sfmc` | `sfmc-standards.mdc` | `.ampscript` files / `mc-project.json` |
| [Commerce Cloud (B2B/B2C)](#-commerce-cloud-b2bb2c) | `commerce` | `commerce-standards.mdc` | `dw.json` / `cartridges/` / B2B metadata |
| [Security / Compliance](#-security--compliance) | `security` | `security-standards.mdc` | `force-app/` directory |
| [Service Cloud](#-service-cloud) | `service` | `service-standards.mdc` | `objects/Case/` / `entitlementProcesses/` / `bots/` |
| [CPQ Specialist](#-cpq-specialist) | `cpq` | `cpq-standards.mdc` | `SBQQ__Quote__c/` / `SBQQ__*.object-meta.xml` |
| [OmniStudio](#-omnistudio--vlocity) | `omnistudio` | `omnistudio-standards.mdc` | `omniScripts/` / `flexCards/` |
| [Field Service (FSL)](#-field-service-fsl) | `fsl` | `fsl-standards.mdc` | `objects/ServiceAppointment/` / `objects/WorkOrder/` |
| [AI / Agentforce Specialist](#-ai--agentforce-specialist) | `ai` | `ai-standards.mdc` | `bots/` / `aiApplications/` |
| [Slack Developer](#-slack-developer-boltjs) | `slack` | `slack-standards.mdc` | `slack.json` / `manifest.json` |
| [Tableau / Analytics Cloud](#-tableau--analytics-cloud) | `tableau` | `tableau-standards.mdc` | `datasources/` / `workbooks/` / `tableau-project.json` |

All profiles inherit the base `salesforce-standards.mdc` when the project contains `sfdx-project.json`.

---

## 👨‍💻 Developer

**Flag:** `--profile developer`
**Rule file:** `developer-standards.mdc`

Covers the day-to-day Salesforce development workflow: Apex, LWC, Triggers, SOQL, DML, and Apex tests.

**Key rules:**
- Default `with sharing`; Apex REST → always `without sharing`
- No SOQL or DML inside loops — always bulkify
- One trigger per object, zero logic — Kevin O'Hara Trigger Handler
- Data layer: JT_DynamicQueries first, DataSelector as fallback
- Exactly one `Assert` per test method (modern `Assert` class)
- `@TestSetup` for shared data; `System.runAs()` with PSG-based test users

**Extensions added:** Apex Debugger, Apex Replay Debugger, PMD, Code Analyzer, Salesforce Diff, SFDX Auto Deployer, Auto Header, Package XML Generator, Lana

---

## 🏛️ Architect

**Flag:** `--profile architect`
**Rule file:** `architect-standards.mdc`

Enforces design-before-code discipline: Mermaid diagrams required before touching files, ADRs, pattern selection, and cross-cutting concern ownership.

**Key rules:**
- For changes affecting 2+ objects or 3+ metadata types → diagram first, always
- Document decisions in `/docs/adr/` using `ADR-NNN-<title>.md`
- Present trade-offs for every architectural option (no Ninja Edits)
- Identify governor limit risks at design time
- Integrations: Named Credentials required, never inline endpoints

**Extensions added:** Apex Debugger, Replay Debugger, PMD, Code Analyzer, Salesforce Diff

---

## 📋 Business / Solution Analyst

**Flag:** `--profile ba`
**Rule file:** `ba-standards.mdc`

Focuses on declarative-first configuration, user story documentation, and process diagrams.

**Key rules:**
- Acceptance criteria in Gherkin format (Given / When / Then)
- Declarative over code — Flows, Validation Rules, Formula Fields before Apex
- Mermaid process diagram required before any configuration spec
- All labels in Spanish; custom fields require a description with business purpose
- StandardValueSets for standard picklists

**Extensions added:** SOQL Editor, SLDS viewer, XML, YAML, Prettier

---

## 📅 Project Manager

**Flag:** `--profile pm`
**Rule file:** `pm-standards.mdc`

Sprint planning, status reporting, risk management, and release coordination for Salesforce projects.

**Key rules:**
- Frame all work items with: Backlog Item ID, priority, estimated effort, and assignee
- Weekly status reports with RAG (Red/Amber/Green) indicators for scope, schedule, and budget
- Mermaid Gantt charts for sprint and release timelines
- Risk register with probability, impact, mitigation, and owner
- Formal Change Request (CR) process for any scope that impacts budget or timeline
- Never approve a production release without a documented rollback plan
- Project closure: lessons learned + knowledge transfer checklist

**Extensions added:** Markdown Mermaid, Markdown All-in-One, YAML, Prettier, Todo Tree

---

## 🔗 MuleSoft Architect / Developer

**Flag:** `--profile mulesoft`
**Rule file:** `mulesoft-standards.mdc`
**Auto-detect:** `mule-artifact.json` or `pom.xml`

API-design-first approach using RAML/OAS, API-led connectivity model, and MUnit test coverage.

**Key rules:**
- Define API spec (RAML or OAS 3.0) and publish to Anypoint Exchange before coding
- API-led Connectivity: System → Process → Experience layers
- Every flow must have explicit On Error Propagate/Continue scope
- Named Credentials on the Salesforce side for all outbound connections
- MUnit tests for all flows — 80% coverage minimum; mock all external deps

**Extensions added:** REST Client, RAML, Thunder Client, XML, YAML

---

## 🎨 UX / UI Designer

**Flag:** `--profile ux`
**Rule file:** `ux-standards.mdc`

SLDS-first design system compliance, accessibility (WCAG 2.1 AA), and Lightning Data Service usage.

**Key rules:**
- SLDS Styling Hooks over custom CSS — no overriding component internals
- All interactive elements must have accessible labels
- Color alone must not convey information
- Test at 320px, 768px, 1280px breakpoints
- Toast notifications via Custom Labels (Spanish)

**Extensions added:** SLDS, LWC, ESLint, Prettier

---

## ☁️ Consumer Goods Cloud (CGCloud)

**Flag:** `--profile cgcloud`
**Rule file:** `cgcloud-standards.mdc`
**Auto-detect:** `cgcloud__` namespace in `package.xml`

Managed package awareness, Modeler-configuration-first, and CGCloud extension point discipline.

**Key rules:**
- Never modify `cgcloud__` managed package components
- Before writing Apex/LWC, ask: _"Can this be solved with Modeler configuration?"_
- Deploy CMDT (Modeler records) before Apex that depends on them
- Test all logic under each CGCloud persona (Field Rep, Territory Manager, Back Office)
- Territory-based sharing rules must never be bypassed

**Extensions added:** Prophet, Commerce DX

---

## ⚙️ DevOps / Release Manager

**Flag:** `--profile devops`
**Rule file:** `devops-standards.mdc`
**Auto-detect:** `.github/workflows/` or `azure-pipelines.yml`

Validate-before-deploy discipline, pipeline stages, scratch org lifecycle, and rollback strategy.

**Key rules:**
- Always `sf project deploy validate -d force-app` before quick deploy
- Pipeline stages: Lint → Test → Validate → Deploy → Smoke Test
- `--test-level RunLocalTests` for sandbox, `RunAllTestsInOrg` for production
- Destructive changes require explicit approval before deployment
- Prefer Unlocked Packages; pin versions — never use `LATEST`

**Extensions added:** GitHub Actions, Azure Pipelines, Docker, YAML

---

## 🧪 QA / Test Automation

**Flag:** `--profile qa`
**Rule file:** `qa-standards.mdc`
**Auto-detect:** `playwright.config.ts` or `playwright.config.js`

Playwright as the base framework, Page Object Model enforced, and `@axe-core/playwright` for accessibility.

**Key rules:**
- Page Objects are mandatory — tests must not contain raw selectors
- Selector priority: `data-testid` > ARIA role > text > CSS (no XPath)
- Each test must be fully independent — no shared state
- Log in via API (not UI) when possible for test setup
- Use `waitFor` patterns — never `page.waitForTimeout`
- Screenshots and traces captured on failure

**Extensions added:** Playwright for VS Code, ESLint, Prettier

---

## 📊 CRM Analytics Engineer (CRMA)

**Flag:** `--profile crma`
**Rule file:** `analytics-standards.mdc`
**Auto-detect:** `WaveApplication`, `WaveDashboard`, `WaveDataflow`, `WaveRecipe` in `package.xml`
**Inherits:** `salesforce-standards.mdc`

Covers CRMA (Tableau CRM) development: Recipes, Dataflows, Datasets, SAQL, Dashboards, and security predicates.

**Key rules:**
- Recipes (Data Prep) over Dataflows for all new implementations — Dataflows are legacy
- Dataset lineage diagram required before any recipe or dashboard build
- Every sensitive dataset must have a Security Predicate defined and tested per persona
- Filter early in SAQL — never load all records and filter at render time
- Deployment order: Datasets → Dataflows/Recipes → Lenses → Dashboards → Apps

**Extensions added:** Analytics DX, Analytics DX Core, Analytics DX Templates

---

## 🌐 Data Cloud Architect / Engineer (Data 360)

**Flag:** `--profile data360`
**Rule file:** `data360-standards.mdc`
**Auto-detect:** `DataStream`, `DataModelObject`, `DataSalesforceObject` in `package.xml`
**Inherits:** `salesforce-standards.mdc`

Covers Salesforce Data Cloud: Data Streams, DMOs, Identity Resolution, Calculated Insights, Segments, and Activation Targets.

**Key rules:**
- Data lineage diagram (Source → Stream → DLO → DMO → Segment → Activation) required before any build
- IR strategy document required before configuring any rules
- Many configurations (IR rulesets, Activation Targets, Consent) cannot be deployed via metadata API — document manual steps in every release note
- Activation Targets must use Named Credentials
- Every segment containing PII requires legal review before activation

**Extensions added:** XML, YAML, REST Client

---

## 🛠️ Admin / Configurator

**Flag:** `--profile admin`
**Rule file:** `admin-standards.mdc`
**Auto-detect:** `force-app/` directory present

Covers declarative-first Salesforce configuration: Flows, Validation Rules, Permission Sets, Page Layouts, Record Types, Custom Fields, and Custom Metadata Types.

**Key rules:**
- No Mega-Flows — break into Sub-flows; one Record-Triggered Flow per object/context
- Validation rules always include a bypass via `$Permission.Bypass_Validation_Rules`
- Permission Sets over Profiles, least-privilege always
- API Names in PascalCase (English); labels in Spanish
- CMDT for deployable config; Custom Settings only for runtime toggles
- Process Automation Decision Tree: Flow first, escalate to Apex only when necessary; never use Workflow Rules or Process Builder

**Extensions added:** Salesforce Extension Pack, SFDX Hardis, Package XML Generator, SFCC Metadata, VS Code LWC

---

## 📧 Marketing Cloud (SFMC)

**Flag:** `--profile sfmc`
**Rule file:** `sfmc-standards.mdc`
**Auto-detect:** `.ampscript` files or `mc-project.json`

Independent Marketing Cloud ecosystem: AMPscript, SSJS, Journey Builder, Data Extensions, Content Builder, and Automation Studio. Does **not** reference Apex, LWC, or `sfdx-project.json`.

**Key rules:**
- AMPscript: use `%%[ ]%%` blocks for logic; `%%=AttributeValue()=%%` for personalization
- SSJS: always wrap in `try/catch`; use `HTTP.Get`/`HTTP.Post` with Named Credentials equivalent (Client Credentials)
- Journey Builder: one entry source per journey; document decision splits; set re-entry rules explicitly
- SQL on Data Extensions: filter early, use indexed SendableDE fields, avoid `SELECT *`
- Content Builder: folder structure mirrors business unit hierarchy
- Never hardcode subscriber keys or email addresses in templates

**Extensions added:** AMPscript syntax highlighting, MC DevTools

---

## 🛒 Commerce Cloud (B2B/B2C)

**Flag:** `--profile commerce`
**Rule file:** `commerce-standards.mdc`
**Auto-detect:** `dw.json` / `cartridges/` (B2C) or `force-app/` with B2B metadata

Covers both Commerce Cloud flavors: B2C (SFRA, ISML, hooks, OCAPI/SCAPI) and B2B (Apex integrations, LWC storefront, buyer groups, checkout flows).

**Key rules — B2C:**
- SFRA controllers: always extend server module; chain middleware correctly; never modify platform cartridges
- ISML templates: use `isinclude`/`ismodule`; avoid inline scripts; use `isprint` for escaped output
- Cartridge layering: overlay via `module.superModule`; one custom cartridge per functional domain
- OCAPI/SCAPI: always authenticate via Client Credentials; validate responses; handle 429 with backoff

**Key rules — B2B:**
- `ConnectApi` for checkout flows; `StoreIntegratedService` for external integrations
- Buyer Groups → Entitlements → Price Books must be set up before any checkout test
- Custom LWC for storefront must follow SLDS and pass accessibility checks

**Extensions added:** SFCC Studio, Prophet Debugger, Salesforce Extension Pack

---

## 🔒 Security / Compliance

**Flag:** `--profile security`
**Rule file:** `security-standards.mdc`
**Auto-detect:** `force-app/` directory present

Focuses on the Salesforce security layer: OWD, sharing rules, FLS, Platform Encryption (Shield), event monitoring, login flows, and OWASP compliance.

**Key rules:**
- All SOQL in Apex: use `WITH SECURITY_ENFORCED` or `Security.stripInaccessible()` before DML
- CRUD checks mandatory before every DML operation
- Named Credentials required for all outbound calls — never hardcode endpoints or tokens
- Platform Encryption: deterministic for searchable fields; probabilistic for sensitive PII at rest
- Health Check score target: 90+ before any production release
- Custom Permissions for feature gates — never check Profile/Permission Set directly in Apex
- Login Flows for MFA enforcement and SSO step-up
- OWASP Top 10 for Salesforce: prevent SOQL injection, XSS in Visualforce/LWC, insecure direct object reference

**Extensions added:** Salesforce Extension Pack, SFDX Code Analyzer, Lana

---

## 🎧 Service Cloud

**Flag:** `--profile service`
**Rule file:** `service-standards.mdc`
**Auto-detect:** `objects/Case/`, `entitlementProcesses/`, or `bots/` in `force-app/`

Covers case management, entitlements, knowledge, Omni-Channel, and Einstein Bots.

**Key rules:**
- Case Assignment Rules: criteria-based before round-robin; escalation to queues, not users
- Entitlement Processes: one process per SLA tier; business hours per region; pause via status transitions
- Knowledge: record types for article types; 2-level data category hierarchy; approval process for external articles
- Omni-Channel: queue-based for low volume, skills-based for complex routing; capacity units per channel
- Einstein Bots: 20+ training utterances per intent; pre-populate case fields before agent handoff
- Messaging: WhatsApp requires explicit opt-in consent; track `MessagingConsentStatus` on Contact

**Extensions added:** Salesforce Extension Pack

---

## 💼 CPQ Specialist

**Flag:** `--profile cpq`
**Rule file:** `cpq-standards.mdc`
**Auto-detect:** `SBQQ__Quote__c` object directory or `SBQQ__*.object-meta.xml` files

Quote-to-cash configuration: product bundles, pricing rules, discount schedules, and approval chains.

**Key rules:**
- Standard Price Book as canonical list price reference — never encode discounts into list prices
- Discount Schedules and Price Rules handle all pricing modifications
- Bundle options support dependency/exclusion constraints — document all constraints
- Price Rule evaluation order (0–10) is critical — document intended sequence
- CPQ Apex Plugins (`SBQQ.QuoteCalculatorPlugin`) for custom price logic — use sparingly
- Coexistence with Kevin O'Hara trigger handler: document any CPQ managed trigger overlap

**Extensions added:** Salesforce Extension Pack

---

## 🏗️ OmniStudio / Vlocity

**Flag:** `--profile omnistudio`
**Rule file:** `omnistudio-standards.mdc`
**Auto-detect:** `force-app/main/default/omniScripts/` or `force-app/main/default/flexCards/`

FlexCards, DataRaptors, Integration Procedures, OmniScripts, and Decision Matrices.

**Key rules:**
- OmniScript naming: `<Object>/<Action>` (e.g., `Account/CreateAccount`); max 7 steps visible per screen
- DataRaptor naming: `DR_<Object>_<Action>`; use Turbo Extract for high-frequency reads
- Integration Procedure naming: `IP_<Domain>_<Action>`; one IP per business capability; log errors to Debug element
- FlexCard naming: `FC_<Object>_<Purpose>`; data source selected before layout design
- Avoid SOQL inside OmniScript Remote Actions in loops — cache with Set Values
- All assets must be source-controlled via OmniStudio export JSON — never rely solely on UI deployment

**Extensions added:** Salesforce Extension Pack

---

## 🔧 Field Service (FSL)

**Flag:** `--profile fsl`
**Rule file:** `fsl-standards.mdc`
**Auto-detect:** `objects/ServiceAppointment/` or `objects/WorkOrder/` in `force-app/`

Work order lifecycle, service appointments, scheduling policies, territory management, and mobile configuration.

**Key rules:**
- Work Order stages via Flow (not triggers) when declarative suffices; SLA tracking via milestones
- Scheduling Policies: document soft vs. hard constraints and objective weights
- Service Territory hierarchy: root → parent → child; operating hours per territory
- Mobile page layouts must include all required fields for offline form submission
- Maintenance Plans: use preventive maintenance templates for recurring work orders; document recurrence patterns
- Dispatcher Console: configure Gantt for visibility; monitor resource utilization and queue depth

**Extensions added:** Salesforce Extension Pack

---

## 🤖 AI / Agentforce Specialist

**Flag:** `--profile ai`
**Rule file:** `ai-standards.mdc`
**Auto-detect:** `force-app/main/default/bots/` or `force-app/main/default/aiApplications/`

Covers the full Agentforce development lifecycle: agent spec design, topic and action definition, prompt templates, grounding strategies (Einstein Search, Data Cloud), guardrails, and testing with `sf agent test run`.

**Key rules:**
- One agent per use case — multi-agent orchestration requires architectural sign-off
- Use `sf agent generate agent-spec` before creating anything in an org
- Store all prompt templates in `force-app/main/default/promptTemplates/`
- Target ≥ 80% topic match rate in test scenarios
- Never expose PII through agent responses

**Workflows added:** `create-agent.md`, `test-agent.md`, `deploy-agent.md`

**Extensions added:** Salesforce Extension Pack, Continue

---

## 💬 Slack Developer (Bolt.js)

**Flag:** `--profile slack`
**Rule file:** `slack-standards.mdc`
**Auto-detect:** `slack.json` or `manifest.json`

Covers Bolt.js app development integrated with Salesforce: listener organization, manifest management, Block Kit UI, Salesforce org access via `jsforce`, token security, and multi-workspace state management.

**Key rules:**
- Always call `ack()` within 3 seconds — Slack retries after timeout
- Verify Slack request signatures on every webhook via `SLACK_SIGNING_SECRET`
- Never hardcode org credentials — use env vars or Secrets Manager
- Organize listeners by type: `commands/`, `actions/`, `events/`, `shortcuts/`

**Workflows added:** `create-bolt-app.md`, `add-slash-command.md`, `deploy-slack-app.md`

**Extensions added:** ESLint, Prettier, REST Client

---

## 📊 Tableau / Analytics Cloud

**Flag:** `--profile tableau`
**Rule file:** `tableau-standards.mdc`
**Auto-detect:** `datasources/` or `workbooks/` or `tableau-project.json`

Covers Tableau and CRM Analytics development: data source strategy (live vs. extract), LOD expressions, dashboard performance, row-level security via User Attribute Functions, CRM Analytics recipes, and Tableau Embedding API v3 for Salesforce integrations.

**Key rules:**
- Prefer live connections to Salesforce — use extracts only when performance requires it
- Use LOD expressions (FIXED, INCLUDE, EXCLUDE) over table calculations
- Never bake security into workbooks — always use Salesforce SSO + User Attribute Functions
- Store `TABLEAU_SERVER_URL`, `TABLEAU_TOKEN_NAME`, `TABLEAU_TOKEN_SECRET` as env vars

**Workflows added:** `connect-salesforce-data.md`, `publish-workbook.md`, `embed-analytics.md`

**Extensions added:** Tableau Viz Extension SDK, ESLint, Prettier

---

## Combining profiles

Profiles compose naturally. The `sub-agent-protocol.mdc` generated by the command maps each active profile to its task domain, so AI agents always know which role handles which type of work.

```sh
# Analytics team
sf setup-agents local --profile developer,crma,data360

# Full Salesforce project team
sf setup-agents local --profile developer,architect,ba,ux,devops,qa

# CGCloud + Analytics convergence project
sf setup-agents local --profile developer,architect,cgcloud,crma
```
