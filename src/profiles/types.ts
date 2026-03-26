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

export type ProfileId =
  | 'developer'
  | 'architect'
  | 'ba'
  | 'mulesoft'
  | 'ux'
  | 'cgcloud'
  | 'devops'
  | 'qa'
  | 'crma'
  | 'data360';

export type Profile = {
  id: ProfileId;
  label: string;
  ruleFile: string;
  extensions: string[];
  ruleContent(): string;
  /** Profile-specific Agentforce Vibes workflows. Returns filename → markdown content. */
  workflows?(version: string): Record<string, string>;
  detect?(cwd: string): boolean;
};
