import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { RuleManagementService } from '../services/ruleManagementService';

test('listRules includes generated and custom markdown files', async () => {
  const tempRoot = join(process.cwd(), '.tmp-tests');
  await mkdir(tempRoot, { recursive: true });
  const workspace = await mkdtemp(join(tempRoot, 'setup-agents-ui-'));
  await mkdir(join(workspace, '.cursor', 'rules', 'custom'), { recursive: true });
  await writeFile(join(workspace, '.cursor', 'rules', 'developer-standards.mdc'), 'generated', 'utf8');
  await writeFile(join(workspace, '.cursor', 'rules', 'custom', 'team-rule.mdc'), 'custom', 'utf8');

  const service = new RuleManagementService();
  const rules = await service.listRules(workspace);

  assert.equal(rules.length, 2);
  assert.equal(
    rules.some((rule) => rule.relativePath === '.cursor/rules/developer-standards.mdc' && rule.scope === 'generated'),
    true
  );
  assert.equal(
    rules.some((rule) => rule.relativePath === '.cursor/rules/custom/team-rule.mdc' && rule.scope === 'custom'),
    true
  );
});

test('saveRule writes updated markdown content', async () => {
  const tempRoot = join(process.cwd(), '.tmp-tests');
  await mkdir(tempRoot, { recursive: true });
  const workspace = await mkdtemp(join(tempRoot, 'setup-agents-ui-'));
  const target = join(workspace, '.cursor', 'rules', 'custom', 'editable.mdc');
  await mkdir(join(workspace, '.cursor', 'rules', 'custom'), { recursive: true });
  await writeFile(target, 'initial', 'utf8');

  const service = new RuleManagementService();
  await service.saveRule(target, 'updated');
  const content = await service.readRule(target);

  assert.equal(content, 'updated');
});

test('importRuleFromFile copies a markdown file to the custom directory', async () => {
  const tempRoot = join(process.cwd(), '.tmp-tests');
  await mkdir(tempRoot, { recursive: true });
  const workspace = await mkdtemp(join(tempRoot, 'setup-agents-ui-'));

  const sourceDir = join(workspace, 'source');
  await mkdir(sourceDir, { recursive: true });
  const sourcePath = join(sourceDir, 'team-conventions.md');
  await writeFile(sourcePath, '# Team Conventions\n- Rule 1', 'utf8');

  const service = new RuleManagementService();
  const resultPath = await service.importRuleFromFile(workspace, sourcePath, 'cursor');

  assert.equal(resultPath, join(workspace, '.cursor', 'rules', 'custom', 'team-conventions.md'));
  const imported = await readFile(resultPath, 'utf8');
  assert.equal(imported, '# Team Conventions\n- Rule 1');
});

test('importRuleFromFile rejects non-markdown extensions', async () => {
  const tempRoot = join(process.cwd(), '.tmp-tests');
  await mkdir(tempRoot, { recursive: true });
  const workspace = await mkdtemp(join(tempRoot, 'setup-agents-ui-'));

  const sourceDir = join(workspace, 'source');
  await mkdir(sourceDir, { recursive: true });
  const sourcePath = join(sourceDir, 'script.js');
  await writeFile(sourcePath, 'console.log("not a rule")', 'utf8');

  const service = new RuleManagementService();

  await assert.rejects(
    () => service.importRuleFromFile(workspace, sourcePath, 'cursor'),
    { message: 'Only Markdown rule files (.md, .mdc) are supported.' }
  );
});

test('saveRule rejects non-markdown extensions', async () => {
  const service = new RuleManagementService();

  await assert.rejects(
    () => service.saveRule('/tmp/fake.txt', 'content'),
    { message: 'Only Markdown rule files (.md, .mdc) are supported.' }
  );
});
