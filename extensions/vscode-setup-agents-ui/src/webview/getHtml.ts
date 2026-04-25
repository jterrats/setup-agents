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
    #console.placeholder { opacity: 0.5; font-style: italic; }
    .error-line { color: var(--vscode-errorForeground); background: var(--vscode-inputValidation-errorBackground, rgba(255,0,0,0.1)); padding: 2px 4px; border-radius: 3px; display: inline; }
  </style>
</head>
<body>
  <div class="header">
    <img src="${toolkitUri}" alt="logo" />
    <strong>Setup Agents UI</strong>
  </div>

  <div class="card" id="updateCard">
    <h3>Update Agent Rules</h3>
    <p class="muted" id="updateStatus">Checking for updates...</p>
    <div id="updateActions" style="display:none">
      <p class="muted" id="updateCount"></p>
      <button id="updateNowBtn">Update Now</button>
    </div>
    <div id="updateResult" style="display:none"></div>
  </div>

  <div class="card">
    <h3>Guided Setup</h3>
    <div id="tools" class="muted">Detecting tools...</div>
    <div class="profiles" id="profiles"></div>
    <div class="row" style="margin-top:4px">
      <label style="display:flex;align-items:center;gap:4px"><input type="radio" name="scopeRadio" value="project" checked /> Project scope (.cursor/rules/)</label>
      <label style="display:flex;align-items:center;gap:4px"><input type="radio" name="scopeRadio" value="user" /> User scope (~/.cursor/rules/)</label>
    </div>
    <div class="row">
      <label><input type="checkbox" id="forceCheck" /> --force</label>
      <select id="rulesSelect">
        <option value="">All detected tools</option>
        <option value="cursor">cursor</option>
        <option value="vscode">vscode</option>
        <option value="codex">codex</option>
        <option value="agentforce">agentforce</option>
        <option value="claude">claude</option>
      </select>
      <button id="runLocalBtn">Apply Configuration</button>
    </div>
    <div id="console" class="placeholder" aria-live="polite">Output will appear here...</div>
  </div>

  <div class="card">
    <h3>Profiles</h3>
    <select id="profileDetailsSelect"></select>
    <p class="muted" id="profileDetailsText"></p>
  </div>

  <div class="card" id="mcpCard">
    <h3>MCP Configuration</h3>
    <p class="muted" style="font-size:0.8em;margin-top:0">Integrations are filtered based on the profiles selected in Guided Setup above.</p>
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
    <hr style="border:none;border-top:1px solid var(--vscode-editorWidget-border);margin:12px 0" />
    <h4 style="margin:0 0 4px">Third-Party Integrations</h4>
    <p class="muted" id="integrationsHint" style="font-size:0.8em">Select profiles above to see available integrations.</p>
    <div id="integrationsGrid" class="profiles" style="display:none"></div>
    <div id="integrationsCreds" style="display:none"></div>
    <div class="row" id="integrationsActions" style="display:none">
      <label><input type="checkbox" id="integrationsGlobal" /> Global (~/.cursor/mcp.json)</label>
      <button id="integrationsConfigureBtn" disabled>Configure Integrations</button>
    </div>
    <div id="integrationsResult" style="display:none"></div>
  </div>

  <div class="card">
    <h3>Rule Management</h3>
    <div class="row">
      <select id="ruleToolSelect">
        <option value="cursor">cursor</option>
        <option value="agentforce">agentforce</option>
        <option value="claude">claude</option>
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

    const appendConsole = (line, isError) => {
      if (consoleEl.classList.contains('placeholder')) {
        consoleEl.textContent = '';
        consoleEl.classList.remove('placeholder');
      }
      if (isError) {
        const span = document.createElement('span');
        span.className = 'error-line';
        span.textContent = line;
        consoleEl.appendChild(span);
      } else {
        consoleEl.textContent += line;
      }
      consoleEl.scrollTop = consoleEl.scrollHeight;
    };

    const selectedProfiles = () => {
      return [...profilesEl.querySelectorAll('input[type=checkbox]:checked')].map((n) => n.value);
    };

    document.getElementById('runLocalBtn').addEventListener('click', () => {
      const btn = document.getElementById('runLocalBtn');
      btn.disabled = true;
      btn.textContent = 'Running...';
      const scopeRadio = document.querySelector('input[name="scopeRadio"]:checked');
      const scope = scopeRadio ? scopeRadio.value : 'project';
      vscode.postMessage({
        type: 'runLocal',
        payload: {
          profiles: selectedProfiles(),
          force: document.getElementById('forceCheck').checked,
          rules: document.getElementById('rulesSelect').value || undefined,
          scope: scope
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
      const btn = document.getElementById('importUrlBtn');
      btn.disabled = true;
      btn.textContent = 'Importing...';
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
      if (message.type === 'commandComplete') {
        appendConsole(\`\\n[done] \${message.payload.command} -> code \${message.payload.code}\\n\`);
        const runBtn = document.getElementById('runLocalBtn');
        runBtn.disabled = false;
        runBtn.textContent = 'Apply Configuration';
      }
      if (message.type === 'rulesResult') {
        rulesListSelect.innerHTML = '';
        if (message.payload.length === 0) {
          const option = document.createElement('option');
          option.value = '';
          option.textContent = 'No rules found';
          option.disabled = true;
          rulesListSelect.appendChild(option);
        } else {
          for (const rule of message.payload) {
            const option = document.createElement('option');
            option.value = rule.path;
            option.textContent = \`\${rule.relativePath} [\${rule.scope}]\`;
            rulesListSelect.appendChild(option);
          }
        }
      }
      if (message.type === 'ruleContent') {
        ruleEditor.value = message.payload.content;
      }
      if (message.type === 'operationError') {
        appendConsole(\`[error] \${message.payload.message}\\n\`, true);
        const importBtn = document.getElementById('importUrlBtn');
        importBtn.disabled = false;
        importBtn.textContent = 'Import URL';
      }
      if (message.type === 'operationSuccess') {
        appendConsole(\`[ok] \${message.payload.message}\\n\`);
        const importBtn = document.getElementById('importUrlBtn');
        importBtn.disabled = false;
        importBtn.textContent = 'Import URL';
      }

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
        const mcpBtn = document.getElementById('mcpConfigureBtn');
        mcpBtn.disabled = false;
        mcpBtn.textContent = 'Configure MCP';
      }

      if (message.type === 'integrationsConfigured') {
        const el = document.getElementById('integrationsResult');
        el.style.display = '';
        el.innerHTML = '<p style="color:var(--vscode-charts-green)">Integrations configured: '
          + message.payload.serversAdded.join(', ') + '</p>';
        appendConsole('[ok] Integrations configured: ' + message.payload.serversAdded.join(', ') + '\\n');
        const btn = document.getElementById('integrationsConfigureBtn');
        btn.disabled = false;
        btn.textContent = 'Configure Integrations';
      }

      if (message.type === 'updateCheckResult') {
        const stale = message.payload.staleFiles;
        const statusEl = document.getElementById('updateStatus');
        const actionsEl = document.getElementById('updateActions');
        const countEl = document.getElementById('updateCount');
        if (stale.length === 0) {
          statusEl.textContent = 'All agent rules are up to date.';
          statusEl.style.color = 'var(--vscode-charts-green)';
          actionsEl.style.display = 'none';
        } else {
          statusEl.style.display = 'none';
          actionsEl.style.display = '';
          countEl.textContent = stale.length + ' stale file(s) detected.';
        }
      }

      if (message.type === 'updateComplete') {
        const resultEl = document.getElementById('updateResult');
        const actionsEl = document.getElementById('updateActions');
        const btn = document.getElementById('updateNowBtn');
        btn.disabled = false;
        btn.textContent = 'Update Now';
        actionsEl.style.display = 'none';
        resultEl.style.display = '';
        resultEl.innerHTML = '<p style="color:var(--vscode-charts-green)">Update complete.</p>';
        appendConsole('[ok] Agent rules updated.\\n');
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
      const btn = document.getElementById('mcpConfigureBtn');
      btn.disabled = true;
      btn.textContent = 'Configuring...';
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

    // Third-party integrations
    const MCP_INTEGRATIONS = ${JSON.stringify(
      [
        { id: 'figma', label: 'Figma', profiles: ['ux', 'ba', 'architect'], envVars: [], transport: 'http' },
        {
          id: 'jira',
          label: 'Jira Cloud',
          profiles: ['pm', 'ba', 'developer', 'qa', 'devops'],
          envVars: [
            { name: 'JIRA_BASE_URL', label: 'Jira URL', secret: false },
            { name: 'JIRA_EMAIL', label: 'Email', secret: false },
            { name: 'JIRA_API_TOKEN', label: 'API Token', secret: true },
          ],
          transport: 'stdio',
        },
      ],
      null,
      2
    )};

    function renderIntegrations() {
      const profiles = selectedProfiles();
      const relevant = MCP_INTEGRATIONS.filter(i => i.profiles.some(p => profiles.includes(p)));
      const grid = document.getElementById('integrationsGrid');
      const creds = document.getElementById('integrationsCreds');
      const actions = document.getElementById('integrationsActions');
      const hint = document.getElementById('integrationsHint');
      const btn = document.getElementById('integrationsConfigureBtn');

      if (relevant.length === 0) {
        grid.style.display = 'none';
        creds.style.display = 'none';
        actions.style.display = 'none';
        hint.textContent = profiles.length === 0
          ? 'Select profiles above to see available integrations.'
          : 'No third-party integrations match the selected profiles.';
        hint.style.display = '';
        return;
      }

      hint.style.display = 'none';
      grid.style.display = '';
      actions.style.display = '';
      grid.innerHTML = '';
      creds.innerHTML = '';

      state.selectedIntegrations = state.selectedIntegrations || [];

      for (const integ of relevant) {
        const isChecked = state.selectedIntegrations.includes(integ.id);
        const card = document.createElement('label');
        card.className = 'profile-card' + (isChecked ? ' selected' : '');
        card.innerHTML = '<input type="checkbox" value="' + integ.id + '" ' + (isChecked ? 'checked' : '') + ' />'
          + '<div class="profile-info"><span class="profile-name">' + integ.label + '</span>'
          + '<span class="profile-desc">' + integ.transport.toUpperCase() + (integ.envVars.length ? ' · ' + integ.envVars.length + ' credential(s)' : ' · No credentials needed') + '</span></div>';
        const cb = card.querySelector('input');
        cb.addEventListener('change', () => {
          card.classList.toggle('selected', cb.checked);
          state.selectedIntegrations = [...grid.querySelectorAll('input:checked')].map(n => n.value);
          updateCredentialFields();
          btn.disabled = state.selectedIntegrations.length === 0;
        });
        grid.appendChild(card);
      }
      updateCredentialFields();
      btn.disabled = (state.selectedIntegrations || []).length === 0;
    }

    function updateCredentialFields() {
      const creds = document.getElementById('integrationsCreds');
      creds.innerHTML = '';
      const selected = state.selectedIntegrations || [];
      const withCreds = MCP_INTEGRATIONS.filter(i => selected.includes(i.id) && i.envVars.length > 0);
      if (withCreds.length === 0) { creds.style.display = 'none'; return; }
      creds.style.display = '';
      for (const integ of withCreds) {
        const section = document.createElement('div');
        section.style.marginBottom = '8px';
        section.innerHTML = '<strong style="font-size:0.85em">' + integ.label + ' Credentials</strong>';
        for (const v of integ.envVars) {
          const row = document.createElement('div');
          row.className = 'row';
          row.innerHTML = '<label style="font-size:0.82em;min-width:80px">' + v.label + '</label>'
            + '<input type="' + (v.secret ? 'password' : 'text') + '" data-integration="' + integ.id + '" data-env="' + v.name + '" placeholder="' + v.label + '" style="flex:1;min-width:160px" />';
          section.appendChild(row);
        }
        creds.appendChild(section);
      }
    }

    document.getElementById('integrationsConfigureBtn').addEventListener('click', () => {
      const ids = state.selectedIntegrations || [];
      if (ids.length === 0) return;
      const btn = document.getElementById('integrationsConfigureBtn');
      btn.disabled = true;
      btn.textContent = 'Configuring...';
      const credentials = {};
      for (const id of ids) {
        credentials[id] = {};
        const inputs = document.querySelectorAll('input[data-integration="' + id + '"]');
        inputs.forEach(inp => { credentials[id][inp.dataset.env] = inp.value; });
      }
      vscode.postMessage({
        type: 'configureIntegrations',
        payload: { ids, credentials, global: document.getElementById('integrationsGlobal').checked }
      });
    });

    // Re-render integrations on profile changes
    new MutationObserver(() => renderIntegrations()).observe(profilesEl, { childList: true, subtree: true, attributes: true });

    // Update card
    document.getElementById('updateNowBtn').addEventListener('click', () => {
      const btn = document.getElementById('updateNowBtn');
      btn.disabled = true;
      btn.textContent = 'Updating...';
      vscode.postMessage({ type: 'runUpdate' });
    });

    vscode.postMessage({ type: 'bootstrap' });
    vscode.postMessage({ type: 'listRules' });
    vscode.postMessage({ type: 'listOrgs' });
    vscode.postMessage({ type: 'checkForUpdates' });
  </script>
</body>
</html>`;
}

function createNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return [...Array(16)].map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
}
