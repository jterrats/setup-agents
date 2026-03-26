/*
 * Copyright 2026, Salesforce, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { generateDevopsWorkflows } from '../generators/workflow-generator.js';
import type { Profile } from './types.js';

export const devopsProfile: Profile = {
  id: 'devops',
  label: 'DevOps / Release Manager',
  ruleFile: 'devops-standards.mdc',
  extensions: [
    'github.vscode-github-actions',
    'ms-azure-devops.azure-pipelines',
    'ms-azuretools.vscode-docker',
    'redhat.vscode-yaml',
  ],
  detect(cwd: string): boolean {
    return (
      existsSync(join(cwd, '.github', 'workflows')) ||
      existsSync(join(cwd, 'azure-pipelines.yml')) ||
      existsSync(join(cwd, 'Dockerfile'))
    );
  },
  workflows: generateDevopsWorkflows,
  ruleContent(): string {
    return [
      '---',
      'description: DevOps / Release Manager Standards',
      'globs:',
      'alwaysApply: true',
      '---',
      '',
      '# DevOps / Release Manager Standards',
      '',
      '> Role: DevOps / Release Manager — Salesforce Servicios Profesionales.',
      '',
      '## Deployment Policy (CRITICAL)',
      '- **Always validate before deploying:** `sf project deploy validate -d force-app`',
      '- **Quick deploy only after successful validation:** `sf project deploy quick`',
      '- Granular deploy priority: specific modified files/metadata only. Full deploy is the exception.',
      '- Never deploy directly to production without a sandbox validation gate.',
      '',
      '## Pipeline Stages',
      '- Every pipeline must include: Lint → Test → Validate → Deploy → Smoke Test.',
      '- Test stage must run Apex tests and assert 90% coverage before proceeding.',
      '- Use `--test-level RunLocalTests` for sandbox, `RunAllTestsInOrg` for production.',
      '',
      '## Environment Strategy',
      '- Maintain separate configs per environment via External Properties / Named Credentials.',
      '- Never hardcode org IDs, endpoints, or credentials in pipeline YAML.',
      '- Use GitHub Secrets or Azure Key Vault for all sensitive pipeline values.',
      '',
      '## Scratch Org Lifecycle',
      '- Scratch org definitions must be version-controlled in `config/`.',
      '- Always specify `durationDays` — maximum 30 for developer orgs.',
      '- Include permission set assignments in the scratch org creation script.',
      '',
      '## Rollback Strategy',
      '- Document a rollback plan before every production deployment.',
      '- For data migrations: always create a backup before transforming records.',
      '- Destructive changes (`destructiveChanges.xml`) require explicit approval before deployment.',
      '',
      '## Package Management',
      '- Prefer **Unlocked Packages** for modular deployments.',
      '- Always pin package versions in `sfdx-project.json`. Never use `LATEST`.',
      '- Validate package dependencies before installation in any org.',
      '',
      '## Branching & Commits',
      '- Read `git log` to infer the branch naming convention. If unclear, ask the developer.',
      '- Require **Backlog Item ID** in every commit message: `type(ID): short description`.',
      '- Protect `main` / `master` branches: require PR + 1 approval + passing CI.',
      '',
      '## Sub-agent Handover',
      '- Pass to sub-agents: target org type, pipeline stage context, environment name,',
      '  and whether this is a validate-only or full deploy.',
    ].join('\n');
  },
};
