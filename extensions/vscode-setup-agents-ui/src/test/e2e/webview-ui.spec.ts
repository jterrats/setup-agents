import { test, expect } from '@playwright/test';
import { ALL_PROFILES } from '../../constants';

const PROFILE_COUNT = ALL_PROFILES.length;

function buildTestHtml(): string {
  const profilesJson = JSON.stringify(ALL_PROFILES);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Setup Agents UI — Test Harness</title>
  <style>
    :root {
      --vscode-font-family: system-ui, sans-serif;
      --vscode-foreground: #cccccc;
      --vscode-editorWidget-border: #454545;
      --vscode-focusBorder: #007fd4;
      --vscode-list-activeSelectionBackground: rgba(4,57,94,.75);
      --vscode-list-activeSelectionForeground: #fff;
      --vscode-input-background: #3c3c3c;
      --vscode-input-foreground: #cccccc;
      --vscode-input-border: #3c3c3c;
      --vscode-textCodeBlock-background: #1e1e1e;
    }
    body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); padding: 12px; background: #1e1e1e; }
    .profiles { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 8px 0; }
    .profile-card { display: flex; align-items: flex-start; gap: 6px; padding: 6px 8px; border: 1px solid var(--vscode-editorWidget-border); border-radius: 6px; cursor: pointer; transition: border-color 0.15s; }
    .profile-card:hover { border-color: var(--vscode-focusBorder); }
    .profile-card.selected { border-color: var(--vscode-focusBorder); background: var(--vscode-list-activeSelectionBackground); color: var(--vscode-list-activeSelectionForeground); }
    .profile-card input[type=checkbox] { margin-top: 2px; }
    .profile-card .profile-info { display: flex; flex-direction: column; }
    .profile-card .profile-name { font-weight: bold; font-size: 0.92em; }
    .profile-card .profile-desc { font-size: 0.8em; opacity: 0.75; }
    button { background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 4px; padding: 6px 8px; cursor: pointer; }
    #console { white-space: pre-wrap; min-height: 120px; max-height: 220px; overflow-y: auto; background: var(--vscode-textCodeBlock-background); border-radius: 6px; padding: 8px; }
  </style>
</head>
<body>
  <div class="profiles" id="profiles" role="group" aria-label="Profile selection"></div>
  <button id="runLocalBtn" disabled>Apply Configuration</button>
  <div id="console" aria-live="polite"></div>

  <script>
    const ALL_PROFILES = ${profilesJson};
    const state = { selectedProfileIds: ['developer'] };
    const profilesEl = document.getElementById('profiles');
    const applyBtn = document.getElementById('runLocalBtn');

    function selectedProfiles() {
      return [...profilesEl.querySelectorAll('input[type=checkbox]:checked')].map(n => n.value);
    }

    function updateApplyBtn() {
      applyBtn.disabled = selectedProfiles().length === 0;
    }

    for (const profile of ALL_PROFILES) {
      const isChecked = state.selectedProfileIds.includes(profile.id);
      const card = document.createElement('label');
      card.className = 'profile-card' + (isChecked ? ' selected' : '');
      card.setAttribute('role', 'checkbox');
      card.setAttribute('aria-checked', String(isChecked));
      card.setAttribute('tabindex', '0');
      card.innerHTML = '<input type="checkbox" value="' + profile.id + '" ' + (isChecked ? 'checked' : '') + ' />'
        + '<div class="profile-info"><span class="profile-name">' + profile.label + '</span>'
        + '<span class="profile-desc">' + profile.description + '</span></div>';
      const checkbox = card.querySelector('input');
      checkbox.addEventListener('change', () => {
        card.classList.toggle('selected', checkbox.checked);
        card.setAttribute('aria-checked', String(checkbox.checked));
        state.selectedProfileIds = selectedProfiles();
        updateApplyBtn();
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          checkbox.checked = !checkbox.checked;
          checkbox.dispatchEvent(new Event('change'));
        }
      });
      profilesEl.appendChild(card);
    }
    updateApplyBtn();
  </script>
