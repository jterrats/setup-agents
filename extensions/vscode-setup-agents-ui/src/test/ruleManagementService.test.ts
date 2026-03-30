import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
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
