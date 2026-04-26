import * as vscode from 'vscode';
import type { McpIntegrationDescriptor } from '../types';

export function getHtml(webview: vscode.Webview, extensionUri: vscode.Uri, integrations: McpIntegrationDescriptor[]): string {
  const nonce = createNonce();
  const csp = [
    "default-src 'none'",
    `img-src ${webview.cspSource} https:`,
    `style-src ${webview.cspSource}`,
    `script-src 'nonce-${nonce}'`,
  ].join('; ');

  const toolkitUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'icon.svg'));
  const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'webview.css'));
  const integrationsJsUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'webview-integrations.js'));
  const handlersJsUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'webview-message-handlers.js'));
  const jsUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'webview.js'));

  const integrationsJson = JSON.stringify(
    integrations.map((i) => ({
      id: i.id,
      label: i.label,
      profiles: i.profiles,
      envVars: i.envVars,
      transport: i.transport,
    }))
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Setup Agents UI</title>
  <link rel="stylesheet" href="${cssUri}" />
</head>
<body>
  <div class="header">
    <img src="${toolkitUri}" alt="logo" />
    <strong>Setup Agents UI</strong>
  </div>

  <div class="banner-error" id="sfCliBanner" style="display:none">
    <strong>Salesforce CLI Not Found</strong>
    <p class="muted" style="margin:4px 0">The Salesforce CLI (<code>sf</code>) must be installed before using this extension.</p>
    <p class="muted" style="margin:4px 0;font-size:0.82em">Install it from <strong>https://developer.salesforce.com/tools/salesforcecli</strong> or run: <code>npm install -g @salesforce/cli</code></p>
    <button id="sfCliRetryBtn">Retry Detection</button>
  </div>

  <div class="banner-warning" id="pluginBanner" style="display:none">
    <strong>CLI Plugin Not Found</strong>
    <p class="muted" style="margin:4px 0" id="pluginBannerText">The <code>@jterrats/setup-agents</code> Salesforce CLI plugin is required. Install it to enable all features.</p>
    <button id="installPluginBtn">Install Plugin</button>
    <span class="muted" id="pluginInstallStatus" style="margin-left:8px;display:none"></span>
  </div>

  <div class="card" id="updateCard">
    <h3>Update Agent Rules</h3>
    <p class="muted" style="font-size:0.8em;margin-top:0">Checks if your AI assistant rules are outdated and lets you update them in one click.</p>
    <p class="muted" id="updateStatus">Checking for updates...</p>
    <div id="updateActions" style="display:none">
      <p class="muted" id="updateCount"></p>
      <button id="updateNowBtn">Update Now</button>
    </div>
    <div id="updateResult" style="display:none"></div>
  </div>

  <div class="card">
    <h3>Guided Setup</h3>
    <p class="muted" style="font-size:0.8em;margin-top:0">Select the role profiles that match your team, then apply to generate AI assistant rules for your project.</p>
    <div id="tools" class="tool-status">Detecting tools...</div>
    <div class="profiles" id="profiles"></div>
    <details style="margin:6px 0">
      <summary class="muted" style="cursor:pointer;font-size:0.82em">View profile details</summary>
      <div style="padding:6px 0">
        <select id="profileDetailsSelect"></select>
        <p class="muted" id="profileDetailsText" style="margin:4px 0 0"></p>
      </div>
    </details>
    <p class="muted" style="font-size:0.78em;margin:4px 0 2px"><strong>Where to save the rules:</strong></p>
    <div class="row" style="margin-top:0">
      <label style="display:flex;align-items:center;gap:4px" title="Rules are saved inside this project only — ideal for team collaboration"><input type="radio" name="scopeRadio" value="project" checked /> <span class="tooltip-label">This project only</span></label>
      <label style="display:flex;align-items:center;gap:4px" title="Rules are saved in your home folder and apply to every project you open"><input type="radio" name="scopeRadio" value="user" /> <span class="tooltip-label">All my projects</span></label>
    </div>
    <div class="row">
      <label title="Replace existing rule files even if they were customized"><input type="checkbox" id="forceCheck" /> <span class="tooltip-label">Replace existing</span></label>
      <select id="rulesSelect" title="Generate rules for a specific tool, or for all tools detected in your project">
        <option value="">All detected tools</option>
        <option value="cursor">Cursor</option>
        <option value="vscode">VS Code</option>
        <option value="codex">Codex</option>
        <option value="agentforce">Agentforce</option>
        <option value="claude">Claude</option>
      </select>
      <button id="runLocalBtn" title="Generate and save rule files based on the options above">Apply Configuration</button>
    </div>
    <div id="console" class="placeholder" aria-live="polite">Output will appear here...</div>
  </div>

  <div class="card" id="mcpCard">
    <h3>MCP Configuration</h3>
    <p class="muted" style="font-size:0.8em;margin-top:0">Connect your Salesforce orgs so AI assistants can query, deploy, and manage your metadata directly.</p>
    <p class="muted" style="font-size:0.78em;margin:2px 0"><strong>Select the orgs to connect:</strong></p>
    <p class="muted" id="mcpStatus">Loading orgs...</p>
    <div id="mcpOrgsSection" style="display:none">
      <div class="profiles" id="mcpOrgs" role="group" aria-label="Org selection"></div>
      <div class="row">
        <label title="Save this configuration for all your projects (global). When unchecked, it only applies to this project."><input type="checkbox" id="mcpGlobal" /> <span class="tooltip-label">Apply to all projects</span></label>
        <label title="Include tools from every profile, not just the ones you selected above"><input type="checkbox" id="mcpAllToolsets" /> <span class="tooltip-label">Include all profile tools</span></label>
      </div>
      <div class="row">
        <button id="mcpConfigureBtn" disabled>Connect Selected Orgs</button>
      </div>
    </div>
    <div id="mcpLoginSection" style="display:none">
      <p class="muted">No authenticated Salesforce orgs found. Log in to connect one.</p>
      <div class="row">
        <input id="mcpLoginAlias" type="text" placeholder="Choose an alias (e.g. myOrg)" style="min-width:180px" title="A short name to identify this org (e.g. 'dev', 'qa', 'prod')" />
        <button id="mcpLoginBtn">Log In to Org</button>
      </div>
      <p class="muted" id="mcpLoginStatus" style="display:none"></p>
    </div>
    <div id="mcpResult" style="display:none"></div>
    <hr style="border:none;border-top:1px solid var(--vscode-editorWidget-border);margin:12px 0" />
    <h4 style="margin:0 0 4px">Third-Party Integrations</h4>
    <p class="muted" id="integrationsHint" style="font-size:0.8em">Select profiles in Guided Setup to see available integrations (Figma, Jira, GitHub, etc.).</p>
    <div id="integrationsGrid" class="profiles" style="display:none"></div>
    <div id="integrationsCreds" style="display:none"></div>
    <div class="row" id="integrationsActions" style="display:none">
      <label title="Save this configuration for all your projects (global). When unchecked, it only applies to this project."><input type="checkbox" id="integrationsGlobal" /> <span class="tooltip-label">Apply to all projects</span></label>
      <button id="integrationsConfigureBtn" disabled>Connect Integrations</button>
    </div>
    <div id="integrationsResult" style="display:none"></div>
  </div>

  <div class="card">
    <h3>Rule Management</h3>
    <p class="muted" style="font-size:0.8em;margin-top:0">Import, view, and edit AI assistant rule files. Use this to add custom rules from a URL or file.</p>
    <div class="row">
      <select id="ruleToolSelect" title="Choose which tool format to use for the imported rule">
        <option value="cursor">Cursor</option>
        <option value="agentforce">Agentforce</option>
        <option value="claude">Claude</option>
      </select>
      <input id="importUrlInput" type="text" placeholder="Paste a rule URL..." title="URL of a .md or .mdc rule file to import" />
      <button id="importUrlBtn">Import URL</button>
      <button id="importFileBtn" title="Browse your computer for a rule file to import">Import File</button>
      <button id="refreshRulesBtn" title="Reload the list of rule files in this project">Refresh</button>
    </div>
    <div class="row">
      <select id="rulesListSelect" style="min-width:100%" title="Select a rule file to view or edit"></select>
    </div>
    <div class="row">
      <button id="loadRuleBtn" title="Open the selected rule file in the editor below">Open</button>
      <button id="saveRuleBtn" title="Save your changes back to the rule file">Save Changes</button>
    </div>
    <textarea id="ruleEditor" placeholder="Select a rule file above and click Open to view it here..."></textarea>
  </div>

  <script nonce="${nonce}">window.__INTEGRATIONS__ = ${integrationsJson};</script>
  <script nonce="${nonce}" src="${integrationsJsUri}"></script>
  <script nonce="${nonce}" src="${handlersJsUri}"></script>
  <script nonce="${nonce}" src="${jsUri}"></script>
</body>
</html>`;
}

function createNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return [...Array(16)].map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
}
