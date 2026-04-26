/**
 * Main webview entry point. Bootstraps shared helpers, wires up the
 * integration UI and message handlers (loaded from separate <script> files),
 * and binds all button event listeners.
 */
(function () {
  const vscode = acquireVsCodeApi();
  const persisted = vscode.getState() || {};
  const DEFAULT_PROFILE = 'developer';
  const state = {
    profiles: [],
    selectedRulePath: null,
    selectedProfileIds: persisted.selectedProfileIds || [DEFAULT_PROFILE],
    mcpSelectedOrgs: [],
    selectedIntegrations: [],
    mcpConfiguredServers: [],
  };

  // ─── DOM refs ─────────────────────────────────────────────────────────────
  const profilesEl = document.getElementById('profiles');
  const consoleEl = document.getElementById('console');
  const rulesListSelect = document.getElementById('rulesListSelect');
  const profileDetailsSelect = document.getElementById('profileDetailsSelect');
  const profileDetailsText = document.getElementById('profileDetailsText');
  const ruleEditor = document.getElementById('ruleEditor');

  // ─── Shared helpers ─────────────────────────────────────────────────────

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function selectedProfiles() {
    return [...profilesEl.querySelectorAll('input[type=checkbox]:checked')].map((n) => n.value);
  }

  function appendConsole(line, isError) {
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
  }

  function createSelectableCard(container, { value, label, description, checked, onChange }) {
    const card = document.createElement('label');
    card.className = 'profile-card' + (checked ? ' selected' : '');
    card.title = label + (description ? ' — ' + description : '');
    card.innerHTML =
      '<input type="checkbox" value="' + esc(value) + '" ' + (checked ? 'checked' : '') + ' />' +
      '<div class="profile-info"><span class="profile-name">' + esc(label) + '</span>' +
      '<span class="profile-desc">' + esc(description) + '</span></div>';
    const cb = card.querySelector('input');
    cb.addEventListener('change', () => {
      card.classList.toggle('selected', cb.checked);
      if (onChange) onChange(cb.checked, cb);
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        cb.checked = !cb.checked;
        cb.dispatchEvent(new Event('change'));
      }
    });
    container.appendChild(card);
    return card;
  }

  function setButtonLoading(id, loadingText) {
    const btn = document.getElementById(id);
    btn.disabled = true;
    btn.textContent = loadingText;
    return btn;
  }

  function resetButton(id, text) {
    const btn = document.getElementById(id);
    btn.disabled = false;
    btn.textContent = text;
    return btn;
  }

  // ─── Initialize extracted modules ──────────────────────────────────────
  const deps = { state, vscode, esc, appendConsole, resetButton, createSelectableCard, selectedProfiles };

  const integrationsUI = createIntegrationsUI(deps);
  deps.renderIntegrations = integrationsUI.renderIntegrations;

  const messageHandlers = createMessageHandlers(deps);

  // ─── Message dispatch ──────────────────────────────────────────────────
  window.addEventListener('message', (event) => {
    const message = event.data;
    const handler = messageHandlers[message.type];
    if (handler) handler(message.payload);
  });

  // ─── Button event listeners ────────────────────────────────────────────

  document.getElementById('runLocalBtn').addEventListener('click', () => {
    setButtonLoading('runLocalBtn', 'Running...');
    const scopeRadio = document.querySelector('input[name="scopeRadio"]:checked');
    vscode.postMessage({
      type: 'runLocal',
      payload: {
        profiles: selectedProfiles(),
        force: document.getElementById('forceCheck').checked,
        rules: document.getElementById('rulesSelect').value || undefined,
        scope: scopeRadio ? scopeRadio.value : 'project',
      },
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
    vscode.postMessage({ type: 'saveRule', payload: { path: state.selectedRulePath, content: ruleEditor.value } });
  });

  document.getElementById('importUrlBtn').addEventListener('click', () => {
    const url = document.getElementById('importUrlInput').value.trim();
    if (!url) return;
    setButtonLoading('importUrlBtn', 'Importing...');
    vscode.postMessage({ type: 'importRuleFromUrl', payload: { url, tool: document.getElementById('ruleToolSelect').value } });
  });

  document.getElementById('importFileBtn').addEventListener('click', () => {
    vscode.postMessage({ type: 'importRuleFromFile', payload: { tool: document.getElementById('ruleToolSelect').value } });
  });

  profileDetailsSelect.addEventListener('change', () => {
    const found = state.profiles.find((p) => p.id === profileDetailsSelect.value);
    profileDetailsText.textContent = found ? found.description + ' | Rule: ' + found.ruleFile : '';
  });

  document.getElementById('mcpLoginBtn').addEventListener('click', () => {
    const aliasInput = document.getElementById('mcpLoginAlias');
    const alias = aliasInput.value.trim();
    if (!alias) { aliasInput.focus(); return; }
    setButtonLoading('mcpLoginBtn', 'Authenticating...');
    document.getElementById('mcpLoginStatus').style.display = 'none';
    vscode.postMessage({ type: 'loginOrg', payload: { alias } });
  });

  document.getElementById('mcpConfigureBtn').addEventListener('click', () => {
    setButtonLoading('mcpConfigureBtn', 'Configuring...');
    vscode.postMessage({
      type: 'configureMcp',
      payload: {
        orgs: state.mcpSelectedOrgs,
        profiles: selectedProfiles(),
        allToolsets: document.getElementById('mcpAllToolsets').checked,
        global: document.getElementById('mcpGlobal').checked,
      },
    });
  });

  document.getElementById('integrationsConfigureBtn').addEventListener('click', () => {
    const ids = state.selectedIntegrations;
    if (ids.length === 0) return;
    setButtonLoading('integrationsConfigureBtn', 'Configuring...');
    const credentials = {};
    for (const id of ids) {
      credentials[id] = {};
      document.querySelectorAll('input[data-integration="' + id + '"]').forEach((inp) => {
        credentials[id][inp.dataset.env] = inp.value;
      });
    }
    vscode.postMessage({
      type: 'configureIntegrations',
      payload: { ids, credentials, global: document.getElementById('integrationsGlobal').checked },
    });
  });

  document.getElementById('installPluginBtn').addEventListener('click', () => {
    setButtonLoading('installPluginBtn', 'Installing...');
    const statusEl = document.getElementById('pluginInstallStatus');
    statusEl.style.display = '';
    statusEl.textContent = 'This may take a minute...';
    vscode.postMessage({ type: 'installPlugin' });
  });

  document.getElementById('sfCliRetryBtn').addEventListener('click', () => {
    setButtonLoading('sfCliRetryBtn', 'Checking...');
    vscode.postMessage({ type: 'bootstrap' });
  });

  document.getElementById('updateNowBtn').addEventListener('click', () => {
    setButtonLoading('updateNowBtn', 'Updating...');
    vscode.postMessage({ type: 'runUpdate' });
  });

  // ─── Bootstrap ─────────────────────────────────────────────────────────
  vscode.postMessage({ type: 'bootstrap' });
  vscode.postMessage({ type: 'listRules' });
  vscode.postMessage({ type: 'listOrgs' });
  vscode.postMessage({ type: 'checkForUpdates' });
})();
