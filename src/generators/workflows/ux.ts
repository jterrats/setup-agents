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

import { workflow } from '../workflow-generator.js';

export function generateUxWorkflows(version: string): Record<string, string> {
  return {
    'ux-audit.md': workflow(
      version,
      'UX Audit — LWC Interaction Checklist',
      `
## 1. Identify the Component

Ask: Which LWC component should be audited?

Read the component's HTML, JS, and CSS files.

## 2. Run the LWC Interaction Checklist

Evaluate every item and report pass/fail:

1. **Click efficiency** — Does this require too many clicks? If yes, suggest a shortcut.
2. **Cancel vs Submit separation** — Is Cancel clearly separated from Submit (different variant, adequate spacing)?
3. **Empty state** — Is there a clear empty state if no data is present (message + CTA)?
4. **Accessibility** — Contrast ratio (4.5:1), alt-text, aria-labels, keyboard navigation, screen-reader friendly.
5. **Custom Labels** — Are all user-facing strings sourced from Custom Labels?
6. **Feedback loops** — Are loading/success/error feedback loops defined (spinner + toast)?

## 3. Cognitive UX Laws Check

- **Jakob's Law** — Does it follow familiar Salesforce patterns?
- **Hick's Law** — Are there more than 7 choices presented at once? If so, recommend grouping.
- **Fitts's Law** — Are primary actions large enough and in predictable locations?

## 4. Produce Report

Create a findings document with:
- Component name and purpose
- Checklist results (pass/fail per item)
- Cognitive law compliance
- Recommended fixes with priority (Critical / High / Medium / Low)
`
    ),
    'design-review.md': workflow(
      version,
      'Design Review',
      `
## 1. Gather Context

Ask:
- Which feature or LWC is under review?
- Is there a mockup or wireframe? (file path or description)

Read the component files if they already exist.

## 2. Evaluate Against Standards

### SLDS Compliance
- Are SLDS components used instead of custom HTML?
- Are Styling Hooks used instead of custom CSS overrides?
- Are design tokens used for colors, spacing, and typography?

### WCAG 2.1 AA Compliance
- Text contrast ratios meet 4.5:1 (normal) / 3:1 (large)?
- All interactive elements have accessible labels?
- Keyboard navigation works for all interactions?

### Responsive Design
- Tested at 320px, 768px, and 1280px breakpoints?
- SLDS grid used for layout?

## 3. Produce Review Document

Output to \`/docs/ux-reviews/<component-name>-review.md\`:
- Summary of findings
- SLDS compliance: pass/fail
- Accessibility: pass/fail with specific issues
- Responsive: pass/fail
- Recommendations with severity
- Sign-off: Ready for development / Needs revision
`
    ),
  };
}
