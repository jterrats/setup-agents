# summary

Configure Cursor MCP servers for Salesforce orgs.

# description

Sets up Cursor's Micro-Agent Collaboration Protocol (MCP) configuration for one or more
Salesforce orgs using `@salesforce/mcp`. This allows Cursor AI to interact directly with
your Salesforce org metadata, data, users, and testing tools via tool calls.

The command writes (or merges into) a `.cursor/mcp.json` file with an MCP server entry per
selected org. Use `--global` to write to the user-level `~/.cursor/mcp.json` instead.

Toolsets included by default (based on profile):

- **metadata** — SFDX metadata read/deploy tools.
- **data** — SOQL and org data inspection tools.
- **testing** — Apex and project testing tools.
- **users** — permission set and user management tools.

If `--target-org` is omitted, all authenticated orgs are listed for interactive selection.

# flags.target-org.summary

Salesforce org alias or username to configure.

# flags.target-org.description

Specify a single org alias or username. An MCP server entry will be added for this org.
Omit to select from all authenticated orgs interactively.

# flags.profile.summary

Role profile(s) used to determine MCP toolsets.

# flags.profile.description

Comma-separated list of role profiles. Each profile maps to a subset of MCP toolsets.
If omitted, all available MCP toolsets are enabled.

# flags.all-toolsets.summary

Enable all MCP toolsets regardless of profile.

# flags.all-toolsets.description

Force-enable all available MCP toolsets for every org configured.

# flags.global.summary

Write to the global ~/.cursor/mcp.json instead of the project-level .cursor/mcp.json.

# flags.global.description

When set, the MCP server entries are added to `~/.cursor/mcp.json`, making them available
across all Cursor projects on this machine.

# examples

- Configure MCP for all authenticated orgs (interactive):

  <%= config.bin %> <%= command.id %>

- Configure MCP for a specific org:

  <%= config.bin %> <%= command.id %> --target-org myOrgAlias

- Configure MCP globally (all projects):

  <%= config.bin %> <%= command.id %> --global --target-org myOrgAlias

- Configure MCP with toolsets for the developer profile:

  <%= config.bin %> <%= command.id %> --profile developer --target-org myOrgAlias

- Configure MCP with all toolsets:

  <%= config.bin %> <%= command.id %> --all-toolsets --target-org myOrgAlias

# info.serverAdded

✔ MCP server added: %s

# info.done

MCP configuration written to %s
Servers added: %s

# warn.noOrgs

No Salesforce orgs found or selected. Nothing to configure.

# warn.nonInteractive

Non-interactive session detected. Use --target-org to specify an org explicitly.

# warn.orgListFailed

Could not retrieve org list via `sf org list`. Ensure you have authenticated orgs.

# warn.corruptMcpJson

Could not parse existing MCP config at %s. Starting fresh.

# warn.npxNotFound

npx not found in PATH and could not be resolved to an absolute path. The MCP server entry will use "npx" as a fallback but may not start correctly. Install Node.js/npm and ensure npx is available in your PATH.

# prompt.selectOrgs

Select Salesforce org(s) to add as MCP servers:
