# Role Profiles

`setup-agents` supports 10 role profiles. Each generates a dedicated `.mdc` rule file for Cursor AI and contributes extensions to `.vscode/extensions.json`.

Profiles are **combinable** — select as many as apply to your role on the project.

---

## Profile Overview

| Profile | Flag | Rule File | Auto-detect |
|---------|------|-----------|-------------|
| [Developer](#-developer) | `developer` | `developer-standards.mdc` | — |
| [Architect](#-architect) | `architect` | `architect-standards.mdc` | — |
| [Business Analyst](#-business--solution-analyst) | `ba` | `ba-standards.mdc` | — |
| [MuleSoft](#-mulesoft-architect--developer) | `mulesoft` | `mulesoft-standards.mdc` | `mule-artifact.json` / `pom.xml` |
| [UX / UI](#-ux--ui-designer) | `ux` | `ux-standards.mdc` | — |
| [CGCloud](#-consumer-goods-cloud-cgcloud) | `cgcloud` | `cgcloud-standards.mdc` | `cgcloud__` in `package.xml` |
| [DevOps](#-devops--release-manager) | `devops` | `devops-standards.mdc` | `.github/workflows` / `azure-pipelines.yml` |
| [QA](#-qa--test-automation) | `qa` | `qa-standards.mdc` | `playwright.config.ts/js` |
| [CRM Analytics](#-crm-analytics-engineer-crma) | `crma` | `analytics-standards.mdc` | `WaveDashboard` / `WaveDataflow` in `package.xml` |
| [Data Cloud](#-data-cloud-architect--engineer) | `data360` | `data360-standards.mdc` | `DataStream` / `DataModelObject` in `package.xml` |

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

## Combining profiles

Profiles compose naturally. The `sub-agent-protocol.mdc` generated by the command maps each active profile to its task domain, so AI agents always know which role handles which type of work.

```sh
# Analytics team
sf setup local --profile developer,crma,data360

# Full Salesforce project team
sf setup local --profile developer,architect,ba,ux,devops,qa

# CGCloud + Analytics convergence project
sf setup local --profile developer,architect,cgcloud,crma
```