</body>
</html>`;
}

test.describe('Webview UI — Profile Cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.setContent(buildTestHtml());
    await page.waitForSelector('.profile-card');
  });

  test(`renders ${PROFILE_COUNT} profile cards`, async ({ page }) => {
    const cards = page.locator('.profile-card');
    await expect(cards).toHaveCount(PROFILE_COUNT);
  });

  test('each card shows a label and description', async ({ page }) => {
    for (const profile of ALL_PROFILES) {
      const card = page.locator(`.profile-card:has(input[value="${profile.id}"])`);
      await expect(card.locator('.profile-name')).toHaveText(profile.label);
      await expect(card.locator('.profile-desc')).toHaveText(profile.description);
    }
  });

  test('Developer is pre-selected by default', async ({ page }) => {
    const devCard = page.locator('.profile-card:has(input[value="developer"])');
    await expect(devCard).toHaveClass(/selected/);
    const checkbox = devCard.locator('input[type="checkbox"]');
    await expect(checkbox).toBeChecked();
  });

  test('clicking a card toggles selection', async ({ page }) => {
    const architectCard = page.locator('.profile-card:has(input[value="architect"])');
    await expect(architectCard).not.toHaveClass(/selected/);

    await architectCard.click();
    await expect(architectCard).toHaveClass(/selected/);
    await expect(architectCard.locator('input[type="checkbox"]')).toBeChecked();

    await architectCard.click();
    await expect(architectCard).not.toHaveClass(/selected/);
    await expect(architectCard.locator('input[type="checkbox"]')).not.toBeChecked();
  });

  test('multi-select: selecting multiple profiles works', async ({ page }) => {
    const ba = page.locator('.profile-card:has(input[value="ba"])');
    const pm = page.locator('.profile-card:has(input[value="pm"])');
    const qa = page.locator('.profile-card:has(input[value="qa"])');

    await ba.click();
    await pm.click();
    await qa.click();

    await expect(ba).toHaveClass(/selected/);
    await expect(pm).toHaveClass(/selected/);
    await expect(qa).toHaveClass(/selected/);

    const checked = await page.locator('.profile-card input[type="checkbox"]:checked').count();
    expect(checked).toBe(4); // developer (default) + ba + pm + qa
  });

  test('Apply button is disabled when no profiles selected', async ({ page }) => {
    const devCard = page.locator('.profile-card:has(input[value="developer"])');
    await devCard.click(); // uncheck the default

    const btn = page.locator('#runLocalBtn');
    await expect(btn).toBeDisabled();
  });

  test('Apply button is enabled when at least one profile selected', async ({ page }) => {
    const btn = page.locator('#runLocalBtn');
    await expect(btn).toBeEnabled();
  });

  test('PM profile card is present with correct data', async ({ page }) => {
    const pmCard = page.locator('.profile-card:has(input[value="pm"])');
    await expect(pmCard).toBeVisible();
    await expect(pmCard.locator('.profile-name')).toHaveText('Project Manager');
    await expect(pmCard.locator('.profile-desc')).toContainText('Sprint planning');
  });
});

test.describe('Webview UI — Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.setContent(buildTestHtml());
    await page.waitForSelector('.profile-card');
  });

  test('profile cards have role=checkbox and aria-checked', async ({ page }) => {
    const cards = page.locator('.profile-card');
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      await expect(card).toHaveAttribute('role', 'checkbox');
      const ariaChecked = await card.getAttribute('aria-checked');
      expect(['true', 'false']).toContain(ariaChecked);
    }
  });

  test('keyboard Space toggles profile selection', async ({ page }) => {
    const architectCard = page.locator('.profile-card:has(input[value="architect"])');
    await architectCard.focus();
    await page.keyboard.press('Space');
    await expect(architectCard).toHaveClass(/selected/);
    await expect(architectCard).toHaveAttribute('aria-checked', 'true');
  });

  test('keyboard Enter toggles profile selection', async ({ page }) => {
    const pmCard = page.locator('.profile-card:has(input[value="pm"])');
    await pmCard.focus();
    await page.keyboard.press('Enter');
    await expect(pmCard).toHaveClass(/selected/);
    await expect(pmCard).toHaveAttribute('aria-checked', 'true');
  });

  test('profiles container has group role and label', async ({ page }) => {
    const container = page.locator('#profiles');
    await expect(container).toHaveAttribute('role', 'group');
    await expect(container).toHaveAttribute('aria-label', 'Profile selection');
  });

  test('console output area has aria-live=polite', async ({ page }) => {
    const consoleEl = page.locator('#console');
    await expect(consoleEl).toHaveAttribute('aria-live', 'polite');
  });

  test('SLDS contrast variables are applied', async ({ page }) => {
    const body = page.locator('body');
    const color = await body.evaluate((el) => window.getComputedStyle(el).color);
    expect(color).toBeTruthy();
    expect(color).not.toBe('');
  });
});

function buildMcpTestHtml(orgs: Array<{ alias: string; username: string }>): string {
  const orgsJson = JSON.stringify(orgs);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MCP Test Harness</title>
  <style>
    :root {
      --vscode-font-family: system-ui, sans-serif;
      --vscode-foreground: #cccccc;
      --vscode-editorWidget-border: #454545;
      --vscode-focusBorder: #007fd4;
      --vscode-list-activeSelectionBackground: rgba(4,57,94,.75);
      --vscode-list-activeSelectionForeground: #fff;
      --vscode-input-background: #3c3c3c;
      --vscode-input-foreground: #cccccc;
      --vscode-input-border: #3c3c3c;
      --vscode-charts-green: #89d185;
      --vscode-errorForeground: #f48771;
    }
    body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); padding: 12px; background: #1e1e1e; }
    .profiles { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 8px 0; }
    .profile-card { display: flex; align-items: flex-start; gap: 6px; padding: 6px 8px; border: 1px solid var(--vscode-editorWidget-border); border-radius: 6px; cursor: pointer; }
    .profile-card.selected { border-color: var(--vscode-focusBorder); background: var(--vscode-list-activeSelectionBackground); color: var(--vscode-list-activeSelectionForeground); }
    .profile-card .profile-info { display: flex; flex-direction: column; }
    .profile-card .profile-name { font-weight: bold; font-size: 0.92em; }
    .profile-card .profile-desc { font-size: 0.8em; opacity: 0.75; }
    .muted { opacity: 0.8; font-size: 0.9em; }
    .row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 8px; }
    button, input { background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 4px; padding: 6px 8px; }
    button { cursor: pointer; }
  </style>
</head>
<body>
  <div id="mcpCard">
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

  <script>
    const ORGS = ${orgsJson};
    const state = { mcpSelectedOrgs: [] };

    function renderOrgs(orgs) {
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
        for (const org of orgs) {
          const card = document.createElement('label');
          card.className = 'profile-card';
          card.setAttribute('role', 'checkbox');
          card.setAttribute('aria-checked', 'false');
          card.setAttribute('tabindex', '0');
          card.title = org.username;
          card.innerHTML = '<input type="checkbox" value="' + org.alias + '" />'
            + '<div class="profile-info"><span class="profile-name">' + org.alias + '</span>'
            + '<span class="profile-desc"></span></div>';
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
        mcpConfigureBtn.disabled = true;
      } else {
        mcpStatus.textContent = 'No orgs found. Login via Salesforce CLI.';
        mcpOrgsSection.style.display = 'none';
        mcpLoginSection.style.display = '';
      }
    }

    document.getElementById('mcpLoginBtn').addEventListener('click', () => {
      const aliasInput = document.getElementById('mcpLoginAlias');
      const alias = aliasInput.value.trim();
      if (!alias) { aliasInput.focus(); return; }
      const btn = document.getElementById('mcpLoginBtn');
      btn.disabled = true;
      btn.textContent = 'Authenticating...';
      document.getElementById('mcpLoginStatus').style.display = 'none';
      // Simulate async login — simulate success after 100ms
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = 'Authenticate Org';
        const loginStatus = document.getElementById('mcpLoginStatus');
        loginStatus.textContent = 'Authenticated: ' + alias;
        loginStatus.style.display = '';
        loginStatus.style.color = 'var(--vscode-charts-green)';
        renderOrgs([{ alias, username: alias + '@example.com' }]);
      }, 100);
    });

    document.getElementById('mcpConfigureBtn').addEventListener('click', () => {
      const result = document.getElementById('mcpResult');
      result.style.display = '';
      result.innerHTML = '<p style="color:var(--vscode-charts-green)">MCP configured successfully</p>'
        + '<p class="muted">Servers: ' + state.mcpSelectedOrgs.map(o => 'salesforce-' + o).join(', ') + '</p>';
    });

    renderOrgs(ORGS);
  </script>
</body>
</html>`;
}

