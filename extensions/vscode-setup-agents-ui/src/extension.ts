import { execFile } from 'node:child_process';
import * as vscode from 'vscode';
import { ALL_PROFILES, MCP_INTEGRATIONS } from './constants';
import { CliService } from './services/cliService';
import { McpConfigService } from './services/mcpConfigService';
import { OrgService } from './services/orgService';
import { RuleManagementService } from './services/ruleManagementService';
import type { AddCustomIntegrationRequest, HostToUiMessage, ProfileId, ToolStatus, UiToHostMessage } from './types';
import { getHtml } from './webview/getHtml';

const PLUGIN_INSTALL_TIMEOUT = 120_000;
const CLI_JSON_TIMEOUT = 30_000;
const PLUGIN_CHECK_TIMEOUT = 15_000;

export function activate(context: vscode.ExtensionContext): void {
  const provider = new SetupAgentsViewProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('setupAgentsUi.sidebar', provider, {
      webviewOptions: { retainContextWhenHidden: true },
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('setupAgentsUi.open', async () => provider.openPanel()),
    vscode.commands.registerCommand('setupAgentsUi.importRulesFromUrl', async () => provider.requestImportFromUrl()),
    vscode.commands.registerCommand('setupAgentsUi.importRulesFromFile', async () => provider.requestImportFromFile())
  );
}

export function deactivate(): void {
  // no-op
}

type MessageHandler = (message: UiToHostMessage) => Promise<void>;

class SetupAgentsViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private readonly cliService = new CliService();
  private readonly orgService = new OrgService();
  private readonly mcpService = new McpConfigService();
  private readonly ruleService = new RuleManagementService();
  private readonly handlers: Record<string, MessageHandler>;
  private readonly log: vscode.OutputChannel;

  public constructor(private readonly context: vscode.ExtensionContext) {
    this.log = vscode.window.createOutputChannel('Setup Agents');
    context.subscriptions.push(this.log);
    this.handlers = {
      bootstrap: () => this.handleBootstrap(),
      runLocal: (m) => this.handleRunLocal(m as Extract<UiToHostMessage, { type: 'runLocal' }>),
      listRules: () => this.handleListRules(),
      readRule: (m) => this.handleReadRule(m as Extract<UiToHostMessage, { type: 'readRule' }>),
      saveRule: (m) => this.handleSaveRule(m as Extract<UiToHostMessage, { type: 'saveRule' }>),
      importRuleFromUrl: (m) => this.handleImportUrl(m as Extract<UiToHostMessage, { type: 'importRuleFromUrl' }>),
      importRuleFromFile: (m) => this.handleImportFile(m as Extract<UiToHostMessage, { type: 'importRuleFromFile' }>),
      listOrgs: () => this.handleListOrgs(),
      loginOrg: (m) => this.handleLoginOrg(m as Extract<UiToHostMessage, { type: 'loginOrg' }>),
      configureMcp: (m) => this.handleConfigureMcp(m as Extract<UiToHostMessage, { type: 'configureMcp' }>),
      configureIntegrations: (m) =>
        this.handleConfigureIntegrations(m as Extract<UiToHostMessage, { type: 'configureIntegrations' }>),
      addCustomIntegration: (m) =>
        this.handleAddCustomIntegration(m as Extract<UiToHostMessage, { type: 'addCustomIntegration' }>),
      checkForUpdates: () => this.handleCheckForUpdates(),
      installPlugin: () => this.handleInstallPlugin(),
      runUpdate: () => this.handleRunUpdate(),
    };
  }

  public async openPanel(): Promise<void> {
    await vscode.commands.executeCommand('workbench.view.extension.setupAgentsUi.sidebar');
  }

  public async requestImportFromUrl(): Promise<void> {
    this.view?.show?.(true);
    await vscode.window.showInformationMessage('Use the Rule Management section to paste a URL and import.');
  }

  public async requestImportFromFile(): Promise<void> {
    this.view?.show?.(true);
    await vscode.window.showInformationMessage('Use the Rule Management section and click "Import File".');
  }

  public resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view;
    view.webview.options = { enableScripts: true, localResourceRoots: [this.context.extensionUri] };
    view.webview.html = getHtml(view.webview, this.context.extensionUri, MCP_INTEGRATIONS);
    view.webview.onDidReceiveMessage((message: UiToHostMessage) => void this.handleMessage(message));
  }

  private async handleMessage(message: UiToHostMessage): Promise<void> {
    try {
      const handler = this.handlers[message.type];
      if (handler) await handler(message);
    } catch (error) {
      this.post({ type: 'operationError', payload: { message: this.asErrorMessage(error) } });
    }
  }

  // ─── Individual handlers ──────────────────────────────────────────────────

  private async handleBootstrap(): Promise<void> {
    this.log.appendLine(
      `[bootstrap] starting — platform: ${process.platform}, SHELL: ${process.env.SHELL ?? 'undefined'}, PATH: ${
        process.env.PATH ?? 'undefined'
      }`
    );
    if (!vscode.workspace.workspaceFolders?.[0]) {
      this.post({ type: 'pluginStatus', payload: { installed: false, noWorkspace: true } });
      this.post({
        type: 'bootstrapResult',
        payload: { tools: [], profiles: ALL_PROFILES, activeProfiles: [] },
      });
      return;
    }
    const sfCliInstalled = await this.isSfCliInstalled();
    this.log.appendLine(`[bootstrap] SF CLI detected: ${sfCliInstalled}`);
    if (!sfCliInstalled) {
      this.post({ type: 'pluginStatus', payload: { installed: false, sfCliMissing: true } });
    } else {
      const pluginInstalled = await this.isPluginInstalled();
      this.log.appendLine(`[bootstrap] plugin (@jterrats/setup-agents) detected: ${pluginInstalled}`);
      this.post({ type: 'pluginStatus', payload: { installed: pluginInstalled } });
    }
    const activeProfiles = await this.detectActiveProfiles();
    this.post({
      type: 'bootstrapResult',
      payload: { tools: await this.detectTools(), profiles: ALL_PROFILES, activeProfiles },
    });
    try {
      const workspacePath = this.requireWorkspacePath();
      const configuredServers = this.mcpService.readConfiguredServers(workspacePath);
      this.post({ type: 'mcpSyncResult', payload: { configuredServers } });
    } catch {
      // no workspace open — skip MCP sync
    }
  }

  private async handleRunLocal(message: Extract<UiToHostMessage, { type: 'runLocal' }>): Promise<void> {
    const workspacePath = this.requireWorkspacePath();
    this.cliService.runSetupAgentsLocal(workspacePath, message.payload, {
      onStdout: (text) => this.post({ type: 'commandOutput', payload: { stream: 'stdout', text } }),
      onStderr: (text) => this.post({ type: 'commandOutput', payload: { stream: 'stderr', text } }),
      onClose: (code, command) => this.post({ type: 'commandComplete', payload: { code, command } }),
    });
  }

  private async handleListRules(): Promise<void> {
    const workspacePath = this.requireWorkspacePath();
    const rules = await this.ruleService.listRules(workspacePath);
    this.post({ type: 'rulesResult', payload: rules });
  }

  private async handleReadRule(message: Extract<UiToHostMessage, { type: 'readRule' }>): Promise<void> {
    const content = await this.ruleService.readRule(message.payload.path);
    this.post({ type: 'ruleContent', payload: { path: message.payload.path, content } });
  }

  private async handleSaveRule(message: Extract<UiToHostMessage, { type: 'saveRule' }>): Promise<void> {
    await this.ruleService.saveRule(message.payload.path, message.payload.content);
    this.post({ type: 'operationSuccess', payload: { message: 'Rule saved successfully.' } });
  }

  private async handleImportUrl(message: Extract<UiToHostMessage, { type: 'importRuleFromUrl' }>): Promise<void> {
    const workspacePath = this.requireWorkspacePath();
    const target = await this.ruleService.importRuleFromUrl(workspacePath, message.payload.url, message.payload.tool);
    this.post({ type: 'operationSuccess', payload: { message: `Imported: ${target}` } });
    const rules = await this.ruleService.listRules(workspacePath);
    this.post({ type: 'rulesResult', payload: rules });
  }

  private async handleImportFile(message: Extract<UiToHostMessage, { type: 'importRuleFromFile' }>): Promise<void> {
    const selected = await vscode.window.showOpenDialog({
      canSelectMany: false,
      canSelectFiles: true,
      filters: { Markdown: ['md', 'mdc'] },
    });
    if (!selected || selected.length === 0) return;
    const workspacePath = this.requireWorkspacePath();
    const target = await this.ruleService.importRuleFromFile(workspacePath, selected[0].fsPath, message.payload.tool);
    this.post({ type: 'operationSuccess', payload: { message: `Imported: ${target}` } });
    const rules = await this.ruleService.listRules(workspacePath);
    this.post({ type: 'rulesResult', payload: rules });
  }

  private async handleListOrgs(): Promise<void> {
    const orgs = await this.orgService.listOrgs();
    const sfExtensionInstalled = this.orgService.isSfExtensionInstalled();
    this.post({ type: 'orgsResult', payload: { orgs, sfExtensionInstalled } });
  }

  private async handleLoginOrg(message: Extract<UiToHostMessage, { type: 'loginOrg' }>): Promise<void> {
    const alias = message.payload.alias.trim();
    const success = await this.orgService.loginOrg(alias);
    this.post({ type: 'orgLoginResult', payload: { success, alias } });
    if (success) {
      const orgs = await this.orgService.listOrgs();
      const sfExtensionInstalled = this.orgService.isSfExtensionInstalled();
      this.post({ type: 'orgsResult', payload: { orgs, sfExtensionInstalled } });
    }
  }

  private async handleConfigureMcp(message: Extract<UiToHostMessage, { type: 'configureMcp' }>): Promise<void> {
    const ws = this.requireWorkspacePath();
    const npx = this.orgService.resolveNpxCommand();
    if (!npx) {
      this.post({
        type: 'operationError',
        payload: { message: 'npx not found. Install Node.js and ensure npx is in PATH.' },
      });
      return;
    }
    const toolsets = this.mcpService.resolveToolsets(message.payload.profiles, message.payload.allToolsets);
    const result = this.mcpService.writeMcpConfig(message.payload.orgs, toolsets, npx, message.payload.global, ws);
    this.post({ type: 'mcpConfigured', payload: result });
  }

  private async handleConfigureIntegrations(
    message: Extract<UiToHostMessage, { type: 'configureIntegrations' }>
  ): Promise<void> {
    const ws = this.requireWorkspacePath();
    const entries: Record<
      string,
      { command?: string; args?: string[]; env?: Record<string, string>; url?: string; type?: string }
    > = {};
    for (const id of message.payload.ids) {
      const integration = MCP_INTEGRATIONS.find((i) => i.id === id);
      if (!integration) continue;
      if (integration.transport === 'http') {
        entries[id] = { url: integration.url };
      } else {
        const env: Record<string, string> = {};
        for (const spec of integration.envVars) {
          env[spec.name] = message.payload.credentials[id]?.[spec.name] ?? '';
        }
        entries[id] = { command: integration.command, args: [...(integration.args ?? [])], env };
      }
    }
    const intResult = this.mcpService.writeIntegrationConfig(entries, message.payload.global, ws);
    this.post({ type: 'integrationsConfigured', payload: { serversAdded: intResult.serversAdded } });
  }

  private async handleAddCustomIntegration(
    message: Extract<UiToHostMessage, { type: 'addCustomIntegration' }>
  ): Promise<void> {
    const ws = this.requireWorkspacePath();
    const {
      name,
      transport,
      command,
      args,
      env,
      url,
      global: isGlobal,
    } = message.payload as AddCustomIntegrationRequest;
    const entry =
      transport === 'http' ? { url: url ?? '' } : { command: command ?? '', args: args ?? [], env: env ?? {} };
    this.mcpService.writeIntegrationConfig({ [name]: entry }, isGlobal, ws);
    this.post({ type: 'customIntegrationAdded', payload: { serverName: name } });
  }

  private async handleCheckForUpdates(): Promise<void> {
    const workspacePath = this.requireWorkspacePath();
    this.runCliJson<{ result?: { updated?: string[] } }>(
      workspacePath,
      ['setup-agents', 'update', '--dry-run', '--json'],
      (parsed) => {
        const staleFiles: string[] = parsed?.result?.updated ?? [];
        this.post({ type: 'updateCheckResult', payload: { staleFiles } });
      }
    );
  }

  private async handleInstallPlugin(): Promise<void> {
    this.post({ type: 'pluginStatus', payload: { installed: false, installing: true } });
    execFile('sf', ['plugins', 'install', '@jterrats/setup-agents'], { timeout: PLUGIN_INSTALL_TIMEOUT }, (err) => {
      if (err) {
        this.post({ type: 'operationError', payload: { message: `Plugin install failed: ${err.message}` } });
        this.post({ type: 'pluginStatus', payload: { installed: false } });
      } else {
        this.post({ type: 'pluginStatus', payload: { installed: true } });
        this.post({ type: 'operationSuccess', payload: { message: 'Plugin @jterrats/setup-agents installed.' } });
      }
    });
  }

  private async handleRunUpdate(): Promise<void> {
    const workspacePath = this.requireWorkspacePath();
    this.cliService.runSetupAgentsLocal(
      workspacePath,
      { profiles: [], force: true },
      {
        onStdout: (text) => this.post({ type: 'commandOutput', payload: { stream: 'stdout', text } }),
        onStderr: (text) => this.post({ type: 'commandOutput', payload: { stream: 'stderr', text } }),
        onClose: (code) => {
          const updated = code === 0 ? ['update completed'] : [];
          this.post({ type: 'updateComplete', payload: { updated } });
        },
      }
    );
  }

  // ─── Utilities ────────────────────────────────────────────────────────────

  private post(message: HostToUiMessage): void {
    this.view?.webview.postMessage(message);
  }

  private async detectTools(): Promise<ToolStatus[]> {
    const workspace = vscode.workspace.workspaceFolders?.[0];
    if (!workspace) {
      return (['cursor', 'vscode', 'codex', 'agentforce'] as const).map((id) => ({
        id,
        detected: false as const,
        reason: 'No open workspace',
      }));
    }

    const workspaceUri = workspace.uri;
    const exists = async (segments: string[]): Promise<boolean> => {
      try {
        await vscode.workspace.fs.stat(vscode.Uri.joinPath(workspaceUri, ...segments));
        return true;
      } catch {
        return false;
      }
    };

    const claudeDetected = (await exists(['CLAUDE.md'])) || (await exists(['.claude']));

    return [
      { id: 'cursor', detected: await exists(['.cursor']), reason: '.cursor directory' },
      { id: 'vscode', detected: await exists(['.vscode']), reason: '.vscode directory' },
      { id: 'codex', detected: await exists(['AGENTS.md']), reason: 'AGENTS.md file' },
      { id: 'agentforce', detected: await exists(['.a4drules']), reason: '.a4drules directory' },
      { id: 'claude', detected: claudeDetected, reason: 'CLAUDE.md or .claude/ directory' },
    ];
  }

  private async detectActiveProfiles(): Promise<ProfileId[]> {
    const workspace = vscode.workspace.workspaceFolders?.[0];
    if (!workspace) return [];
    const active: ProfileId[] = [];
    for (const profile of ALL_PROFILES) {
      try {
        await vscode.workspace.fs.stat(vscode.Uri.joinPath(workspace.uri, '.cursor', 'rules', profile.ruleFile));
        active.push(profile.id);
      } catch {
        // rule file doesn't exist
      }
    }
    return active;
  }

  private async isSfCliInstalled(): Promise<boolean> {
    return this.tryExecSf(['--version']);
  }

  private async isPluginInstalled(): Promise<boolean> {
    return this.tryExecSf(['setup-agents', '--help']);
  }

  private tryExecSf(args: string[]): Promise<boolean> {
    // VS Code launched from Dock/Spotlight (macOS/Linux) or Start Menu (Windows)
    // runs with a minimal PATH that skips shell init files. We resolve the full
    // path to sf via the user's shell before running it.
    return new Promise((resolve) => {
      this.resolveSfPath()
        .then((sfPath) => {
          execFile(sfPath ?? 'sf', args, { timeout: PLUGIN_CHECK_TIMEOUT }, (e) => resolve(!e));
        })
        .catch(() => {
          execFile('sf', args, { timeout: PLUGIN_CHECK_TIMEOUT }, (e) => resolve(!e));
        });
    });
  }

  private resolveSfPath(): Promise<string | null> {
    return new Promise((resolve) => {
      if (process.platform === 'win32') {
        execFile('cmd.exe', ['/c', 'where sf'], { timeout: 5_000 }, (err, stdout, stderr) => {
          const first = stdout.trim().split('\r\n')[0].trim();
          this.log.appendLine(`[resolveSfPath] win32 where sf → "${first}" err: ${err?.message ?? 'none'}`);
          resolve(!err && first ? first : null);
        });
        return;
      }

      const shell = process.env.SHELL ?? '/bin/zsh';
      // Try login shell first (-lc sources .zprofile/.profile), then interactive-login (-ilc sources .zshrc too).
      // stdout may contain noise from startup scripts so we extract only the first absolute path line.
      const tryShell = (flags: string, next: () => void) => {
        execFile(shell, [flags, 'command -v sf'], { timeout: 5_000 }, (err, stdout, stderr) => {
          const sfPath =
            stdout
              .split('\n')
              .map((l) => l.trim())
              .find((l) => l.startsWith('/')) ?? '';
          this.log.appendLine(
            `[resolveSfPath] ${shell} ${flags} command -v sf → "${sfPath}" err: ${
              err?.message ?? 'none'
            } stderr: "${stderr.trim().slice(0, 120)}"`
          );
          if (!err && sfPath) {
            resolve(sfPath);
            return;
          }
          next();
        });
      };

      tryShell('-lc', () =>
        tryShell('-ilc', () => {
          // Fallback: probe common install locations directly
          const home = process.env.HOME ?? '';
          const candidates = [
            `${home}/.npm-global/bin/sf`,
            `${home}/.local/share/sf/bin/sf`,
            `${home}/.volta/bin/sf`,
            '/usr/local/bin/sf',
            '/opt/homebrew/bin/sf',
          ].filter(Boolean);
          this.log.appendLine(`[resolveSfPath] shell lookup failed — probing ${candidates.length} fallback paths`);
          const tryNext = (i: number): void => {
            if (i >= candidates.length) {
              resolve(null);
              return;
            }
            const p = candidates[i];
            execFile(p, ['--version'], { timeout: 3_000 }, (e) => {
              if (!e) {
                this.log.appendLine(`[resolveSfPath] fallback hit: ${p}`);
                resolve(p);
              } else tryNext(i + 1);
            });
          };
          tryNext(0);
        })
      );
    });
  }

  private runCliJson<T>(cwd: string, args: string[], callback: (result: T) => void): void {
    execFile('sf', args, { cwd, timeout: CLI_JSON_TIMEOUT }, (_error: Error | null, stdout: string) => {
      try {
        callback(JSON.parse(stdout || '{}') as T);
      } catch {
        callback({} as T);
      }
    });
  }

  private requireWorkspacePath(): string {
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder) throw new Error('Open a workspace folder before running setup-agents commands.');
    return folder.uri.fsPath;
  }

  private asErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
  }
}
