/*
 * Copyright 2026, Jaime Terrats.
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

/**
 * Shared rule sections used across multiple profiles.
 * Each function returns an array of lines (no trailing empty string)
 * that can be spread into a profile's ruleContent() array.
 */

const SF_LOGO_URL = 'https://cdn.prod.website-files.com/691f4b0505409df23e191b87/69416b267de7ae6888996981_logo.svg';

export function documentationStandards(): string[] {
  return [
    '## Documentation Standards',
    '- Every `/docs/*.md` must start with the Salesforce Cloud logo header:',
    `  \`![Salesforce Cloud](${SF_LOGO_URL})\``,
    '- Author: **Salesforce Professional Services**. Version: increment on significant changes.',
    '- Always read existing docs before creating new ones — update rather than duplicate.',
  ];
}

export function semanticCommits(): string[] {
  return [
    '## Semantic Commits',
    '- Ask for **Backlog Item ID** before suggesting any commit.',
    '- Format: `type(ID): short description`.',
    '- Body: numbered list of changes + value proposition paragraph.',
  ];
}

export function interactionPreferences(justificationDomain = 'architectural'): string[] {
  return [
    '## Interaction Preferences',
    `- Concise, but detailed in ${justificationDomain} justifications.`,
    '- Correct mistakes directly without apologizing.',
  ];
}

export function consultativeDesign(prosConsTopic = 'non-trivial technical decisions'): string[] {
  return [
    '## Consultative Design (CRITICAL)',
    '- **No Ninja Edits.** Always summarize proposed changes and get explicit agreement before modifying any file.',
    `- Provide pros/cons for ${prosConsTopic} before implementing.`,
  ];
}

export function salesforceReferences(): string[] {
  return [
    '## Salesforce Reference Documentation',
    'Prefer these official sources when researching platform behavior, APIs, or standards:',
    '',
    '### Core Platform',
    '- **Data Models:** https://developer.salesforce.com/docs/platform/data-models',
    '- **Apex Developer Guide:** https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_dev_guide.htm',
    '- **APIs:** https://developer.salesforce.com/docs/apis',
    '- **Metadata Coverage:** https://developer.salesforce.com/docs/metadata-coverage',
    '- **Salesforce Architect:** https://architect.salesforce.com/',
    '',
    '### Lightning & LWC',
    '- **LWC Developer Center:** https://developer.salesforce.com/developer-centers/lightning-web-components',
    '- **Lightning Types Guide:** https://developer.salesforce.com/docs/platform/lightning-types/guide',
    '- **LWC for Mobile:** https://developer.salesforce.com/developer-centers/lwc-for-mobile',
    '- **Mobile Developer Center:** https://developer.salesforce.com/developer-centers/mobile',
    '- **Service SDK:** https://developer.salesforce.com/developer-centers/service-sdk',
    '',
    '### Design',
    '- **SLDS 2:** https://www.lightningdesignsystem.com/2e1ef8501/p/85bd85-lightning-design-system-2',
    '',
    '### Updates & Blogs',
    '- **Salesforce Developer Blog:** https://developer.salesforce.com/blogs',
  ];
}

export function deployment(): string[] {
  return [
    '## Deployment',
    '- Granular deploy: specific modified files/metadata ONLY.',
    '- **Validate before deploying:** `sf project deploy validate -d force-app`.',
    '- **Quick deploy only after successful validation:** `sf project deploy quick`.',
  ];
}
