import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { basename, extname, join, relative } from 'node:path';
import { CUSTOM_RULE_DIRS, GENERATED_RULE_DIRS } from '../constants';
import type { RuleSummary, ToolId } from '../types';

export class RuleManagementService {
  public async listRules(workspacePath: string): Promise<RuleSummary[]> {
    const rules: RuleSummary[] = [];

    for (const dir of GENERATED_RULE_DIRS) {
      const absoluteDir = join(workspacePath, dir);
      for (const path of await this.collectMarkdownFiles(absoluteDir, true)) {
        rules.push({
          path,
          relativePath: relative(workspacePath, path),
          scope: 'generated',
        });
      }
    }

    for (const dir of CUSTOM_RULE_DIRS) {
      const absoluteDir = join(workspacePath, dir);
      for (const path of await this.collectMarkdownFiles(absoluteDir)) {
        rules.push({
          path,
          relativePath: relative(workspacePath, path),
          scope: 'custom',
        });
      }
    }

    return rules.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  }

  public async importRuleFromUrl(workspacePath: string, url: string, tool: ToolId): Promise<string> {
    this.assertMarkdownPath(url);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Unable to fetch rule from URL. HTTP status: ${response.status}`);
    }

    const content = await response.text();
    const targetDir = await this.ensureCustomDir(workspacePath, tool);
    const targetFile = join(targetDir, basename(url));

    await writeFile(targetFile, content, 'utf8');
    return targetFile;
  }

  public async importRuleFromFile(workspacePath: string, sourcePath: string, tool: ToolId): Promise<string> {
    this.assertMarkdownPath(sourcePath);
    const fileStats = await stat(sourcePath);
    if (!fileStats.isFile()) throw new Error('Selected source path is not a file.');

    const content = await readFile(sourcePath, 'utf8');
    const targetDir = await this.ensureCustomDir(workspacePath, tool);
    const targetFile = join(targetDir, basename(sourcePath));
    await writeFile(targetFile, content, 'utf8');
    return targetFile;
  }

  public async readRule(rulePath: string): Promise<string> {
    return readFile(rulePath, 'utf8');
  }

  public async saveRule(rulePath: string, content: string): Promise<void> {
    this.assertMarkdownPath(rulePath);
    await writeFile(rulePath, content, 'utf8');
  }

  private assertMarkdownPath(path: string): void {
    const extension = extname(path).toLowerCase();
    if (extension !== '.md' && extension !== '.mdc') {
      throw new Error('Only Markdown rule files (.md, .mdc) are supported.');
    }
  }

  private async ensureCustomDir(workspacePath: string, tool: ToolId): Promise<string> {
    const baseDir = tool === 'agentforce' ? '.a4drules/custom' : '.cursor/rules/custom';
    const absoluteDir = join(workspacePath, baseDir);
    await mkdir(absoluteDir, { recursive: true });
    return absoluteDir;
  }

  private async collectMarkdownFiles(directory: string, skipCustomDirectories = false): Promise<string[]> {
    try {
      const items = await readdir(directory, { withFileTypes: true });
      const files = await Promise.all(
        items.map(async (item) => {
          const fullPath = join(directory, item.name);
          if (item.isDirectory()) {
            if (skipCustomDirectories && item.name === 'custom') return [];
            return this.collectMarkdownFiles(fullPath, skipCustomDirectories);
          }
          if (item.isFile() && ['.md', '.mdc'].includes(extname(item.name).toLowerCase())) return [fullPath];
          return [];
        })
      );
      return files.flat();
    } catch {
      return [];
    }
  }
}