test.describe('Webview UI — MCP with orgs', () => {
  const testOrgs = [
    { alias: 'devOrg', username: 'admin@devorg.com' },
    { alias: 'qaOrg', username: 'admin@qaorg.com' },
    { alias: 'prodOrg', username: 'admin@prodorg.com' },
  ];

  test.beforeEach(async ({ page }) => {
    await page.setContent(buildMcpTestHtml(testOrgs));
    await page.waitForSelector('#mcpOrgsSection');
  });

  test('displays org count status', async ({ page }) => {
    await expect(page.locator('#mcpStatus')).toHaveText('3 org(s) found');
  });

  test('renders org cards for each authenticated org', async ({ page }) => {
    const cards = page.locator('#mcpOrgs .profile-card');
    await expect(cards).toHaveCount(3);
  });

  test('each org card shows alias and has username as tooltip', async ({ page }) => {
    for (const org of testOrgs) {
      const card = page.locator(`#mcpOrgs .profile-card:has(input[value="${org.alias}"])`);
      await expect(card.locator('.profile-name')).toHaveText(org.alias);
      await expect(card).toHaveAttribute('title', org.username);
    }
  });

  test('Configure MCP button is disabled until org selected', async ({ page }) => {
    const btn = page.locator('#mcpConfigureBtn');
    await expect(btn).toBeDisabled();

    await page.locator('#mcpOrgs .profile-card:has(input[value="devOrg"])').click();
    await expect(btn).toBeEnabled();
  });

  test('selecting multiple orgs works', async ({ page }) => {
    await page.locator('#mcpOrgs .profile-card:has(input[value="devOrg"])').click();
    await page.locator('#mcpOrgs .profile-card:has(input[value="qaOrg"])').click();

    const checked = await page.locator('#mcpOrgs input:checked').count();
    expect(checked).toBe(2);
  });

  test('Configure MCP shows result on click', async ({ page }) => {
    await page.locator('#mcpOrgs .profile-card:has(input[value="devOrg"])').click();
    await page.locator('#mcpConfigureBtn').click();

    const result = page.locator('#mcpResult');
    await expect(result).toBeVisible();
    await expect(result).toContainText('MCP configured');
    await expect(result).toContainText('salesforce-devOrg');
  });

  test('org cards have accessible role and aria-checked', async ({ page }) => {
    const cards = page.locator('#mcpOrgs .profile-card');
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i)).toHaveAttribute('role', 'checkbox');
      await expect(cards.nth(i)).toHaveAttribute('aria-checked', 'false');
    }
  });

  test('keyboard toggles org selection', async ({ page }) => {
    const card = page.locator('#mcpOrgs .profile-card:has(input[value="prodOrg"])');
    await card.focus();
    await page.keyboard.press('Space');
    await expect(card).toHaveClass(/selected/);
    await expect(card).toHaveAttribute('aria-checked', 'true');
  });

  test('global and all-toolsets checkboxes are present', async ({ page }) => {
    await expect(page.locator('#mcpGlobal')).toBeVisible();
    await expect(page.locator('#mcpAllToolsets')).toBeVisible();
  });
});

