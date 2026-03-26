# Quick Start

Get `setup-agents` running in your Salesforce project in under 2 minutes.

---

## 1. Install the plugin

```sh
sf plugins install @jterrats/plugin-setup-agents
```

> **⚠️ Unsigned Plugin Notice:** You will be prompted to trust the plugin on first install.
> To skip the prompt: `sf plugins install @jterrats/plugin-setup-agents --no-verify`

---

## 2. Navigate to your project

```sh
cd my-salesforce-project
```

---

## 3. Run the command

```sh
sf setup local
```

The command will:

1. **Detect your tools** — checks for `.cursor/`, `.vscode/`, `.github/`, or `AGENTS.md`
2. **Auto-detect profiles** — scans `package.xml` and config files for known signals
3. **Prompt for role selection** — multi-select checkbox (pre-selects detected profiles)
4. **Write rule files** — one `.mdc` per profile + `sub-agent-protocol.mdc`

---

## What gets created

For a Salesforce project with Cursor + Developer + CGCloud profiles:

```
.cursor/
  rules/
    agent-guidelines.mdc         ← always
    sub-agent-protocol.mdc       ← always (when Cursor is configured)
    salesforce-standards.mdc     ← Salesforce projects
    developer-standards.mdc      ← developer profile
    cgcloud-standards.mdc        ← cgcloud profile
.github/
  copilot-instructions.md        ← GitHub Copilot
.vscode/
  extensions.json                ← Salesforce + profile extensions
AGENTS.md                        ← OpenAI Codex CLI
```

---

## Common usage patterns

```sh
# Auto-detect everything (recommended for first run)
sf setup local

# Non-interactive: specific tool + profiles
sf setup local --rules cursor --profile developer,architect

# CGCloud project
sf setup local --profile developer,cgcloud

# Analytics team
sf setup local --profile developer,crma,data360

# Full-stack team
sf setup local --profile developer,architect,ux,qa

# QA automation only
sf setup local --rules cursor --profile qa
```

---

## Re-running the command

Existing files are **never overwritten**. If you want to update a rule file, delete it first and re-run:

```sh
rm .cursor/rules/developer-standards.mdc
sf setup local --rules cursor --profile developer
```

---

## Next steps

- [Profiles →](profiles.md) — understand what each profile configures
- [Sub-agent Protocol →](sub-agent-protocol.md) — how agents hand off context to sub-agents
