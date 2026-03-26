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

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

/** Creates a directory (and all parents) if it does not already exist. */
export function ensureDir(dirPath: string): void {
  if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true });
}

export type WriteResult = 'written' | 'skipped';

export type FileWriterOptions = {
  force: boolean;
  /** Called with the file path after a successful write. */
  log: (filePath: string) => void;
  /** Called with the file path when a write is skipped. */
  warn: (filePath: string) => void;
};

/**
 * Thin wrapper around node:fs write operations.
 * Centralises the force/skip decision so every setup module
 * shares the same behaviour without duplicating the guard.
 */
export class FileWriter {
  private readonly force: boolean;
  private readonly log: (filePath: string) => void;
  private readonly warn: (filePath: string) => void;

  public constructor(opts: FileWriterOptions) {
    this.force = opts.force;
    this.log = opts.log;
    this.warn = opts.warn;
  }

  /**
   * Writes `content` to `filePath`.
   * Skips the write (and calls `warn`) when the file already exists and
   * `force` is false. Returns whether the file was actually written.
   */
  public write(filePath: string, content: string): WriteResult {
    if (existsSync(filePath) && !this.force) {
      this.warn(filePath);
      return 'skipped';
    }
    writeFileSync(filePath, content, 'utf8');
    this.log(filePath);
    return 'written';
  }
}
