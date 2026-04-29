/**
 * Message handlers for host → webview communication.
 * Each handler receives a payload and mutates the DOM accordingly.
 *
 * @param {object} deps - Shared dependencies injected from webview.js
 */
// eslint-disable-next-line no-unused-vars -- loaded via <script> tag, consumed by webview.js
function createMessageHandlers(deps) {
  const { state, vscode, esc, appendConsole, resetButton, createSelectableCard, renderIntegrations, selectedProfiles } =
    deps;

  const toolsEl = document.getElementById('tools');
  const profilesEl = document.getElementById('profiles');
  const profileDetailsSelect = document.getElementById('profileDetailsSelect');
  const profileDetailsText = document.getElementById('profileDetailsText');
  const rulesListSelect = document.getElementById('rulesListSelect');
  const ruleEditor = document.getElementById('ruleEditor');

  return {
    pluginStatus(payload) {
      document.getElementById('cliCheckBanner').style.display = 'none';
      const mount = document.getElementById('cliBannerMount');
      mount.innerHTML = '';

      if (payload.installed) return;

      const banner = document.createElement('div');

      if (payload.noWorkspace) {
        banner.className = 'banner-warning';
        banner.innerHTML =
          '<strong>No Workspace Open</strong>' +
          '<p class="muted" style="margin:4px 0">Open a Salesforce project folder in VS Code to use Setup Agents.</p>' +
          '<p class="muted" style="margin:4px 0;font-size:0.82em">File → Open Folder… and select your project root.</p>';
        mount.appendChild(banner);
        return;
      }

      if (payload.sfCliMissing) {
        banner.className = 'banner-error';
        banner.innerHTML =
          '<strong>Salesforce CLI Not Found</strong>' +
          '<p class="muted" style="margin:4px 0">The Salesforce CLI (<code>sf</code>) must be installed before using this extension.</p>' +
          '<p class="muted" style="margin:4px 0;font-size:0.82em">Install from <strong>https://developer.salesforce.com/tools/salesforcecli</strong> or run: <code>npm install -g @salesforce/cli</code></p>' +
          '<button id="sfCliRetryBtn" style="margin-top:6px">Retry Detection</button>';
        mount.appendChild(banner);
        document.getElementById('sfCliRetryBtn').addEventListener('click', () => {
          mount.innerHTML = '';
          document.getElementById('cliCheckBanner').style.display = '';
          vscode.postMessage({ type: 'bootstrap' });
        });
        return;
      }

      banner.className = 'banner-warning';
      const statusId = 'pluginInstallStatus';
      banner.innerHTML =
        '<strong>CLI Plugin Not Installed</strong>' +
        '<p class="muted" style="margin:4px 0">The <code>@jterrats/setup-agents</code> Salesforce CLI plugin is required. Install it to enable all features.</p>' +
        '<button id="installPluginBtn" style="margin-top:6px">' +
        (payload.installing ? 'Installing...' : 'Install Plugin') +
        '</button>' +
        '<span class="muted" id="' +
        statusId +
        '" style="margin-left:8px;' +
        (payload.installing ? '' : 'display:none') +
        '">' +
        (payload.installing ? 'This may take a minute...' : '') +
        '</span>';
      mount.appendChild(banner);
      const btn = document.getElementById('installPluginBtn');
      if (payload.installing) btn.disabled = true;
      btn.addEventListener('click', () => {
        btn.disabled = true;
        btn.textContent = 'Installing...';
        const s = document.getElementById(statusId);
        s.style.display = '';
        s.textContent = 'This may take a minute...';
        vscode.postMessage({ type: 'installPlugin' });
      });
    },

    bootstrapResult(payload) {
      const TOOL_LABELS = {
        cursor: 'Cursor',
        vscode: 'VS Code',
        codex: 'Codex',
        agentforce: 'Agentforce',
        claude: 'Claude',
      };
      toolsEl.innerHTML = '';
      const detected = payload.tools.filter((t) => t.detected);
      const notDetected = payload.tools.filter((t) => !t.detected);
      for (const t of detected) {
        const badge = document.createElement('span');
        badge.style.cssText =
          'display:inline-block;margin:0 4px 3px 0;padding:2px 6px;border-radius:4px;font-size:0.82em;background:var(--vscode-badge-background);color:var(--vscode-badge-foreground)';
        badge.textContent = '\u2713 ' + (TOOL_LABELS[t.id] || t.id);
        badge.title = 'Detected: ' + t.reason;
        toolsEl.appendChild(badge);
      }
      if (notDetected.length > 0) {
        const hint = document.createElement('span');
        hint.style.cssText =
          'display:inline-block;margin:0 4px 3px 0;padding:2px 6px;font-size:0.78em;opacity:0.5;cursor:help';
        hint.textContent = '+' + notDetected.length + ' not detected';
        hint.title = notDetected.map((t) => (TOOL_LABELS[t.id] || t.id) + ' (' + t.reason + ')').join('\n');
        toolsEl.appendChild(hint);
      }
      state.profiles = payload.profiles;
      const activeFromDisk = payload.activeProfiles || [];
      const selections = activeFromDisk.length > 0 ? activeFromDisk : state.selectedProfileIds;
      state.selectedProfileIds = selections;
      vscode.setState({ selectedProfileIds: selections });
      profilesEl.innerHTML = '';
      profileDetailsSelect.innerHTML = '';
      for (const profile of payload.profiles) {
        createSelectableCard(profilesEl, {
          value: profile.id,
          label: profile.label,
          description: profile.description,
          checked: selections.includes(profile.id),
          onChange: () => {
            state.selectedProfileIds = selectedProfiles();
            vscode.setState({ selectedProfileIds: state.selectedProfileIds });
            renderIntegrations();
          },
        });
        const option = document.createElement('option');
        option.value = profile.id;
        option.textContent = profile.label;
        profileDetailsSelect.appendChild(option);
      }
      if (payload.profiles[0]) {
        profileDetailsSelect.value = payload.profiles[0].id;
        profileDetailsText.textContent = payload.profiles[0].description + ' | Rule: ' + payload.profiles[0].ruleFile;
      }
      renderIntegrations();
    },

    commandOutput(payload) {
      appendConsole(payload.text);
    },

    commandComplete(payload) {
      appendConsole('\n[done] ' + payload.command + ' -> code ' + payload.code + '\n');
      resetButton('runLocalBtn', 'Apply Configuration');
    },

    rulesResult(payload) {
      rulesListSelect.innerHTML = '';
      if (payload.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No rules found';
        option.disabled = true;
        rulesListSelect.appendChild(option);
      } else {
        for (const rule of payload) {
          const option = document.createElement('option');
          option.value = rule.path;
          option.textContent = rule.relativePath + ' [' + rule.scope + ']';
          rulesListSelect.appendChild(option);
        }
      }
    },

    ruleContent(payload) {
      ruleEditor.value = payload.content;
    },

    operationError(payload) {
      appendConsole('[error] ' + payload.message + '\n', true);
      resetButton('importUrlBtn', 'Import URL');
    },

    operationSuccess(payload) {
      appendConsole('[ok] ' + payload.message + '\n');
      resetButton('importUrlBtn', 'Import URL');
    },

    orgsResult(payload) {
      const { orgs, sfExtensionInstalled } = payload;
      const mcpOrgsSection = document.getElementById('mcpOrgsSection');
      const mcpLoginSection = document.getElementById('mcpLoginSection');
      const mcpOrgsEl = document.getElementById('mcpOrgs');
      const mcpConfigureBtn = document.getElementById('mcpConfigureBtn');
      const mcpStatus = document.getElementById('mcpStatus');

      if (orgs.length > 0) {
        const connected = state.mcpConfiguredServers || [];
        mcpStatus.textContent = orgs.length + ' org(s) found';
        mcpOrgsSection.style.display = '';
        mcpLoginSection.style.display = 'none';
        mcpOrgsEl.innerHTML = '';
        for (const org of orgs) {
          const alreadyConnected = connected.includes('salesforce-' + org.alias);
          const isChecked = alreadyConnected || state.mcpSelectedOrgs.includes(org.alias);
          const statusLabel = alreadyConnected ? ' (connected)' : '';
          const card = createSelectableCard(mcpOrgsEl, {
            value: org.alias,
            label: org.alias + statusLabel,
            description: '',
            checked: isChecked,
            onChange: (checked) => {
              card.setAttribute('aria-checked', String(checked));
              state.mcpSelectedOrgs = [...mcpOrgsEl.querySelectorAll('input:checked')].map((n) => n.value);
              mcpConfigureBtn.disabled = state.mcpSelectedOrgs.length === 0;
            },
          });
          card.setAttribute('role', 'checkbox');
          card.setAttribute('aria-checked', String(isChecked));
          card.setAttribute('tabindex', '0');
          card.title = org.username;
        }
        state.mcpSelectedOrgs = [...mcpOrgsEl.querySelectorAll('input:checked')].map((n) => n.value);
        mcpConfigureBtn.disabled = state.mcpSelectedOrgs.length === 0;
      } else {
        mcpStatus.textContent = sfExtensionInstalled
          ? 'No orgs found. The Salesforce Extension will handle the login.'
          : 'No orgs found. Log in to connect one.';
        mcpOrgsSection.style.display = 'none';
        mcpLoginSection.style.display = '';
      }
    },

    orgLoginResult(payload) {
      const loginStatus = document.getElementById('mcpLoginStatus');
      resetButton('mcpLoginBtn', 'Authenticate Org');
      loginStatus.style.display = '';
      if (payload.success) {
        loginStatus.textContent = 'Authenticated: ' + payload.alias;
        loginStatus.className = 'muted success-text';
      } else {
        loginStatus.textContent = 'Authentication failed. Try again.';
        loginStatus.style.color = 'var(--vscode-errorForeground)';
      }
    },

    mcpConfigured(payload) {
      const mcpResult = document.getElementById('mcpResult');
      mcpResult.style.display = '';
      mcpResult.innerHTML =
        '<p class="success-text">MCP configured in <code>' +
        esc(payload.mcpFile) +
        '</code></p>' +
        '<p class="muted">Servers: ' +
        payload.serversAdded.map(esc).join(', ') +
        '</p>';
      appendConsole('[ok] MCP configured: ' + payload.serversAdded.join(', ') + '\n');
      resetButton('mcpConfigureBtn', 'Connect Selected Orgs');
    },

    integrationsConfigured(payload) {
      const el = document.getElementById('integrationsResult');
      el.style.display = '';
      el.innerHTML =
        '<p class="success-text">Integrations configured: ' + payload.serversAdded.map(esc).join(', ') + '</p>';
      appendConsole('[ok] Integrations configured: ' + payload.serversAdded.join(', ') + '\n');
      resetButton('integrationsConfigureBtn', 'Connect Integrations');
    },

    customIntegrationAdded(payload) {
      const resultEl = document.getElementById('customMcpResult');
      resultEl.style.display = '';
      resultEl.innerHTML =
        '<p class="success-text">Server <strong>' + esc(payload.serverName) + '</strong> added to mcp.json.</p>';
      appendConsole('[ok] Custom MCP server added: ' + payload.serverName + '\n');
      resetButton('customMcpAddBtn', 'Add Server');
    },

    updateCheckResult(payload) {
      const stale = payload.staleFiles;
      const statusEl = document.getElementById('updateStatus');
      const actionsEl = document.getElementById('updateActions');
      const countEl = document.getElementById('updateCount');
      if (stale.length === 0) {
        statusEl.textContent = 'All agent rules are up to date.';
        statusEl.className = 'muted success-text';
        actionsEl.style.display = 'none';
      } else {
        statusEl.style.display = 'none';
        actionsEl.style.display = '';
        countEl.textContent = stale.length + ' stale file(s) detected.';
      }
    },

    updateComplete() {
      const resultEl = document.getElementById('updateResult');
      const actionsEl = document.getElementById('updateActions');
      resetButton('updateNowBtn', 'Update Now');
      actionsEl.style.display = 'none';
      resultEl.style.display = '';
      resultEl.innerHTML = '<p class="success-text">Update complete.</p>';
      appendConsole('[ok] Agent rules updated.\n');
    },

    mcpSyncResult(payload) {
      const servers = payload.configuredServers || [];
      state.mcpConfiguredServers = servers;
      state.selectedIntegrations = servers.filter(
        (s) => !s.startsWith('salesforce-') && (window.__INTEGRATIONS__ || []).some((i) => i.id === s)
      );
      renderIntegrations();
    },
  };
}
