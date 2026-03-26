# summary

Configure AI agent rules for the local development environment.

# description

Sets up agent rule files for AI coding assistants in the current project directory.

Supported tools:

- **cursor** — Creates `.cursor/rules/agent-guidelines.mdc` and per-profile rule files for Cursor AI.
- **vscode** — Creates `.github/copilot-instructions.md` and `.vscode/extensions.json` for GitHub Copilot.
- **codex** — Creates `AGENTS.md` for OpenAI Codex CLI.
- **agentforce** — Creates `.a4drules/` numbered markdown files for Agentforce Vibes Extension.

If `--rules` is omitted, the command auto-detects installed tools based on existing directories
(`.cursor`, `.vscode`, `AGENTS.md`, `.a4drules`). If none are detected, all tools are configured.

If `--profile` is omitted, the command auto-detects profiles from the project structure and
presents a selection prompt. If nothing is selected, the `developer` profile is used by default.

Use `--force` to overwrite existing files (useful when running `sf setup-agents update` under the hood).

# flags.rules.summary

Target AI tool to configure (cursor, vscode, codex, agentforce).

# flags.rules.description

Specify which AI coding assistant to configure. Valid options are `cursor`, `vscode`, `codex`, or `agentforce`.
When omitted, the command auto-detects tools present in the project; if none are found, all tools are configured.

# flags.profile.summary

Role profiles to configure (comma-separated).

# flags.profile.description

Specify one or more role profiles as a comma-separated list. Each profile generates a dedicated
rule file with role-specific agent guidance and adds the relevant VS Code extensions.

Valid profiles: developer, architect, ba, mulesoft, ux, cgcloud, devops, qa, crma, data360

When omitted, the command auto-detects profiles from the project structure and presents an
interactive multi-select prompt. If no profile is selected, `developer` is used as the default.

# flags.force.summary

Overwrite existing rule files.

# flags.force.description

Force overwrite of all generated files, even if they already exist.
Use this flag after updating your profiles or when the plugin version has changed.

# examples

- Configure all detected AI tools with interactive profile selection:

  <%= config.bin %> <%= command.id %>

- Configure only Cursor rules:

  <%= config.bin %> <%= command.id %> --rules cursor

- Configure only GitHub Copilot instructions for VS Code:

  <%= config.bin %> <%= command.id %> --rules vscode

- Configure only Codex (AGENTS.md):

  <%= config.bin %> <%= command.id %> --rules codex

- Configure Agentforce Vibes rules:

  <%= config.bin %> <%= command.id %> --rules agentforce

- Configure with a specific profile:

  <%= config.bin %> <%= command.id %> --profile developer

- Configure with multiple combined profiles:

  <%= config.bin %> <%= command.id %> --profile developer,architect,cgcloud

- Configure QA automation profile:

  <%= config.bin %> <%= command.id %> --profile qa

- Force overwrite all existing rule files:

  <%= config.bin %> <%= command.id %> --force

# info.configuring

Configuring %s...

# info.fileCreated

✔ Created: %s

# info.profileConfigured

✔ Profile configured: %s

# info.done

Setup complete. Configured: %s

# warn.noToolsDetected

No tools were detected and no --rules flag was provided. Nothing to configure.

# warn.fileExists

Skipped (already exists): %s

# warn.profileDefault

No profile selected. Using default: developer.

# prompt.selectProfiles

Select your role profile(s):

# prompt.confirmCGCloud

Consumer Goods Cloud (cgcloud\_\_) namespace detected. Add CGCloud profile?

# prompt.cursorRuleScope

This looks like a Salesforce project. Where should the Salesforce standards rule be applied?

# prompt.cursorRuleScopeProject

Project-level — create .cursor/rules/salesforce-standards.mdc (this project only)

# prompt.cursorRuleScopeUser

User-level — print content to copy into Cursor Settings → Rules for AI (all projects)

# info.cursorUserLevelInstructions

To apply this rule globally, open Cursor → Settings → Rules for AI and paste the following:

# info.sfExtensionsCreated

✔ Created: %s (Salesforce extension recommendations)

# warn.sfExtensionsExist

Skipped (already exists): %s