test.describe('Webview UI — MCP without orgs (login flow)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setContent(buildMcpTestHtml([]));
    await page.waitForSelector('#mcpLoginSection');
  });

  test('shows login section when no orgs', async ({ page }) => {
    await expect(page.locator('#mcpLoginSection')).toBeVisible();
    await expect(page.locator('#mcpOrgsSection')).not.toBeVisible();
    await expect(page.locator('#mcpStatus')).toContainText('No orgs found');
  });

  test('login button requires alias', async ({ page }) => {
    await page.locator('#mcpLoginBtn').click();
    await expect(page.locator('#mcpLoginAlias')).toBeFocused();
  });

  test('login flow: enter alias, authenticate, see org card', async ({ page }) => {
    await page.locator('#mcpLoginAlias').fill('myNewOrg');
    await page.locator('#mcpLoginBtn').click();

    await expect(page.locator('#mcpLoginBtn')).toHaveText('Authenticating...');

    await page.waitForSelector('#mcpOrgsSection:not([style*="display: none"])');

    await expect(page.locator('#mcpStatus')).toHaveText('1 org(s) found');
    const card = page.locator('#mcpOrgs .profile-card');
    await expect(card).toHaveCount(1);
    await expect(card.locator('.profile-name')).toHaveText('myNewOrg');
  });

  test('after login, org section replaces login section', async ({ page }) => {
    await page.locator('#mcpLoginAlias').fill('testOrg');
    await page.locator('#mcpLoginBtn').click();

    await page.waitForSelector('#mcpOrgsSection:not([style*="display: none"])');
    await expect(page.locator('#mcpOrgsSection')).toBeVisible();
    await expect(page.locator('#mcpStatus')).toHaveText('1 org(s) found');
  });
});

