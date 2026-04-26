import { execFile, execFileSync, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import * as vscode from 'vscode';

const execFileAsync = promisify(execFile);

export type OrgInfo = {
  alias: string;
  username: string;
};

type OrgListResult = {
  result?: {
    nonScratchOrgs?: Array<{ alias?: string; username: string }>;
    scratchOrgs?: Array<{ alias?: string; username: string }>;
  };
};

const SF_EXTENSION_ID = 'salesforce.salesforcedx-vscode';
const POLL_INTERVAL_MS = 2_000;
const POLL_TIMEOUT_MS = 120_000;

export class OrgService {
  public async listOrgs(): Promise<OrgInfo[]> {
    try {
      const { stdout } = await execFileAsync('sf', ['org', 'list', '--json'], { encoding: 'utf8', timeout: 15_000 });
      const parsed = JSON.parse(stdout) as OrgListResult;
      const all = [...(parsed.result?.nonScratchOrgs ?? []), ...(parsed.result?.scratchOrgs ?? [])];
      return all.map((o) => ({ alias: o.alias ?? o.username, username: o.username })).filter((o) => o.alias);
    } catch (error) {
      console.debug('[orgService] listOrgs failed:', error instanceof Error ? error.message : error);
      return [];
    }
  }

  public async loginOrg(alias: string): Promise<boolean> {
    const sfExtension = vscode.extensions.getExtension(SF_EXTENSION_ID);
    if (sfExtension) {
      return this.loginViaExtension(alias, sfExtension);
    }
    return this.loginViaCli(alias);
  }

  public isSfExtensionInstalled(): boolean {
    return vscode.extensions.getExtension(SF_EXTENSION_ID) !== undefined;
  }

  private async loginViaExtension(alias: string, ext: vscode.Extension<unknown>): Promise<boolean> {
    if (!ext.isActive) {
      await ext.activate();
    }

    const orgsBefore = new Set((await this.listOrgs()).map((o) => o.username));

    try {
      await vscode.commands.executeCommand('sf.org.login.web');
    } catch {
      try {
        await vscode.commands.executeCommand('sfdx.force.auth.web.login');
      } catch {
        return this.loginViaCli(alias);
      }
    }

    const newOrg = await this.pollForNewOrg(orgsBefore);
    if (!newOrg) return false;

    this.setAlias(alias, newOrg);
    return true;
  }

  private async loginViaCli(alias: string): Promise<boolean> {
    return new Promise((resolve) => {
      const child = spawn('sf', ['org', 'login', 'web', '--alias', alias], {
        stdio: 'ignore',
        detached: false,
      });

      child.on('close', (code) => resolve(code === 0));
      child.on('error', () => resolve(false));
    });
  }

  private async pollForNewOrg(knownUsernames: Set<string>): Promise<string | null> {
    const start = Date.now();
    while (Date.now() - start < POLL_TIMEOUT_MS) {
      await this.sleep(POLL_INTERVAL_MS);
      const current = await this.listOrgs();
      const newOrg = current.find((o) => !knownUsernames.has(o.username));
      if (newOrg) return newOrg.username;
    }
    return null;
  }

  private setAlias(alias: string, username: string): void {
    try {
      execFileSync('sf', ['alias', 'set', `${alias}=${username}`], { stdio: 'ignore', timeout: 10_000 });
    } catch {
      // best-effort: if alias set fails, the org is still authenticated
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public resolveNpxCommand(): string | null {
    try {
      execFileSync('npx', ['--version'], { stdio: 'ignore', timeout: 5_000 });
      return 'npx';
    } catch {
      // npx not in PATH — try absolute resolution below
    }
    try {
      const whichCmd = process.platform === 'win32' ? 'where' : 'which';
      const resolved = execFileSync(whichCmd, ['npx'], { encoding: 'utf8', timeout: 5_000 }).trim().split('\n')[0].trim();
      if (resolved) return resolved;
    } catch {
      // npx not found on system
    }
    return null;
  }
}
