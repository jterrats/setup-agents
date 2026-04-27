/**
 * Demo recording spec: walks through the extension UI to generate
 * video recordings that can be converted to GIFs for documentation.
 *
 * Run with: npx playwright test --config playwright.demo.config.ts
 * Convert: npm run demo:gifs
 */
import { test, expect, type Page } from '@playwright/test';
import { ALL_PROFILES, MCP_INTEGRATIONS } from '../../constants';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const DEMO_ALIAS_FILE = join(__dirname, 'fixtures', 'sf-aliases-demo.json');
const demoAliases: Record<string, string> = JSON.parse(readFileSync(DEMO_ALIAS_FILE, 'utf8')).orgs;
const DEMO_ORGS = Object.entries(demoAliases).map(([alias, username]) => ({ alias, username }));

function buildFullDemoHtml(): string {
  const profilesJson = JSON.stringify(ALL_PROFILES);
  const integrationsJson = JSON.stringify(
    MCP_INTEGRATIONS.map((i) => ({
      id: i.id,
      label: i.label,
      profiles: i.profiles,
      envVars: i.envVars,
      transport: i.transport,
    }))
  );
  const orgsJson = JSON.stringify(DEMO_ORGS);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Setup Agents UI</title>
  <style>
    :root {
      --vscode-font-family: system-ui, -apple-system, sans-serif;
      --vscode-foreground: #cccccc;
      --vscode-editorWidget-border: #454545;
      --vscode-focusBorder: #007fd4;
      --vscode-list-activeSelectionBackground: rgba(4,57,94,.75);
      --vscode-list-activeSelectionForeground: #fff;
      --vscode-input-background: #3c3c3c;
      --vscode-input-foreground: #cccccc;
      --vscode-input-border: #3c3c3c;
      --vscode-textCodeBlock-background: #1e1e1e;
      --vscode-badge-background: #4d4d4d;
      --vscode-badge-foreground: #cccccc;
      --vscode-charts-green: #89d185;
      --vscode-errorForeground: #f48771;
      --vscode-descriptionForeground: #9d9d9d;
      --vscode-editorWarning-foreground: orange;
      --vscode-inputValidation-warningBackground: rgba(255,165,0,0.15);
      --vscode-inputValidation-warningBorder: orange;
      --vscode-inputValidation-errorBackground: rgba(255,0,0,0.12);
      --vscode-inputValidation-errorBorder: #f48771;
    }
    body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); padding: 12px; background: #1e1e1e; margin: 0; }
    .header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
    .header img { width: 18px; height: 18px; }
    .card { border: 1px solid var(--vscode-editorWidget-border); border-radius: 8px; padding: 10px; margin-bottom: 12px; }
    .row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 8px; }
    .profiles { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 8px 0; }
    .profile-card { display: flex; align-items: flex-start; gap: 6px; padding: 6px 8px; border: 1px solid var(--vscode-editorWidget-border); border-radius: 6px; cursor: pointer; transition: all 0.2s ease; min-width: 0; overflow: hidden; }
    .profile-card:hover { border-color: var(--vscode-focusBorder); }
    .profile-card.selected { border-color: var(--vscode-focusBorder); background: var(--vscode-list-activeSelectionBackground); color: var(--vscode-list-activeSelectionForeground); }
    .profile-card input[type=checkbox] { margin-top: 2px; flex-shrink: 0; }
    .profile-card .profile-info { display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
    .profile-card .profile-name { font-weight: bold; font-size: 0.92em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .profile-card .profile-desc { font-size: 0.8em; opacity: 0.75; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .profile-card .profile-desc:empty { display: none; }
    .muted { opacity: 0.8; font-size: 0.9em; }
    .tool-status { font-size: 0.82em; opacity: 0.75; line-height: 1.5; }
    .tooltip-label { cursor: help; border-bottom: 1px dotted var(--vscode-descriptionForeground); }
    select, input, button { background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 4px; padding: 6px 8px; max-width: 100%; }
    button { cursor: pointer; }
    #console { white-space: pre-wrap; min-height: 80px; max-height: 160px; overflow-y: auto; background: var(--vscode-textCodeBlock-background); border-radius: 6px; padding: 8px; font-size: 0.82em; }
    #console.placeholder { opacity: 0.5; font-style: italic; }
    .banner-error { background: var(--vscode-inputValidation-errorBackground); border: 1px solid var(--vscode-inputValidation-errorBorder); border-radius: 8px; padding: 10px; margin-bottom: 12px; }
    .banner-error strong { color: var(--vscode-errorForeground); }
    .banner-warning { background: var(--vscode-inputValidation-warningBackground); border: 1px solid var(--vscode-inputValidation-warningBorder); border-radius: 8px; padding: 10px; margin-bottom: 12px; }
    .banner-warning strong { color: var(--vscode-editorWarning-foreground); }
    .success-text { color: var(--vscode-charts-green); }
    hr { border: none; border-top: 1px solid var(--vscode-editorWidget-border); margin: 12px 0; }
  </style>
</head>
<body>
  <div class="header">
    <strong style="font-size:1.1em">⚙️ Setup Agents UI</strong>
  </div>

  <div class="card" id="updateCard">
    <h3 style="margin-top:0">Update Agent Rules</h3>
    <p class="muted" style="font-size:0.8em;margin-top:0">Checks if your AI assistant rules are outdated and lets you update them in one click.</p>
    <p class="muted success-text" id="updateStatus">✓ All agent rules are up to date.</p>
  </div>

  <div class="card">
    <h3 style="margin-top:0">Guided Setup</h3>
    <p class="muted" style="font-size:0.8em;margin-top:0">Select the role profiles that match your team, then apply to generate AI assistant rules for your project.</p>
    <div id="tools" class="tool-status"></div>
    <div class="profiles" id="profiles"></div>
    <p class="muted" style="font-size:0.78em;margin:4px 0 2px"><strong>Where to save the rules:</strong></p>
    <div class="row" style="margin-top:0">
      <label style="display:flex;align-items:center;gap:4px"><input type="radio" name="scopeRadio" value="project" checked /> <span class="tooltip-label">This project only</span></label>
      <label style="display:flex;align-items:center;gap:4px"><input type="radio" name="scopeRadio" value="user" /> <span class="tooltip-label">All my projects</span></label>
    </div>
    <div class="row">
      <label><input type="checkbox" id="forceCheck" /> <span class="tooltip-label">Replace existing</span></label>
      <select id="rulesSelect"><option value="">All detected tools</option></select>
      <button id="runLocalBtn">Apply Configuration</button>
    </div>
    <div id="console" class="placeholder">Output will appear here...</div>
  </div>

  <div class="card" id="mcpCard">
    <h3 style="margin-top:0">MCP Configuration</h3>
    <p class="muted" style="font-size:0.8em;margin-top:0">Connect your Salesforce orgs so AI assistants can query, deploy, and manage your metadata directly.</p>
    <p class="muted" style="font-size:0.78em;margin:2px 0"><strong>Select the orgs to connect:</strong></p>
    <p class="muted" id="mcpStatus"></p>
    <div id="mcpOrgsSection" style="display:none">
      <div class="profiles" id="mcpOrgs" role="group" aria-label="Org selection"></div>
      <div class="row">
        <label><input type="checkbox" id="mcpGlobal" /> <span class="tooltip-label">Apply to all projects</span></label>
        <label><input type="checkbox" id="mcpAllToolsets" /> <span class="tooltip-label">Include all profile tools</span></label>
      </div>
      <div class="row">
        <button id="mcpConfigureBtn" disabled>Connect Selected Orgs</button>
      </div>
    </div>
    <div id="mcpResult" style="display:none"></div>
    <hr />
    <h4 style="margin:0 0 4px">Third-Party Integrations</h4>
    <p class="muted" id="integrationsHint" style="font-size:0.8em">Select profiles in Guided Setup to see available integrations.</p>
    <div id="integrationsGrid" class="profiles" style="display:none"></div>
    <div id="integrationsCreds" style="display:none"></div>
    <div class="row" id="integrationsActions" style="display:none">
      <label><input type="checkbox" id="integrationsGlobal" /> <span class="tooltip-label">Apply to all projects</span></label>
      <button id="integrationsConfigureBtn" disabled>Connect Integrations</button>
    </div>
    <div id="integrationsResult" style="display:none"></div>
    <hr />
    <h4 style="margin:0 0 4px">Custom MCP Server</h4>
    <p class="muted" style="font-size:0.8em;margin:0 0 6px">Add any MCP server not listed above.</p>
    <div class="row">
      <input id="customMcpName" type="text" placeholder="Server name (e.g. my-tool)" style="flex:1;min-width:120px" />
      <select id="customMcpTransport"><option value="stdio">stdio</option><option value="http">http</option></select>
    </div>
    <div id="customMcpStdioFields">
      <div class="row">
        <input id="customMcpCommand" type="text" placeholder="Command (e.g. npx)" style="flex:1;min-width:120px" />
        <input id="customMcpArgs" type="text" placeholder="Args (space-separated)" style="flex:2;min-width:160px" />
      </div>
      <div id="customMcpEnvRows"></div>
      <div class="row"><button id="customMcpAddEnvBtn" style="font-size:0.8em">+ Env var</button></div>
    </div>
    <div id="customMcpHttpFields" style="display:none">
      <div class="row"><input id="customMcpUrl" type="text" placeholder="Server URL" style="flex:1" /></div>
    </div>
    <div class="row">
      <label><input type="checkbox" id="customMcpGlobal" /> <span class="tooltip-label">Apply to all projects</span></label>
      <button id="customMcpAddBtn">Add Server</button>
    </div>
    <div id="customMcpResult" style="display:none"></div>
  </div>

  <script>
    const ALL_PROFILES = ${profilesJson};
    const MCP_INTEGRATIONS = ${integrationsJson};
    const DEMO_ORGS = ${orgsJson};
    const TOOL_LABELS = { cursor: 'Cursor', vscode: 'VS Code', codex: 'Codex', agentforce: 'Agentforce', claude: 'Claude' };
    const state = { selectedProfileIds: [], mcpSelectedOrgs: [], selectedIntegrations: [] };
    const profilesEl = document.getElementById('profiles');
    const toolsEl = document.getElementById('tools');

    function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
    function selectedProfiles() { return [...profilesEl.querySelectorAll('input:checked')].map(n => n.value); }

    function createCard(container, opts) {
      const card = document.createElement('label');
      card.className = 'profile-card' + (opts.checked ? ' selected' : '');
      card.title = opts.label + (opts.description ? ' — ' + opts.description : '');
      card.innerHTML = '<input type="checkbox" value="' + esc(opts.value) + '" ' + (opts.checked ? 'checked' : '') + ' />'
        + '<div class="profile-info"><span class="profile-name">' + esc(opts.label) + '</span>'
        + '<span class="profile-desc">' + esc(opts.description || '') + '</span></div>';
      const cb = card.querySelector('input');
      cb.addEventListener('change', () => { card.classList.toggle('selected', cb.checked); if (opts.onChange) opts.onChange(cb.checked); });
      container.appendChild(card);
      return card;
    }

    function renderTools(detected) {
      toolsEl.innerHTML = '';
      const on = detected.filter(t => t.detected);
      const off = detected.filter(t => !t.detected);
      for (const t of on) {
        const badge = document.createElement('span');
        badge.style.cssText = 'display:inline-block;margin:0 4px 3px 0;padding:2px 6px;border-radius:4px;font-size:0.82em;background:var(--vscode-badge-background);color:var(--vscode-badge-foreground)';
        badge.textContent = '✓ ' + (TOOL_LABELS[t.id] || t.id);
        badge.title = 'Detected: ' + t.reason;
        toolsEl.appendChild(badge);
      }
      if (off.length > 0) {
        const hint = document.createElement('span');
        hint.style.cssText = 'display:inline-block;margin:0 4px 3px 0;padding:2px 6px;font-size:0.78em;opacity:0.5;cursor:help';
        hint.textContent = '+' + off.length + ' not detected';
        hint.title = off.map(t => (TOOL_LABELS[t.id] || t.id) + ' (' + t.reason + ')').join('\\n');
        toolsEl.appendChild(hint);
      }
    }

    function renderIntegrations() {
      const profiles = selectedProfiles();
      const relevant = MCP_INTEGRATIONS.filter(i => i.profiles.some(p => profiles.includes(p)));
      const grid = document.getElementById('integrationsGrid');
      const creds = document.getElementById('integrationsCreds');
      const actions = document.getElementById('integrationsActions');
      const hint = document.getElementById('integrationsHint');
      const btn = document.getElementById('integrationsConfigureBtn');
      if (relevant.length === 0) {
        grid.style.display = 'none'; creds.style.display = 'none'; actions.style.display = 'none';
        hint.textContent = profiles.length === 0 ? 'Select profiles above to see available integrations.' : 'No integrations match.';
        hint.style.display = ''; return;
      }
      hint.style.display = 'none'; grid.style.display = ''; actions.style.display = ''; grid.innerHTML = '';
      for (const integ of relevant) {
        const desc = integ.transport.toUpperCase() + (integ.envVars.length ? ' · ' + integ.envVars.length + ' credential(s)' : ' · No credentials needed');
        createCard(grid, { value: integ.id, label: integ.label, description: desc, checked: false, onChange: () => {
          state.selectedIntegrations = [...grid.querySelectorAll('input:checked')].map(n => n.value);
          btn.disabled = state.selectedIntegrations.length === 0;
        }});
      }
      btn.disabled = true;
    }

    function renderOrgs(orgs) {
      const mcpStatus = document.getElementById('mcpStatus');
      const mcpOrgsSection = document.getElementById('mcpOrgsSection');
      const mcpOrgsEl = document.getElementById('mcpOrgs');
      const mcpConfigureBtn = document.getElementById('mcpConfigureBtn');
      if (orgs.length > 0) {
        mcpStatus.textContent = orgs.length + ' org(s) found';
        mcpOrgsSection.style.display = '';
        mcpOrgsEl.innerHTML = '';
        for (const org of orgs) {
          const card = createCard(mcpOrgsEl, { value: org.alias, label: org.alias, description: '', checked: false, onChange: () => {
            state.mcpSelectedOrgs = [...mcpOrgsEl.querySelectorAll('input:checked')].map(n => n.value);
            mcpConfigureBtn.disabled = state.mcpSelectedOrgs.length === 0;
          }});
          card.title = org.username;
        }
        mcpConfigureBtn.disabled = true;
      } else { mcpStatus.textContent = 'No orgs found.'; }
    }

    document.getElementById('mcpConfigureBtn').addEventListener('click', () => {
      const result = document.getElementById('mcpResult');
      result.style.display = '';
      result.innerHTML = '<p class="success-text">✓ MCP configured successfully</p>'
        + '<p class="muted">Servers: ' + state.mcpSelectedOrgs.map(o => 'salesforce-' + o).join(', ') + '</p>';
    });

    document.getElementById('runLocalBtn').addEventListener('click', () => {
      const el = document.getElementById('console');
      el.classList.remove('placeholder');
      el.textContent = '';
      const lines = [
        '> sf setup-agents local --profiles developer,architect',
        '',
        'Generating Cursor rules...',
        '  ✓ .cursor/rules/developer-standards.mdc',
        '  ✓ .cursor/rules/architect-standards.mdc',
        '',
        'Generating Claude rules...',
        '  ✓ CLAUDE.md',
        '',
        '[done] setup-agents local -> code 0',
      ];
      let i = 0;
      const timer = setInterval(() => {
        if (i >= lines.length) { clearInterval(timer); return; }
        el.textContent += lines[i] + '\\n';
        el.scrollTop = el.scrollHeight;
        i++;
      }, 150);
    });

    /* Phase 1: Show tools after brief delay (simulates detection) */
    setTimeout(() => {
      renderTools([
        { id: 'cursor', detected: true, reason: '.cursor directory' },
        { id: 'vscode', detected: true, reason: '.vscode directory' },
        { id: 'claude', detected: true, reason: 'CLAUDE.md file' },
        { id: 'codex', detected: false, reason: 'AGENTS.md file' },
        { id: 'agentforce', detected: false, reason: '.a4drules directory' },
      ]);
    }, 300);

    /* Phase 2: Render profile cards */
    for (const profile of ALL_PROFILES) {
      createCard(profilesEl, {
        value: profile.id, label: profile.label, description: profile.description, checked: false,
        onChange: () => { state.selectedProfileIds = selectedProfiles(); renderIntegrations(); }
      });
    }

    /* Phase 3: Render orgs after brief delay */
    setTimeout(() => renderOrgs(DEMO_ORGS), 500);
  </script>
</body>
</html>`;
}

async function pause(page: Page, ms: number): Promise<void> {
  await page.waitForTimeout(ms);
}

test.describe('Demo Recording — Full Extension Walkthrough', () => {
  test('guided setup and mcp configuration', async ({ page }) => {
    await page.setContent(buildFullDemoHtml());
    await page.waitForSelector('.profile-card');
    await pause(page, 1200);

    // Select Developer profile
    await page.locator('.profile-card:has(input[value="developer"])').click();
    await pause(page, 600);

    // Select Architect profile
    await page.locator('.profile-card:has(input[value="architect"])').click();
    await pause(page, 600);

    // Select UX profile (triggers Figma + draw.io integrations)
    await page.locator('.profile-card:has(input[value="ux"])').click();
    await pause(page, 800);

    // Click Apply Configuration
    await page.locator('#runLocalBtn').click();
    await pause(page, 2500);

    // Scroll down to MCP section
    await page.locator('#mcpCard').scrollIntoViewIfNeeded();
    await pause(page, 800);

    // Select the demo org
    await page.locator('#mcpOrgs .profile-card:has(input[value="my-hub"])').click();
    await pause(page, 600);

    // Click Connect Selected Orgs
    await page.locator('#mcpConfigureBtn').click();
    await pause(page, 1000);

    // Scroll to integrations
    await page.locator('#integrationsGrid').scrollIntoViewIfNeeded();
    await pause(page, 800);

    // Select Figma integration
    const figmaCard = page.locator('#integrationsGrid .profile-card:has(input[value="figma"])');
    if (await figmaCard.isVisible()) {
      await figmaCard.click();
      await pause(page, 500);
    }

    // Select draw.io
    const drawioCard = page.locator('#integrationsGrid .profile-card:has(input[value="drawio"])');
    if (await drawioCard.isVisible()) {
      await drawioCard.click();
      await pause(page, 500);
    }

    await pause(page, 1200);

    // Scroll to custom MCP server section and demo it
    await page.locator('#customMcpAddBtn').scrollIntoViewIfNeeded();
    await pause(page, 600);
    await page.locator('#customMcpName').fill('my-custom-tool');
    await pause(page, 400);
    await page.locator('#customMcpCommand').fill('npx');
    await pause(page, 300);
    await page.locator('#customMcpArgs').fill('-y my-custom-mcp-server');
    await pause(page, 600);

    // Verify end state
    await expect(page.locator('#mcpResult')).toBeVisible();
    await expect(page.locator('#mcpResult')).toContainText('MCP configured');
  });

  test('sf cli missing banner', async ({ page }) => {
    await page.setContent(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    :root {
      --vscode-font-family: system-ui, -apple-system, sans-serif;
      --vscode-foreground: #cccccc;
      --vscode-editorWidget-border: #454545;
      --vscode-input-background: #3c3c3c;
      --vscode-input-foreground: #cccccc;
      --vscode-input-border: #3c3c3c;
      --vscode-errorForeground: #f48771;
      --vscode-inputValidation-errorBackground: rgba(255,0,0,0.12);
      --vscode-inputValidation-errorBorder: #f48771;
    }
    body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); padding: 12px; background: #1e1e1e; margin: 0; }
    .header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
    .banner-error { background: var(--vscode-inputValidation-errorBackground); border: 1px solid var(--vscode-inputValidation-errorBorder); border-radius: 8px; padding: 10px; margin-bottom: 12px; }
    .banner-error strong { color: var(--vscode-errorForeground); }
    .banner-error button { margin-top: 6px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 4px; padding: 6px 8px; cursor: pointer; }
    .muted { opacity: 0.8; font-size: 0.9em; }
    code { background: rgba(255,255,255,0.08); padding: 1px 4px; border-radius: 3px; font-size: 0.92em; }
  </style>
</head>
<body>
  <div class="header"><strong style="font-size:1.1em">⚙️ Setup Agents UI</strong></div>
  <div class="banner-error" id="cliBannerCliMissing">
    <strong>Salesforce CLI Not Found</strong>
    <p class="muted" style="margin:4px 0">The Salesforce CLI (<code>sf</code>) must be installed before using this extension.</p>
    <p class="muted" style="margin:4px 0;font-size:0.82em">Install from <strong>https://developer.salesforce.com/tools/salesforcecli</strong> or run: <code>npm install -g @salesforce/cli</code></p>
    <button id="sfCliRetryBtn" style="margin-top:6px">Retry Detection</button>
  </div>
</body>
</html>`);
    await pause(page, 3000);
    await expect(page.locator('#cliBannerCliMissing')).toBeVisible();
  });
});