function buildUpdateTestHtml(staleCount: number): string {
  const hasStale = staleCount > 0;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    :root {
      --vscode-font-family: system-ui, sans-serif;
      --vscode-foreground: #cccccc;
      --vscode-input-background: #3c3c3c;
      --vscode-input-foreground: #cccccc;
      --vscode-input-border: #3c3c3c;
      --vscode-charts-green: #89d185;
    }
    body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); padding: 12px; background: #1e1e1e; }
    .muted { opacity: 0.8; font-size: 0.9em; }
    .success-text { color: var(--vscode-charts-green); }
    button { background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 4px; padding: 6px 8px; cursor: pointer; }
    #console { white-space: pre-wrap; min-height: 60px; background: #1e1e1e; padding: 8px; }
  </style>
</head>
<body>
  <div id="updateCard">
    <h3>Update Agent Rules</h3>
    <p class="muted" id="updateStatus" style="${hasStale ? 'display:none' : ''}">All agent rules are up to date.</p>
    <div id="updateActions" style="${hasStale ? '' : 'display:none'}">
      <span id="updateCount" class="muted">${staleCount} stale file(s) detected.</span>
      <button id="updateNowBtn">Update Now</button>
    </div>
    <div id="updateResult" style="display:none"></div>
  </div>
  <div id="console"></div>

  <script>
    let staleCount = ${staleCount};

    function appendConsole(text, isError) {
      document.getElementById('console').textContent += text;
    }

    function resetButton(id, label) {
      const btn = document.getElementById(id);
      if (btn) { btn.disabled = false; btn.textContent = label; }
    }

    document.getElementById('updateNowBtn').addEventListener('click', () => {
      const btn = document.getElementById('updateNowBtn');
      btn.disabled = true;
      btn.textContent = 'Updating...';

      // Simulate update completion
      setTimeout(() => {
        const resultEl = document.getElementById('updateResult');
        const actionsEl = document.getElementById('updateActions');
        const statusEl = document.getElementById('updateStatus');
        resetButton('updateNowBtn', 'Update Now');
        actionsEl.style.display = 'none';
        resultEl.style.display = '';
        resultEl.innerHTML = '<p class="success-text">Update complete. Verifying…</p>';
        statusEl.style.display = '';
        statusEl.className = 'muted';
        statusEl.textContent = 'Checking for remaining stale files…';
        appendConsole('[ok] Agent rules updated.\\n');

        // Simulate re-check: no more stale files
        setTimeout(() => {
          statusEl.textContent = 'All agent rules are up to date.';
          statusEl.className = 'muted success-text';
          resultEl.style.display = 'none';
          staleCount = 0;
        }, 150);
      }, 100);
    });
  </script>
