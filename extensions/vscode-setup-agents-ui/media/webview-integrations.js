/**
 * Integrations UI: renders third-party MCP integration cards and credential fields.
 *
 * @param {object} deps - Shared dependencies injected from webview.js
 */
// eslint-disable-next-line no-unused-vars -- loaded via <script> tag, consumed by webview.js
function createIntegrationsUI(deps) {
  const { state, esc, createSelectableCard, selectedProfiles } = deps;
  const MCP_INTEGRATIONS = window.__INTEGRATIONS__ || [];

  function updateCredentialFields() {
    const creds = document.getElementById('integrationsCreds');
    creds.innerHTML = '';
    const selected = state.selectedIntegrations;
    const withCreds = MCP_INTEGRATIONS.filter((i) => selected.includes(i.id) && i.envVars.length > 0);
    if (withCreds.length === 0) {
      creds.style.display = 'none';
      return;
    }
    creds.style.display = '';
    for (const integ of withCreds) {
      const section = document.createElement('div');
      section.style.marginBottom = '8px';
      section.innerHTML = '<strong style="font-size:0.85em">' + esc(integ.label) + ' Credentials</strong>';
      for (const v of integ.envVars) {
        const row = document.createElement('div');
        row.className = 'row';
        row.innerHTML =
          '<label style="font-size:0.82em;min-width:80px">' + esc(v.label) + '</label>' +
          '<input type="' + (v.secret ? 'password' : 'text') + '" data-integration="' + esc(integ.id) +
          '" data-env="' + esc(v.name) + '" placeholder="' + esc(v.label) + '" style="flex:1;min-width:160px" />';
        section.appendChild(row);
      }
      creds.appendChild(section);
    }
  }

  function renderIntegrations() {
    const profiles = selectedProfiles();
    const relevant = MCP_INTEGRATIONS.filter((i) => i.profiles.some((p) => profiles.includes(p)));
    const grid = document.getElementById('integrationsGrid');
    const creds = document.getElementById('integrationsCreds');
    const actions = document.getElementById('integrationsActions');
    const hint = document.getElementById('integrationsHint');
    const btn = document.getElementById('integrationsConfigureBtn');

    if (relevant.length === 0) {
      grid.style.display = 'none';
      creds.style.display = 'none';
      actions.style.display = 'none';
      hint.textContent =
        profiles.length === 0
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

    for (const integ of relevant) {
      const isChecked = state.selectedIntegrations.includes(integ.id);
      const desc =
        integ.transport.toUpperCase() +
        (integ.envVars.length ? ' \u00b7 ' + integ.envVars.length + ' credential(s)' : ' \u00b7 No credentials needed');
      createSelectableCard(grid, {
        value: integ.id,
        label: integ.label,
        description: desc,
        checked: isChecked,
        onChange: () => {
          state.selectedIntegrations = [...grid.querySelectorAll('input:checked')].map((n) => n.value);
          updateCredentialFields();
          btn.disabled = state.selectedIntegrations.length === 0;
        },
      });
    }
    updateCredentialFields();
    btn.disabled = state.selectedIntegrations.length === 0;
  }

  return { renderIntegrations, updateCredentialFields };
}
