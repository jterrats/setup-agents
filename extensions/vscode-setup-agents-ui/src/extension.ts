import { execFile } from 'node:child_process';
import * as vscode from 'vscode';
import { ALL_PROFILES, MCP_INTEGRATIONS } from './constants';
import { CliService } from './services/cliService';
import { McpConfigService } from './services/mcpConfigService';
import { OrgService } from './services/orgService';
import { RuleManagementService } from './services/ruleManagementService';
import type { HostToUiMessage, ProfileId, ToolStatus, UiToHostMessage } from './types';
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

  public constructor(private readonly context: vscode.ExtensionContext) {
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
      configureIntegrations: (m) => this.handleConfigureIntegrations(m as Extract<UiToHostMessage, { type: 'configureIntegrations' }>),
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
    const sfCliInstalled = await this.isSfCliInstalled();
    if (!sfCliInstalled) {
      this.post({ type: 'pluginStatus', payload: { installed: false, sfCliMissing: true } });
    } else {
      const pluginInstalled = await this.isPluginInstalled();
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
      this.post({ type: 'operationError', payload: { message: 'npx not found. Install Node.js and ensure npx is in PATH.' } });
      return;
    }
    const toolsets = this.mcpService.resolveToolsets(message.payload.profiles, message.payload.allToolsets);
    const result = this.mcpService.writeMcpConfig(message.payload.orgs, toolsets, npx, message.payload.global, ws);
    this.post({ type: 'mcpConfigured', payload: result });
  }

  private async handleConfigureIntegrations(message: Extract<UiToHostMessage, { type: 'configureIntegrations' }>): Promise<void> {
    const ws = this.requireWorkspacePath();
    const entries: Record<string, { command?: string; args?: string[]; env?: Record<string, string>; url?: string; type?: string }> = {};
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
        entries[id] = { command: integration.command, args: [...(integration.args ?? [])], env, type: 'stdio' };
      }
    }
    const intResult = this.mcpService.writeIntegrationConfig(entries, message.payload.global, ws);
    this.post({ type: 'integrationsConfigured', payload: { serversAdded: intResult.serversAdded } });
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
    return new Promise((resolve) => {
      execFile('sf', ['--version'], { timeout: PLUGIN_CHECK_TIMEOUT }, (err) => {
        resolve(!err);
      });
    });
  }

  private async isPluginInstalled(): Promise<boolean> {
    return new Promise((resolve) => {
      execFile('sf', ['setup-agents', '--help'], { timeout: PLUGIN_CHECK_TIMEOUT }, (err) => {
        resolve(!err);
      });
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
