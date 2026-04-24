import * as assert from 'node:assert/strict';
import * as vscode from 'vscode';

suite('Extension Activation', () => {
  const EXTENSION_ID = 'jterrats.setup-agents-ui';

  test('extension is present', () => {
    const ext = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(ext, `Extension ${EXTENSION_ID} should be installed`);
  });

  test('extension activates successfully', async () => {
    const ext = vscode.extensions.getExtension(EXTENSION_ID)!;
    await ext.activate();
    assert.ok(ext.isActive, 'Extension should be active');
  });

  test('registereds command: setupAgentsUi.open', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('setupAgentsUi.open'), 'setupAgentsUi.open should be registered');
  });

  test('registers command: setupAgentsUi.importRulesFromUrl', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('setupAgentsUi.importRulesFromUrl'),
      'setupAgentsUi.importRulesFromUrl should be registered'
    );
  });

  test('registers command: setupAgentsUi.importRulesFromFile', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('setupAgentsUi.importRulesFromFile'),
      'setupAgentsUi.importRulesFromFile should be registered'
    );
  });
});
