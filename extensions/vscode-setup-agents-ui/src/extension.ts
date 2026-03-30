import * as vscode from 'vscode';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ALL_PROFILES } from './constants';
import { CliService } from './services/cliService';
import { RuleManagementService } from './services/ruleManagementService';
import type { HostToUiMessage, ToolStatus, UiToHostMessage } from './types';
import { getHtml } from './webview/getHtml';

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

class SetupAgentsViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private readonly cliService = new CliService();
  private readonly ruleService = new RuleManagementService();

  public constructor(private readonly context: vscode.ExtensionContext) {}

  public async openPanel(): Promise<void> {
    await vscode.commands.executeCommand('workbench.view.extension.setupAgentsUi');
  }

  public async requestImportFromUrl(): Promise<void> {
    this.view?.show?.(true);
    await this.showInfo('Use the Rule Management section to paste a URL and import.');
  }

  public async requestImportFromFile(): Promise<void> {
    this.view?.show?.(true);
    await this.showInfo('Use the Rule Management section and click "Import File".');
  }

  public resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view;
    view.webview.options = { enableScripts: true, localResourceRoots: [this.context.extensionUri] };
    view.webview.html = getHtml(view.webview, this.context.extensionUri);
    view.webview.onDidReceiveMessage((message: UiToHostMessage) => void this.handleMessage(message));
  }

  private async handleMessage(message: UiToHostMessage): Promise<void> {
    try {
      switch (message.type) {
        case 'bootstrap':
          this.post({
            type: 'bootstrapResult',
            payload: {
              tools: this.detectTools(),
              profiles: ALL_PROFILES,
            },
          });
          return;
        case 'runLocal': {
          const workspacePath = this.requireWorkspacePath();
          this.cliService.runSetupAgentsLocal(workspacePath, message.payload, {
            onStdout: (text) => this.post({ type: 'commandOutput', payload: { stream: 'stdout', text } }),
            onStderr: (text) => this.post({ type: 'commandOutput', payload: { stream: 'stderr', text } }),
            onClose: (code, command) => this.post({ type: 'commandComplete', payload: { code, command } }),
          });
          return;
        }
        case 'listRules': {
          const workspacePath = this.requireWorkspacePath();
          const rules = await this.ruleService.listRules(workspacePath);
          this.post({ type: 'rulesResult', payload: rules });
          return;
        }
        case 'readRule': {
          const content = await this.ruleService.readRule(message.payload.path);
          this.post({ type: 'ruleContent', payload: { path: message.payload.path, content } });
          return;
        }
        case 'saveRule': {
          await this.ruleService.saveRule(message.payload.path, message.payload.content);
          this.post({ type: 'operationSuccess', payload: { message: 'Rule saved successfully.' } });
          return;
        }
        case 'importRuleFromUrl': {
          const workspacePath = this.requireWorkspacePath();
          const target = await this.ruleService.importRuleFromUrl(
            workspacePath,
            message.payload.url,
            message.payload.tool
          );
          this.post({ type: 'operationSuccess', payload: { message: `Imported: ${target}` } });
          const rules = await this.ruleService.listRules(workspacePath);
          this.post({ type: 'rulesResult', payload: rules });
          return;
        }
        case 'importRuleFromFile': {
          const selected = await vscode.window.showOpenDialog({
            canSelectMany: false,
            canSelectFiles: true,
            filters: { Markdown: ['md', 'mdc'] },
          });
          if (!selected || selected.length === 0) return;
          const workspacePath = this.requireWorkspacePath();
          const target = await this.ruleService.importRuleFromFile(
            workspacePath,
            selected[0].fsPath,
            message.payload.tool
          );
          this.post({ type: 'operationSuccess', payload: { message: `Imported: ${target}` } });
          const rules = await this.ruleService.listRules(workspacePath);
          this.post({ type: 'rulesResult', payload: rules });
          return;
        }
      }
    } catch (error) {
      this.post({ type: 'operationError', payload: { message: this.asErrorMessage(error) } });
    }
  }

  private post(message: HostToUiMessage): void {
    this.view?.webview.postMessage(message);
  }

  private detectTools(): ToolStatus[] {
    const workspace = vscode.workspace.workspaceFolders?.[0];
    if (!workspace) {
      return [
        { id: 'cursor', detected: false, reason: 'No open workspace' },
        { id: 'vscode', detected: false, reason: 'No open workspace' },
        { id: 'codex', detected: false, reason: 'No open workspace' },
        { id: 'agentforce', detected: false, reason: 'No open workspace' },
      ];
    }

    const workspacePath = workspace.uri.fsPath;
    const exists = (segments: string[]): boolean => existsSync(join(workspacePath, ...segments));

    return [
      { id: 'cursor', detected: exists(['.cursor']), reason: '.cursor directory' },
      { id: 'vscode', detected: exists(['.vscode']), reason: '.vscode directory' },
      { id: 'codex', detected: exists(['AGENTS.md']), reason: 'AGENTS.md file' },
      { id: 'agentforce', detected: exists(['.a4drules']), reason: '.a4drules directory' },
    ];
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

  private async showInfo(message: string): Promise<void> {
    await vscode.window.showInformationMessage(message);
  }
}
