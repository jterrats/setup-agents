import * as vscode from 'vscode';

export function getHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const nonce = createNonce();
  const csp = [
    "default-src 'none'",
    `img-src ${webview.cspSource} https:`,
    `style-src ${webview.cspSource} 'unsafe-inline'`,
    `script-src 'nonce-${nonce}'`,
  ].join('; ');

  const toolkitUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'icon.svg'));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Setup Agents UI</title>
  <style>
    body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); padding: 12px; }
    .header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
    .header img { width: 18px; height: 18px; }
    .card { border: 1px solid var(--vscode-editorWidget-border); border-radius: 8px; padding: 10px; margin-bottom: 12px; }
    .row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 8px; }
    .profiles { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .muted { opacity: 0.8; font-size: 0.9em; }
    textarea { width: 100%; min-height: 170px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 4px; padding: 8px; }
    select, input, button { background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 4px; padding: 6px 8px; }
    button { cursor: pointer; }
    #console { white-space: pre-wrap; min-height: 120px; max-height: 220px; overflow-y: auto; background: var(--vscode-textCodeBlock-background); border-radius: 6px; padding: 8px; }
  </style>
</head>
<body>
  <div class="header">
    <img src="${toolkitUri}" alt="logo" />
    <strong>Setup Agents UI</strong>
  </div>

  <div class="card">
    <h3>Guided Setup</h3>
    <div id="tools" class="muted">Detecting tools...</div>
    <div class="profiles" id="profiles"></div>
    <div class="row">
      <label><input type="checkbox" id="forceCheck" /> --force</label>
      <select id="rulesSelect">
        <option value="">All detected tools</option>
        <option value="cursor">cursor</option>
        <option value="vscode">vscode</option>
        <option value="codex">codex</option>
        <option value="agentforce">agentforce</option>
      </select>
      <button id="runLocalBtn">Apply Configuration</button>
    </div>
    <div id="console" aria-live="polite"></div>
  </div>

  <div class="card">
    <h3>Profiles</h3>
    <select id="profileDetailsSelect"></select>
    <p class="muted" id="profileDetailsText"></p>
  </div>

  <div class="card">
    <h3>Rule Management</h3>
    <div class="row">
      <select id="ruleToolSelect">
        <option value="cursor">cursor</option>
        <option value="agentforce">agentforce</option>
      </select>
      <input id="importUrlInput" type="text" placeholder="https://.../rule.mdc" />
      <button id="importUrlBtn">Import URL</button>
      <button id="importFileBtn">Import File</button>
      <button id="refreshRulesBtn">Refresh</button>
    </div>
    <div class="row">
      <select id="rulesListSelect" style="min-width: 300px;"></select>
      <button id="loadRuleBtn">Load</button>
      <button id="saveRuleBtn">Save</button>
    </div>
    <textarea id="ruleEditor" placeholder="Select a rule and load it..."></textarea>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const state = { profiles: [], selectedRulePath: null };
    const toolsEl = document.getElementById('tools');
    const profilesEl = document.getElementById('profiles');
    const consoleEl = document.getElementById('console');
    const rulesListSelect = document.getElementById('rulesListSelect');
    const profileDetailsSelect = document.getElementById('profileDetailsSelect');
    const profileDetailsText = document.getElementById('profileDetailsText');
    const ruleEditor = document.getElementById('ruleEditor');

    const appendConsole = (line) => {
      consoleEl.textContent += line;
      consoleEl.scrollTop = consoleEl.scrollHeight;
    };

    const selectedProfiles = () => {
      return [...profilesEl.querySelectorAll('input[type=checkbox]:checked')].map((n) => n.value);
    };

    document.getElementById('runLocalBtn').addEventListener('click', () => {
      vscode.postMessage({
        type: 'runLocal',
        payload: {
          profiles: selectedProfiles(),
          force: document.getElementById('forceCheck').checked,
          rules: document.getElementById('rulesSelect').value || undefined
        }
      });
    });

    document.getElementById('refreshRulesBtn').addEventListener('click', () => {
      vscode.postMessage({ type: 'listRules' });
    });

    document.getElementById('loadRuleBtn').addEventListener('click', () => {
      const selected = rulesListSelect.value;
      if (!selected) return;
      state.selectedRulePath = selected;
      vscode.postMessage({ type: 'readRule', payload: { path: selected } });
    });

    document.getElementById('saveRuleBtn').addEventListener('click', () => {
      if (!state.selectedRulePath) return;
      vscode.postMessage({
        type: 'saveRule',
        payload: { path: state.selectedRulePath, content: ruleEditor.value }
      });
    });

    document.getElementById('importUrlBtn').addEventListener('click', () => {
      const url = document.getElementById('importUrlInput').value.trim();
      if (!url) return;
      vscode.postMessage({
        type: 'importRuleFromUrl',
        payload: { url, tool: document.getElementById('ruleToolSelect').value }
      });
    });

    document.getElementById('importFileBtn').addEventListener('click', () => {
      vscode.postMessage({
        type: 'importRuleFromFile',
        payload: { tool: document.getElementById('ruleToolSelect').value }
      });
    });

    profileDetailsSelect.addEventListener('change', () => {
      const found = state.profiles.find((p) => p.id === profileDetailsSelect.value);
      profileDetailsText.textContent = found ? found.description + ' | Rule: ' + found.ruleFile : '';
    });

    window.addEventListener('message', (event) => {
      const message = event.data;
      if (message.type === 'bootstrapResult') {
        toolsEl.textContent = message.payload.tools
          .map((t) => \`\${t.id}: \${t.detected ? 'detected' : 'not detected'} (\${t.reason})\`)
          .join(' | ');
        state.profiles = message.payload.profiles;
        profilesEl.innerHTML = '';
        profileDetailsSelect.innerHTML = '';
        for (const profile of message.payload.profiles) {
          const label = document.createElement('label');
          label.innerHTML = \`<input type="checkbox" value="\${profile.id}" \${profile.id === 'developer' ? 'checked' : ''} /> \${profile.label}\`;
          profilesEl.appendChild(label);
          const option = document.createElement('option');
          option.value = profile.id;
          option.textContent = profile.label;
          profileDetailsSelect.appendChild(option);
        }
        if (message.payload.profiles[0]) {
          profileDetailsSelect.value = message.payload.profiles[0].id;
          profileDetailsText.textContent = message.payload.profiles[0].description + ' | Rule: ' + message.payload.profiles[0].ruleFile;
        }
      }
      if (message.type === 'commandOutput') appendConsole(message.payload.text);
      if (message.type === 'commandComplete') appendConsole(\`\\n[done] \${message.payload.command} -> code \${message.payload.code}\\n\`);
      if (message.type === 'rulesResult') {
        rulesListSelect.innerHTML = '';
        for (const rule of message.payload) {
          const option = document.createElement('option');
          option.value = rule.path;
          option.textContent = \`\${rule.relativePath} [\${rule.scope}]\`;
          rulesListSelect.appendChild(option);
        }
      }
      if (message.type === 'ruleContent') {
        ruleEditor.value = message.payload.content;
      }
      if (message.type === 'operationError') appendConsole(\`[error] \${message.payload.message}\\n\`);
      if (message.type === 'operationSuccess') appendConsole(\`[ok] \${message.payload.message}\\n\`);
    });

    vscode.postMessage({ type: 'bootstrap' });
    vscode.postMessage({ type: 'listRules' });
  </script>
</body>
</html>`;
}

function createNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return [...Array(16)].map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
}
