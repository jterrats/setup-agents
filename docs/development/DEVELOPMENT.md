# Development Guide

Everything you need to contribute to `@jterrats/plugin-setup-agents`.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| Salesforce CLI (`sf`) | v2+ |
| npm | ≥ 9 |

---

## Setup

```sh
# Clone
git clone https://github.com/jterrats/plugin-setup-agents.git
cd plugin-setup-agents

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Link as a local SF plugin
sf plugins link .
```

---

## Project Structure

```
plugin-setup-agents/
├── src/
│   ├── commands/
│   │   └── setup/
│   │       └── local.ts          ← Main command
│   └── profiles/
│       ├── types.ts              ← Profile and ProfileId types
│       ├── index.ts              ← ALL_PROFILES array + re-exports
│       ├── developer.ts
│       ├── architect.ts
│       ├── ba.ts
│       ├── mulesoft.ts
│       ├── ux.ts
│       ├── cgcloud.ts
│       ├── devops.ts
│       ├── qa.ts
│       ├── crma.ts
│       └── data360.ts
├── messages/
│   └── setup.local.md            ← Oclif i18n messages
├── test/
│   └── commands/setup/
│       └── local.test.ts         ← Unit tests
├── docs/                         ← This documentation
└── command-snapshot.json         ← Oclif deprecation policy snapshot
```

---

## Adding a New Profile

1. **Create `src/profiles/<name>.ts`** exporting a `Profile` object:

```typescript
import type { Profile } from './types.js';

export const myProfile: Profile = {
  id: 'myprofile',        // must be added to ProfileId union in types.ts
  label: 'My Profile',
  ruleFile: 'myprofile-standards.mdc',
  extensions: ['publisher.extension-id'],
  detect(cwd: string): boolean {
    // optional: return true if this profile should be pre-selected
    return false;
  },
  ruleContent(): string {
    return [
      '---',
      'description: My Profile Standards',
      'globs:',
      'alwaysApply: true',
      '---',
      '',
      '# My Profile Standards',
      // ...rule content...
      '',
      '## Sub-agent Handover',
      '- Pass to sub-agents: ...',
    ].join('\n');
  },
};
```

2. **Add the new `ProfileId`** to the union in `src/profiles/types.ts`

3. **Export from `src/profiles/index.ts`** — add both the named export and the entry to `ALL_PROFILES`

4. **Update `command-snapshot.json`** if the flag shape changes (it won't for a new profile)

5. **Add tests** in `test/commands/setup/local.test.ts`

---

## Running Tests

```sh
# Unit tests only
npm run test:only

# Full suite (lint + compile + unit + deprecation + schema checks)
npm test

# Typecheck without emitting
npx tsc -p . --noEmit
```

Tests run against isolated `tmp/` directories — each test creates a fresh temp dir, `chdir`s into it, and cleans up in `afterEach`.

---

## Messages (i18n)

All user-facing strings live in `messages/setup.local.md` using the oclif message format. Add new keys at the bottom:

```markdown
# my.new.key

The message text here. Use %s for interpolated values.
```

Reference in code:

```typescript
messages.getMessage('my.new.key', [value]);
```

---

## Linting

```sh
npm run lint
```

ESLint is configured via `@salesforce/dev-scripts`. The `no-await-in-loop` rule is disabled only for the sequential tool loop in `run()` — do not add new suppressions without justification.

---

## Publishing

```sh
# Bump version (patch / minor / major)
npm version patch

# Publish to npm
npm publish --access public
```

The oclif manifest (`oclif.manifest.json`) is generated automatically by `prepack`.

---

## Commit Convention

Format: `type(ID): short description`

```sh
feat(SA-42): add crma and data360 profiles
fix(SA-55): handle non-TTY default profile fallback
docs(SA-60): add sub-agent-protocol documentation
```

**Ask for a Backlog Item ID before committing.** See `CHANGELOG.md` for version history.
