# Quick Start

Get `setup-agents` running in your Salesforce project in under 2 minutes.

---

## 1. Install the plugin

```sh
sf plugins install @jterrats/setup-agents
```

> **⚠️ Unsigned Plugin Notice:** You will be prompted to trust the plugin on first install.
> To skip the prompt: `sf plugins install @jterrats/setup-agents --no-verify`

---

## 2. Navigate to your project

```sh
cd my-salesforce-project
```

---

## 3. Run the command

```sh
sf setup-agents local
```

The command will:

1. **Detect your tools** — checks for `.cursor/`, `.vscode/`, `AGENTS.md`, `CLAUDE.md`, or `.a4drules/`
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
CLAUDE.md                        ← Anthropic Claude Code
.a4drules/
  00-base-guidelines.md          ← Agentforce Vibes
  workflows/*.md                 ← Agentforce workflow files
```

---

## Common usage patterns

```sh
# Auto-detect everything (recommended for first run)
sf setup-agents local

# Non-interactive: specific tool + profiles
sf setup-agents local --rules cursor --profile developer,architect

# Claude Code with developer profile
sf setup-agents local --rules claude --profile developer

# CGCloud project
sf setup-agents local --profile developer,cgcloud

# Analytics team
sf setup-agents local --profile developer,crma,data360

# Full-stack team
sf setup-agents local --profile developer,architect,ux,qa

# QA automation only
sf setup-agents local --rules cursor --profile qa
```

---

## Re-running the command

Existing files are **never overwritten**. If you want to update a rule file, delete it first and re-run:

```sh
rm .cursor/rules/developer-standards.mdc
sf setup-agents local --rules cursor --profile developer
```

---

## Next steps

- [Profiles →](profiles.md) — understand what each profile configures
- [Sub-agent Protocol →](sub-agent-protocol.md) — how agents hand off context to sub-agents