</body>
</html>`;
}

test.describe('Webview UI — Update Agent Rules (up to date)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setContent(buildUpdateTestHtml(0));
    await page.waitForSelector('#updateCard');
  });

  test('shows up-to-date message when no stale files', async ({ page }) => {
    await expect(page.locator('#updateStatus')).toBeVisible();
    await expect(page.locator('#updateStatus')).toHaveText('All agent rules are up to date.');
  });

  test('hides update actions when up to date', async ({ page }) => {
    await expect(page.locator('#updateActions')).not.toBeVisible();
  });

  test('hides update result when up to date', async ({ page }) => {
    await expect(page.locator('#updateResult')).not.toBeVisible();
  });
});

test.describe('Webview UI — Update Agent Rules (stale files)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setContent(buildUpdateTestHtml(12));
    await page.waitForSelector('#updateCard');
  });

  test('shows stale file count when files are outdated', async ({ page }) => {
    await expect(page.locator('#updateActions')).toBeVisible();
    await expect(page.locator('#updateCount')).toHaveText('12 stale file(s) detected.');
  });

  test('hides up-to-date status when stale files exist', async ({ page }) => {
    await expect(page.locator('#updateStatus')).not.toBeVisible();
  });

  test('Update Now button is visible and enabled', async ({ page }) => {
    const btn = page.locator('#updateNowBtn');
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
    await expect(btn).toHaveText('Update Now');
  });

  test('clicking Update Now shows updating state', async ({ page }) => {
    await page.locator('#updateNowBtn').click();
    await expect(page.locator('#updateNowBtn')).toBeDisabled();
    await expect(page.locator('#updateNowBtn')).toHaveText('Updating...');
  });

  test('after update: shows complete message and verifying status', async ({ page }) => {
    await page.locator('#updateNowBtn').click();
    await expect(page.locator('#updateResult')).toBeVisible();
    await expect(page.locator('#updateResult')).toContainText('Update complete');
    await expect(page.locator('#updateStatus')).toBeVisible();
    await expect(page.locator('#updateStatus')).toContainText('Checking for remaining stale files');
  });

  test('after update: stale actions are hidden', async ({ page }) => {
    await page.locator('#updateNowBtn').click();
    await expect(page.locator('#updateActions')).not.toBeVisible();
  });

  test('after re-check: shows up-to-date when no more stale files', async ({ page }) => {
    await page.locator('#updateNowBtn').click();
    await expect(page.locator('#updateStatus')).toContainText('Checking for remaining stale files');
    await expect(page.locator('#updateStatus')).toHaveText('All agent rules are up to date.', { timeout: 1000 });
    await expect(page.locator('#updateResult')).not.toBeVisible();
  });

  test('console logs success message after update', async ({ page }) => {
    await page.locator('#updateNowBtn').click();
    await page.waitForFunction(() => document.getElementById('console')?.textContent?.includes('[ok]'));
    await expect(page.locator('#console')).toContainText('[ok] Agent rules updated.');
  });
});

// ── Health banner harness ────────────────────────────────────────────────────

type BannerVariant = 'noWorkspace' | 'sfCliMissing' | 'pluginMissing' | 'installed';

function buildBannerTestHtml(variant: BannerVariant): string {
  const noWorkspace = variant === 'noWorkspace';
  const sfCliMissing = variant === 'sfCliMissing';
  const pluginMissing = variant === 'pluginMissing';
  const installed = variant === 'installed';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    :root {
      --vscode-font-family: system-ui, sans-serif;
      --vscode-foreground: #cccccc;
      --vscode-input-background: #3c3c3c;
      --vscode-input-foreground: #cccccc;
      --vscode-input-border: #3c3c3c;
      --vscode-errorForeground: #f48771;
    }
    body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); padding: 12px; background: #1e1e1e; }
    .banner-warning { background: rgba(255,200,0,.12); border: 1px solid #cc9900; border-radius:6px; padding:10px 14px; }
    .banner-error   { background: rgba(244,135,113,.12); border: 1px solid var(--vscode-errorForeground); border-radius:6px; padding:10px 14px; }
    .muted { opacity: 0.8; font-size: 0.9em; }
    button { background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 4px; padding: 6px 8px; cursor: pointer; }
    code { background: #2d2d2d; padding: 1px 4px; border-radius: 3px; }
  </style>
</head>
<body>
  <div id="cliCheckBanner" style="${installed ? '' : 'display:none'}">Checking...</div>
  <div id="cliBannerMount"></div>

  <script>
    const payload = {
      installed: ${installed},
      noWorkspace: ${noWorkspace},
      sfCliMissing: ${sfCliMissing},
      installing: false,
    };

    const mount = document.getElementById('cliBannerMount');

    if (!payload.installed) {
      const banner = document.createElement('div');

      if (payload.noWorkspace) {
        banner.className = 'banner-warning';
        banner.id = 'noWorkspaceBanner';
        banner.innerHTML =
          '<strong>No Workspace Open</strong>' +
          '<p class="muted" style="margin:4px 0">Open a Salesforce project folder in VS Code to use Setup Agents.</p>' +
          '<p class="muted" style="margin:4px 0;font-size:0.82em">File → Open Folder… and select your project root.</p>';
        mount.appendChild(banner);
      } else if (payload.sfCliMissing) {
        banner.className = 'banner-error';
        banner.id = 'sfCliBanner';
        banner.innerHTML =
          '<strong>Salesforce CLI Not Found</strong>' +
          '<p class="muted" style="margin:4px 0">The Salesforce CLI (<code>sf</code>) must be installed before using this extension.</p>' +
          '<p class="muted" style="margin:4px 0;font-size:0.82em">Install from <strong>https://developer.salesforce.com/tools/salesforcecli</strong> or run: <code>npm install -g @salesforce/cli</code></p>' +
          '<button id="sfCliRetryBtn" style="margin-top:6px">Retry Detection</button>';
        mount.appendChild(banner);
        document.getElementById('sfCliRetryBtn').addEventListener('click', () => {
          mount.innerHTML = '<p id="retryResult">Retrying...</p>';
        });
      } else if (${pluginMissing}) {
        banner.className = 'banner-warning';
        banner.id = 'pluginMissingBanner';
        banner.innerHTML =
          '<strong>CLI Plugin Not Installed</strong>' +
          '<p class="muted" style="margin:4px 0">The <code>@jterrats/setup-agents</code> Salesforce CLI plugin is required.</p>' +
          '<button id="installPluginBtn" style="margin-top:6px">Install Plugin</button>' +
          '<span class="muted" id="pluginInstallStatus" style="margin-left:8px;display:none">This may take a minute...</span>';
        mount.appendChild(banner);
        document.getElementById('installPluginBtn').addEventListener('click', () => {
          const btn = document.getElementById('installPluginBtn');
          btn.disabled = true;
          btn.textContent = 'Installing...';
          document.getElementById('pluginInstallStatus').style.display = '';
        });
      }
    }
  </script>
</body>
</html>`;
}

