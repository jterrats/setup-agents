# Setup Agents UI

> **Disclaimer:** This is a personal open-source project by [Jaime Terrats](https://github.com/jterrats). It is **not** an official Salesforce product and is not supported, endorsed, or affiliated with Salesforce, Inc.

Configure AI coding assistants for Salesforce projects — profiles, rules, MCP integrations, and guided setup, all from the VS Code sidebar.

![Extension Demo](https://raw.githubusercontent.com/jterrats/setup-agents/main/docs/assets/extension-guided-setup.gif)

## Features

- **Role-Based Profiles** — Select from 11 Salesforce profiles (Developer, Architect, QA, DevOps, BA, PM, UX, CRMA, Data360, CG Cloud, MuleSoft) to generate tailored AI rules.
- **Multi-Tool Support** — Generate rules for Cursor (`.mdc`), GitHub Copilot (`.github/copilot-instructions.md`), Windsurf, and Claude Code (`CLAUDE.md`).
- **Scope Selector** — Choose between project-level and global rule generation.
- **MCP Integrations** — One-click configuration for Figma, Jira, Draw.io, and GitHub MCP servers.
- **Salesforce Org Connection** — Connect authenticated orgs directly from the sidebar.
- **SF CLI Health Check** — Detects missing Salesforce CLI and guides installation.
- **Rule Management** — View, delete, and import rules from URLs or local files.

## Prerequisites

| Dependency | Required |
|------------|----------|
| [VS Code](https://code.visualstudio.com/) | >= 1.90.0 |
| [Salesforce CLI (`sf`)](https://developer.salesforce.com/tools/salesforcecli) | Latest |
| [setup-agents plugin](https://github.com/jterrats/setup-agents) | `sf plugins install @jterrats/setup-agents` |

## Getting Started

1. Install the extension from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=jterrats.setup-agents-ui) or via `.vsix`.
2. Open the **Setup Agents** sidebar (cube icon in the activity bar).
3. Select your role profile and target tools.
4. Click **Apply Selected Rules** to generate configuration files.
5. Optionally configure MCP integrations and connect Salesforce orgs.

## SF CLI Not Installed?

If the Salesforce CLI is not detected, the extension displays an error banner with installation instructions and a retry button.

![SF CLI Missing](https://raw.githubusercontent.com/jterrats/setup-agents/main/docs/assets/extension-sf-cli-missing.gif)

## Commands

| Command | Description |
|---------|-------------|
| `Setup Agents: Open UI` | Open the sidebar panel |
| `Setup Agents: Import Rules From URL` | Import rules from a remote URL |
| `Setup Agents: Import Rules From File` | Import rules from a local file |

## Links

- [Documentation](https://jterrats.github.io/setup-agents/extension.html)
- [CLI Plugin](https://github.com/jterrats/setup-agents)
- [Issues](https://github.com/jterrats/setup-agents/issues)

## License

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)
