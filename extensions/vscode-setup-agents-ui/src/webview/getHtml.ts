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
    .profiles { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 8px 0; }
    .profile-card { display: flex; align-items: flex-start; gap: 6px; padding: 6px 8px; border: 1px solid var(--vscode-editorWidget-border); border-radius: 6px; cursor: pointer; transition: border-color 0.15s; }
    .profile-card:hover { border-color: var(--vscode-focusBorder); }
    .profile-card.selected { border-color: var(--vscode-focusBorder); background: var(--vscode-list-activeSelectionBackground); color: var(--vscode-list-activeSelectionForeground); }
    .profile-card input[type=checkbox] { margin-top: 2px; }
    .profile-card .profile-info { display: flex; flex-direction: column; }
    .profile-card .profile-name { font-weight: bold; font-size: 0.92em; }
    .profile-card .profile-desc { font-size: 0.8em; opacity: 0.75; }
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

  <div class="card" id="mcpCard">
    <h3>MCP Configuration</h3>
    <p class="muted" id="mcpStatus">Loading orgs...</p>
    <div id="mcpOrgsSection" style="display:none">
      <div class="profiles" id="mcpOrgs" role="group" aria-label="Org selection"></div>
      <div class="row">
        <label><input type="checkbox" id="mcpGlobal" /> Global (~/.cursor/mcp.json)</label>
        <label><input type="checkbox" id="mcpAllToolsets" /> All toolsets</label>
      </div>
      <div class="row">
        <button id="mcpConfigureBtn" disabled>Configure MCP</button>
      </div>
    </div>
    <div id="mcpLoginSection" style="display:none">
      <p class="muted">No authenticated Salesforce orgs found.</p>
      <div class="row">
        <input id="mcpLoginAlias" type="text" placeholder="Org alias (e.g. myOrg)" style="min-width:180px" />
        <button id="mcpLoginBtn">Authenticate Org</button>
      </div>
      <p class="muted" id="mcpLoginStatus" style="display:none"></p>
    </div>
    <div id="mcpResult" style="display:none"></div>
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
    const persisted = vscode.getState() || {};
    const state = { profiles: [], selectedRulePath: null, selectedProfileIds: persisted.selectedProfileIds || ['developer'] };
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
        const savedSelections = state.selectedProfileIds;
        profilesEl.innerHTML = '';
        profileDetailsSelect.innerHTML = '';
        for (const profile of message.payload.profiles) {
          const isChecked = savedSelections.includes(profile.id);
          const card = document.createElement('label');
          card.className = 'profile-card' + (isChecked ? ' selected' : '');
          card.innerHTML = \`<input type="checkbox" value="\${profile.id}" \${isChecked ? 'checked' : ''} /><div class="profile-info"><span class="profile-name">\${profile.label}</span><span class="profile-desc">\${profile.description}</span></div>\`;
          const checkbox = card.querySelector('input');
          checkbox.addEventListener('change', () => {
            card.classList.toggle('selected', checkbox.checked);
            state.selectedProfileIds = selectedProfiles();
            vscode.setState({ selectedProfileIds: state.selectedProfileIds });
          });
          profilesEl.appendChild(card);
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

      if (message.type === 'orgsResult') {
        const { orgs, sfExtensionInstalled } = message.payload;
        const mcpStatus = document.getElementById('mcpStatus');
        const mcpOrgsSection = document.getElementById('mcpOrgsSection');
        const mcpLoginSection = document.getElementById('mcpLoginSection');
        const mcpOrgsEl = document.getElementById('mcpOrgs');
        const mcpConfigureBtn = document.getElementById('mcpConfigureBtn');

        if (orgs.length > 0) {
          mcpStatus.textContent = orgs.length + ' org(s) found';
          mcpOrgsSection.style.display = '';
          mcpLoginSection.style.display = 'none';
          mcpOrgsEl.innerHTML = '';
          state.mcpSelectedOrgs = state.mcpSelectedOrgs || [];
          for (const org of orgs) {
            const isChecked = state.mcpSelectedOrgs.includes(org.alias);
            const card = document.createElement('label');
            card.className = 'profile-card' + (isChecked ? ' selected' : '');
            card.setAttribute('role', 'checkbox');
            card.setAttribute('aria-checked', String(isChecked));
            card.setAttribute('tabindex', '0');
            card.innerHTML = '<input type="checkbox" value="' + org.alias + '" ' + (isChecked ? 'checked' : '') + ' />'
              + '<div class="profile-info"><span class="profile-name">' + org.alias + '</span>'
              + '<span class="profile-desc">' + org.username + '</span></div>';
            const cb = card.querySelector('input');
            cb.addEventListener('change', () => {
              card.classList.toggle('selected', cb.checked);
              card.setAttribute('aria-checked', String(cb.checked));
              state.mcpSelectedOrgs = [...mcpOrgsEl.querySelectorAll('input:checked')].map(n => n.value);
              mcpConfigureBtn.disabled = state.mcpSelectedOrgs.length === 0;
            });
            card.addEventListener('keydown', (e) => {
              if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); cb.checked = !cb.checked; cb.dispatchEvent(new Event('change')); }
            });
            mcpOrgsEl.appendChild(card);
          }
          mcpConfigureBtn.disabled = (state.mcpSelectedOrgs || []).length === 0;
        } else {
          mcpStatus.textContent = sfExtensionInstalled
            ? 'No orgs found. The Salesforce Extension will handle the login.'
            : 'No orgs found. Login via Salesforce CLI.';
          mcpOrgsSection.style.display = 'none';
          mcpLoginSection.style.display = '';
        }
      }

      if (message.type === 'orgLoginResult') {
        const loginStatus = document.getElementById('mcpLoginStatus');
        const loginBtn = document.getElementById('mcpLoginBtn');
        loginBtn.disabled = false;
        loginBtn.textContent = 'Authenticate Org';
        if (message.payload.success) {
          loginStatus.textContent = 'Authenticated: ' + message.payload.alias;
          loginStatus.style.display = '';
          loginStatus.style.color = 'var(--vscode-charts-green)';
        } else {
          loginStatus.textContent = 'Authentication failed. Try again.';
          loginStatus.style.display = '';
          loginStatus.style.color = 'var(--vscode-errorForeground)';
        }
      }

      if (message.type === 'mcpConfigured') {
        const mcpResult = document.getElementById('mcpResult');
        mcpResult.style.display = '';
        mcpResult.innerHTML = '<p style="color:var(--vscode-charts-green)">MCP configured in <code>'
          + message.payload.mcpFile + '</code></p><p class="muted">Servers: '
          + message.payload.serversAdded.join(', ') + '</p>';
        appendConsole('[ok] MCP configured: ' + message.payload.serversAdded.join(', ') + '\\n');
      }
    });

    // MCP: login button
    document.getElementById('mcpLoginBtn').addEventListener('click', () => {
      const aliasInput = document.getElementById('mcpLoginAlias');
      const alias = aliasInput.value.trim();
      if (!alias) { aliasInput.focus(); return; }
      const btn = document.getElementById('mcpLoginBtn');
      btn.disabled = true;
      btn.textContent = 'Authenticating...';
      document.getElementById('mcpLoginStatus').style.display = 'none';
      vscode.postMessage({ type: 'loginOrg', payload: { alias } });
    });

    // MCP: configure button
    document.getElementById('mcpConfigureBtn').addEventListener('click', () => {
      vscode.postMessage({
        type: 'configureMcp',
        payload: {
          orgs: state.mcpSelectedOrgs || [],
          profiles: selectedProfiles(),
          allToolsets: document.getElementById('mcpAllToolsets').checked,
          global: document.getElementById('mcpGlobal').checked,
        }
      });
    });

    vscode.postMessage({ type: 'bootstrap' });
    vscode.postMessage({ type: 'listRules' });
    vscode.postMessage({ type: 'listOrgs' });
  </script>
</body>
</html>`;
}

function createNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return [...Array(16)].map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
}