test.describe('Webview UI — Health Banners: no workspace', () => {
  test.beforeEach(async ({ page }) => {
    await page.setContent(buildBannerTestHtml('noWorkspace'));
    await page.waitForSelector('#cliBannerMount');
  });

  test('shows warning banner when no workspace is open', async ({ page }) => {
    const banner = page.locator('#noWorkspaceBanner');
    await expect(banner).toBeVisible();
    await expect(banner).toHaveClass(/banner-warning/);
  });

  test('banner contains "No Workspace Open" heading', async ({ page }) => {
    await expect(page.locator('#noWorkspaceBanner strong')).toHaveText('No Workspace Open');
  });

  test('banner explains how to open a folder', async ({ page }) => {
    await expect(page.locator('#noWorkspaceBanner')).toContainText('Open Folder');
  });

  test('no retry button is shown for noWorkspace', async ({ page }) => {
    await expect(page.locator('#sfCliRetryBtn')).not.toBeVisible();
  });
});

test.describe('Webview UI — Health Banners: SF CLI missing', () => {
  test.beforeEach(async ({ page }) => {
    await page.setContent(buildBannerTestHtml('sfCliMissing'));
    await page.waitForSelector('#sfCliBanner');
  });

  test('shows error banner when SF CLI is not found', async ({ page }) => {
    const banner = page.locator('#sfCliBanner');
    await expect(banner).toBeVisible();
    await expect(banner).toHaveClass(/banner-error/);
  });

  test('banner contains "Salesforce CLI Not Found" heading', async ({ page }) => {
    await expect(page.locator('#sfCliBanner strong').first()).toHaveText('Salesforce CLI Not Found');
  });

  test('banner shows install instructions', async ({ page }) => {
    await expect(page.locator('#sfCliBanner')).toContainText('npm install -g @salesforce/cli');
  });

  test('Retry Detection button is visible', async ({ page }) => {
    await expect(page.locator('#sfCliRetryBtn')).toBeVisible();
    await expect(page.locator('#sfCliRetryBtn')).toHaveText('Retry Detection');
  });

  test('clicking Retry triggers re-bootstrap', async ({ page }) => {
    await page.locator('#sfCliRetryBtn').click();
    await expect(page.locator('#retryResult')).toBeVisible();
    await expect(page.locator('#retryResult')).toContainText('Retrying');
  });
});

