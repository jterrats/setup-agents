# Setup Agents UI (VS Code Extension)

UI companion for `sf setup-agents` to configure profiles and manage rule files without leaving VS Code.

## Features

- Guided execution of `sf setup-agents local`.
- Visual profile picker with profile descriptions and mapped rule files.
- Tool detection (`.cursor`, `.vscode`, `AGENTS.md`, `.a4drules`).
- Rule management panel:
  - Import Markdown rules from URL.
  - Import Markdown rules from local file.
  - Read and edit generated and custom rules.
  - Save rule changes from the UI.

## Command Palette

- `Setup Agents: Open UI`
- `Setup Agents: Import Rules From URL`
- `Setup Agents: Import Rules From File`

## Development

```bash
cd extensions/vscode-setup-agents-ui
npm install
npm run build
npm test
```

## Packaging

Use `vsce` to package/publish:

```bash
npm install -g @vscode/vsce
cd extensions/vscode-setup-agents-ui
vsce package
```
