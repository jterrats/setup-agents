# Sub-agent Protocol

`setup-agents` generates a `.cursor/rules/sub-agent-protocol.mdc` file whenever Cursor is configured. This file is the **orchestration manifest** — it tells every AI agent in the project which role handles which type of work and what context must be passed during handover.

---

## Why it exists

When a project has multiple active profiles (e.g., Developer + CRMA + Data Cloud), sub-agents spawned by the parent agent need to know:

1. **Which role they are acting under** — so they apply the right rule file
2. **What task types belong to each role** — so work is routed correctly
3. **What context to receive** — so they don't make assumptions about agreed decisions

Without this file, every agent receives the same `alwaysApply: true` context but has no guidance on role boundaries.

---

## What the file contains

### Active Profiles

A table of all roles configured for the project and their corresponding rule files:

```markdown
## Active Profiles

| Role                          | Rule File                  |
|-------------------------------|----------------------------|
| Developer                     | developer-standards.mdc    |
| Analytics Engineer (CRMA)     | analytics-standards.mdc    |
| Data Cloud Engineer           | data360-standards.mdc      |
```

### Task-to-Profile Routing

A routing table mapping task categories to the responsible role:

```markdown
## Task-to-Profile Routing

| Task Type                                    | Assigned Role          | Rule File               |
|----------------------------------------------|------------------------|-------------------------|
| Apex / LWC / Triggers / SOQL                 | Developer              | developer-standards.mdc |
| Recipes / Dataflows / SAQL / Dashboards      | Analytics Engineer     | analytics-standards.mdc |
| Data Streams / DMOs / Identity Resolution    | Data Cloud Engineer    | data360-standards.mdc   |
```

### Handover Checklist

Per-profile context requirements extracted from each profile's "Sub-agent Handover" section.

### Conflict Resolution Rules

Priority order when a task could fall under multiple profiles:

```
Architect > Domain profile (cgcloud, crma, data360) > Developer > QA
```

---

## How agents should use it

When a parent agent needs to spawn a sub-agent:

1. **Identify the task type** — match it against the routing table
2. **Declare the role** — state explicitly which profile applies
3. **Pass the checklist** — include all items from that profile's handover section
4. **Include base context** — `sourceApiVersion` from `sfdx-project.json`, agreed architectural decisions

### Example handover prompt

```
You are acting as the Analytics Engineer on this project (analytics-standards.mdc).

Context:
- sourceApiVersion: 62.0 (from sfdx-project.json)
- Active profiles: developer, crma, data360
- Agreed patterns: JT_DynamicQueries for data layer, Kevin O'Hara trigger handler

Your task: Build the SalesPerformance recipe that loads from the SF_Opportunities dataset.

Handover context:
- Dataset lineage: SF_Opportunities → SalesPerf_DLO → SalesPerformance recipe
- Security predicate: filter by Territory__c = $User.Territory__c
- Schedule: daily at 02:00 UTC (aligned with CRM sync)
```

---

## Updating the protocol

The `sub-agent-protocol.mdc` is generated once and **never overwritten** by subsequent runs (like all files created by `setup-agents`). If you add new profiles later:

```sh
# Delete and regenerate
rm .cursor/rules/sub-agent-protocol.mdc
sf setup local --rules cursor --profile developer,architect,crma,data360
```

---

## Conflict resolution in practice

| Scenario | Resolution |
|----------|-----------|
| Architecture decision needed mid-sprint | Escalate to **Architect** |
| CGCloud Modeler vs Apex for a business rule | **CGCloud** profile takes precedence |
| Analytics dashboard uses Apex for data | **CRMA** for dashboard, **Developer** for Apex class |
| QA finds a bug during Playwright test | **QA** raises it; **Developer** fixes |
| Deployment pipeline change | **DevOps** owns it regardless of trigger |
