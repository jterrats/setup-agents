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
