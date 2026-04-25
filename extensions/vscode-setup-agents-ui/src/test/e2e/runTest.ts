import * as path from 'node:path';
import { runTests } from '@vscode/test-electron';

async function main(): Promise<void> {
  const extensionDevelopmentPath = path.resolve(__dirname, '../../../');
  const extensionTestsPath = path.resolve(__dirname, './suite/index');
  const testWorkspace = path.resolve(__dirname, '../../../.tmp-test-workspace');

  await runTests({
    extensionDevelopmentPath,
    extensionTestsPath,
    launchArgs: [testWorkspace, '--disable-extensions', '--disable-gpu'],
  });
}

main().catch((err) => {
  console.error('Failed to run E2E tests', err);
  process.exit(1);
});
