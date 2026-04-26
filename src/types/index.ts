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

import type { ProfileId } from '../profiles/index.js';

export type SupportedTool = 'cursor' | 'vscode' | 'codex' | 'claude' | 'agentforce';

export type SetupLocalResult = {
  configured: string[];
  profiles: ProfileId[];
  cwd: string;
};

/**
 * Lightweight Result type. Provides explicit success/failure handling
 * without exceptions. Mirrors the pattern in core/monad/result.ts (profiler).
 */
export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export const SUPPORTED_TOOLS: SupportedTool[] = ['cursor', 'vscode', 'codex', 'claude', 'agentforce'];
