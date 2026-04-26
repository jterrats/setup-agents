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

export { generateBaseGuidelines, generateSfStandards, generateSubAgentProtocol } from './mdc-generator.js';
export { generateCopilotInstructions } from './copilot-generator.js';
export { generateAgentsMd } from './codex-generator.js';
export { generateClaudeMd } from './claude-generator.js';
export { generateExtensionsJson } from './extensions-generator.js';
export { generateA4dBaseGuidelines } from './agentforce-generator.js';
export { generateBaseWorkflows } from './workflow-generator.js';
export {
  generateDeveloperWorkflows,
  generateArchitectWorkflows,
  generateDevopsWorkflows,
  generateQaWorkflows,
  generateCrmaWorkflows,
  generatePmWorkflows,
  generateBaWorkflows,
  generateMulesoftWorkflows,
  generateUxWorkflows,
  generateCgcloudWorkflows,
  generateData360Workflows,
} from './workflows/index.js';
export { stripMdcFrontmatter, toA4dContent } from './shared.js';
export {
  generateStoryMappingSkill,
  generateDeploySkill,
  generateDiagramExportSkill,
  getPortableSkillSections,
  getSharedSkillAssets,
  STORY_MAP_PROFILES,
  DEPLOY_PROFILES,
} from './skill-generator.js';
export type { SkillSection } from './skill-generator.js';
