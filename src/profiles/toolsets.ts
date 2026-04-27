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

import type { ProfileId } from './types.js';

/**
 * Maps each profile to the Salesforce MCP toolsets it needs.
 * Single source of truth — consumed by the CLI command and the VS Code extension.
 */
export const PROFILE_TOOLSETS: Record<ProfileId, string[]> = {
  developer: ['metadata', 'data', 'testing', 'users'],
  architect: ['metadata', 'data', 'testing', 'users'],
  ba: ['metadata', 'data'],
  pm: ['metadata', 'data'],
  mulesoft: ['metadata', 'orgs'],
  ux: ['metadata', 'data'],
  cgcloud: ['metadata', 'data', 'testing', 'users'],
  devops: ['metadata', 'orgs', 'users'],
  qa: ['metadata', 'data', 'testing', 'users'],
  crma: ['metadata', 'data'],
  commerce: ['metadata', 'data'],
  data360: ['metadata', 'data'],
  admin: ['metadata', 'data', 'users'],
  sfmc: ['metadata', 'data'],
  security: ['metadata', 'data', 'testing', 'users'],
  service: ['metadata', 'data', 'users'],
  cpq: ['metadata', 'data'],
  omnistudio: ['metadata', 'data'],
  fsl: ['metadata', 'data', 'users'],
};
