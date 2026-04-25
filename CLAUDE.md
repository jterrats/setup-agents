# CLAUDE.md — Project Guidelines

<!-- setup-agents: 1.1.0 -->

This file provides guidance to Claude Code when working with this project.

## General Principles

- Always read existing code before making changes.
- Prefer editing existing files over creating new ones.
- Follow the coding conventions already present in this project.
- Write concise, self-documenting code. Avoid unnecessary comments.

## Code Quality

- Ensure all new code is covered by tests.
- Do not introduce linter errors or suppress warnings.
- Handle errors explicitly; never swallow exceptions silently.

## Security

- Never hardcode credentials, tokens, or sensitive data.
- Use environment variables or secret managers for sensitive values.

---

# Salesforce Developer Standards

> Role: Salesforce Developer — Salesforce Servicios Profesionales.

## Consultative Design (CRITICAL)

- **No Ninja Edits.** Always summarize proposed changes and get explicit agreement before modifying any file.
- Provide pros/cons for non-trivial technical decisions before implementing.

## Code Generation

- Always read `sfdx-project.json` → `sourceApiVersion` before generating any Apex, LWC, or metadata.
- Infer naming patterns from the existing project. `JT_` is a framework prefix — preserve as-is.
- Test classes: `<ClassName>_Test`. Trigger handlers: `<ObjectName>TriggerHandler`.

## Apex Rules

- Default: `with sharing` on all Apex classes.
- Exception: Apex REST (`@RestResource`) classes → always `without sharing`.
- **No SOQL or DML inside loops.** Collect, then query/DML once outside.
- One trigger per object. Zero logic in triggers — delegate entirely to Kevin O'Hara Trigger Handler.
- Scan for existing custom exception class before writing `try-catch`. If none exists, propose one.

## Data Layer

- Propose **JT_DynamicQueries** first. Fallback: **DataSelector** (`inherited sharing`).
- If strategy is unclear, ask: _"¿Usamos JT_DynamicQueries o DataSelector?"_.
- Always bulkify: handle 1 to N records.

## LWC

- Prioritize **SLDS Styling Hooks** over custom CSS.
- Use **LDS 2** and **Lightning Data Service** whenever possible.
- User feedback: Toasts with **Custom Labels**. Never hardcode strings.
- **UX Gate (when generating LWC UI):** verify contrast (4.5:1), empty states, Cancel/Submit separation,
  loading spinners, touch targets (44x44), and Custom Label usage. See `ux-standards.mdc` for full checklist.

## Testing

- **Exactly one Assert per test method** using the modern `Assert` class.
- Use `@TestSetup` for shared test data.
- Use `System.runAs()` with Permission Set Group-based test users.
- Wrap async Apex in `Test.startTest()` / `Test.stopTest()`.
- Target **90% code coverage**.

## Async Apex

- No fixed pattern. When async need arises, discuss architecture with the developer.
- Evaluate `@future`, `Queueable`, `Batch`, and `Schedulable` based on governor limit context.

## Error Handling

- Scan for existing logging framework before writing `try-catch`.
- Never use `eslint-disable` or `@SuppressWarnings` as a first resort.
- Triggers: `addError()` with Custom Labels. LWC: Toast notifications.

## Flow Awareness

- Avoid Mega-Flows. Recommend Sub-flows for modularity.
- One Record-Triggered Flow per object/context (Before Save / After Save).
- Flow Orchestration: use ONLY for multi-step, multi-user, or long-running processes.

## Documentation Standards

- Every `/docs/*.md` must start with the Salesforce Cloud logo header:
  `![Salesforce Cloud](https://cdn.prod.website-files.com/691f4b0505409df23e191b87/69416b267de7ae6888996981_logo.svg)`
- Author: **Salesforce Servicios Profesionales**. Version: increment on significant changes.
- Always read existing docs before creating new ones — update rather than duplicate.

## Deployment

- Granular deploy: specific modified files/metadata ONLY.
- **Validate before deploying:** `sf project deploy validate -d force-app`.
- **Quick deploy only after successful validation:** `sf project deploy quick`.

## Semantic Commits

- Ask for **Backlog Item ID** before suggesting any commit.
- Format: `type(ID): short description`.
- Body: numbered list of changes + value proposition paragraph.

## Sub-agent Handover

- Pass to sub-agents: API version from `sfdx-project.json`, existing trigger handler pattern,
  data layer strategy (JT_DynamicQueries vs DataSelector), and test user PSG names.
- Sub-agents must follow: one Assert per test, zero logic in triggers.

## Interaction Preferences

- Concise, but detailed in architectural justifications.
- Correct mistakes directly without apologizing.