test.describe('Webview UI — Health Banners: plugin missing', () => {
  test.beforeEach(async ({ page }) => {
    await page.setContent(buildBannerTestHtml('pluginMissing'));
    await page.waitForSelector('#pluginMissingBanner');
  });

  test('shows warning banner when plugin is not installed', async ({ page }) => {
    const banner = page.locator('#pluginMissingBanner');
    await expect(banner).toBeVisible();
    await expect(banner).toHaveClass(/banner-warning/);
  });

  test('banner contains "CLI Plugin Not Installed" heading', async ({ page }) => {
    await expect(page.locator('#pluginMissingBanner strong')).toHaveText('CLI Plugin Not Installed');
  });

  test('Install Plugin button is visible and enabled', async ({ page }) => {
    const btn = page.locator('#installPluginBtn');
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
    await expect(btn).toHaveText('Install Plugin');
  });

  test('clicking Install Plugin shows installing state', async ({ page }) => {
    await page.locator('#installPluginBtn').click();
    await expect(page.locator('#installPluginBtn')).toBeDisabled();
    await expect(page.locator('#installPluginBtn')).toHaveText('Installing...');
    await expect(page.locator('#pluginInstallStatus')).toBeVisible();
  });
});

test.describe('Webview UI — Health Banners: installed (no banner)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setContent(buildBannerTestHtml('installed'));
    await page.waitForSelector('body');
  });

  test('no banner is injected into cliBannerMount when plugin is installed', async ({ page }) => {
    const mount = page.locator('#cliBannerMount');
    await expect(mount).toBeAttached();
    const innerHTML = await mount.innerHTML();
    expect(innerHTML.trim()).toBe('');
  });

  test('cliCheckBanner is present in DOM when installed', async ({ page }) => {
    const banner = page.locator('#cliCheckBanner');
    await expect(banner).toBeAttached();
    await expect(banner).toContainText('Checking');
  });
});
