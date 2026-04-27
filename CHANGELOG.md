# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [1.3.0] - 2026-04-27

### ✨ Added

- **8 new role profiles** — completing the full profile matrix:
  - Tier 2: `service` (Service Cloud), `cpq` (CPQ Specialist), `omnistudio` (OmniStudio/Vlocity), `fsl` (Field Service)
  - Tier 3: `ai` (AI/Agentforce Specialist), `slack` (Slack Developer Bolt.js), `tableau` (Tableau/Analytics Cloud)
  - QA scaffold: `src/utils/salesforce-auth.ts` + `src/utils/salesforce-api.ts` generated when running `--profile qa`
- **Salesforce Playwright utilities scaffold** — `sf setup-agents local --profile qa` now writes two utility files into the user's project:
  - `salesforce-auth.ts`: `getSalesforceOrgInfo()`, `navigateWithCLISession()`, `useSalesforceCLISession()` via `execFileSync` (no shell interpolation, no DOM cookies)
  - `salesforce-api.ts`: `executeSoqlQuery()`, `createRecord()`, `updateRecord()`, `deleteRecord()` (Bearer token from SF CLI)
- **`session-from-cli.md` workflow** — QA profile gains a new workflow covering 3 authentication patterns (navigation, context-only, fixture) and CI/CD env var usage
- **78 new unit tests** — profile detect/ruleContent/workflows coverage for all 8 new profiles + generator tests

### 📝 Documentation

- `docs/user-guide/profiles.md` — updated profile count to 22, added table rows and detail sections for all 8 new profiles

---

## [0.2.0] - 2026-03-25

### ✨ Added

- **10 role profiles** — `developer`, `architect`, `ba`, `mulesoft`, `ux`, `cgcloud`, `devops`, `qa`, `crma`, `data360`
- **`--profile` flag** — comma-separated profile selection for non-interactive environments
- **Interactive multi-select prompt** — checkbox-based role selection powered by `@inquirer/prompts`
- **Auto-detection** — profiles pre-selected based on project signals:
  - `cgcloud__` in `package.xml` → CGCloud profile (with confirm prompt)
  - `WaveDashboard` / `WaveDataflow` in `package.xml` → CRMA profile
  - `DataStream` / `DataModelObject` in `package.xml` → Data Cloud profile
  - `.github/workflows` / `azure-pipelines.yml` → DevOps profile
  - `playwright.config.ts/js` → QA profile
  - `mule-artifact.json` / `pom.xml` → MuleSoft profile
- **`sub-agent-protocol.mdc`** — always generated; maps task types to active profiles with handover checklist
- **Per-profile `.mdc` rule files** — one dedicated Cursor rule file per selected role
- **Salesforce standards base rule** — `salesforce-standards.mdc` written for all Salesforce projects (independent of profiles)
- **`.vscode/extensions.json`** — profile extension union written for Salesforce projects
- **Cursor rule scope prompt** — choose between project-level `.mdc` or user-level instructions (Salesforce projects only)
- **Default profile fallback** — uses `developer` with a warning when no profile is selected in non-TTY
- **`src/profiles/` module system** — each profile is a standalone TypeScript module exporting `id`, `label`, `ruleFile`, `ruleContent()`, `extensions`, and optional `detect()`

### 🔧 Changed

- `setupCursor()` — refactored to async; delegates rule content to profile modules
- `setupVsCode()` — now builds a union of extensions from all active profiles
- `SetupLocalResult` — extended with `profiles: ProfileId[]`
- `messages/setup.local.md` — added 7 new message keys for profile prompts and defaults

### 📦 Dependencies

- Added `@inquirer/prompts` for checkbox and confirm interactive prompts

---

## [0.1.0] - 2026-01-15

### ✨ Added

- Initial release of `@jterrats/setup-agents`
- `sf setup local` command with `--rules` flag (`cursor` | `vscode` | `codex`)
- Auto-detection of tools via `.cursor/`, `.vscode/`, `.github/`, `AGENTS.md`
- Creates `agent-guidelines.mdc` for Cursor AI
- Creates `.github/copilot-instructions.md` for GitHub Copilot
- Creates `AGENTS.md` for OpenAI Codex CLI
- Safe by default — never overwrites existing files
- Returns `{ configured, cwd }` result for `--json` output

[Unreleased]: https://github.com/jterrats/setup-agents/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/jterrats/setup-agents/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/jterrats/setup-agents/releases/tag/v0.1.0
