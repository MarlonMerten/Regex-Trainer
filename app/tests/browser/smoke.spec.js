const path = require('path');
const { pathToFileURL } = require('url');
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

async function captureRuntimeErrors(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

async function waitForStableRender(page, scheme) {
  const expected = scheme === 'light'
    ? { color: 'rgb(23, 29, 43)', background: 'rgb(244, 246, 251)' }
    : { color: 'rgb(245, 247, 252)', background: 'rgb(11, 16, 26)' };
  await expect(page.locator('html')).toHaveAttribute('data-theme', scheme);
  await page.waitForFunction(colors => {
    const style = getComputedStyle(document.body);
    return style.color === colors.color && style.backgroundColor === colors.background &&
      !document.querySelector('[aria-busy="true"]');
  }, expected);
  await page.evaluate(() => new Promise(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  }));
}

async function expectNoSeriousAxeViolations(page, label) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const important = result.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
  expect(important, `${label}\n${important.map(v => `${v.id}: ${v.help}`).join('\n')}`).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try { localStorage.clear(); } catch (_) {}
  });
});

test('Start und alle fünf Arbeitsbereiche bleiben ohne Laufzeitfehler', async ({ page }) => {
  const errors = await captureRuntimeErrors(page);
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Regex verstehen. Nicht nur auswendig lernen.' })).toBeVisible();
  await expect(page.getByText('Direkt loslegen · ohne Anmeldung')).toBeVisible();

  const nav = page.locator('#nav');
  const destinations = [
    ['Lexikon', 'Nachschlagen'],
    ['Playground', 'Playground'],
    ['Üben', 'Üben'],
    ['Quiz', 'Quiz'],
    ['Lernen', 'Lernen']
  ];
  for (const [name, heading] of destinations) {
    await nav.getByRole('button', { name, exact: true }).click();
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  }

  expect(errors).toEqual([]);
});

test('Lernkapitel und Aufgaben sind direkt verlinkbar und reload-fest', async ({ page }) => {
  const errors = await captureRuntimeErrors(page);

  await page.goto('/#learn/quantifizierer');
  await expect(page.getByRole('heading', { name: 'Quantifizierer', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Quantifizierer', exact: true })).toBeVisible();

  await page.goto('/#train/l1-01');
  await expect(page.getByRole('heading', { name: 'Ziffernfolgen finden', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Ziffernfolgen finden', exact: true })).toBeVisible();

  expect(errors).toEqual([]);
});

test('Playground lädt das erste Beispiel und erzeugt gültigen Python-Code', async ({ page }) => {
  const errors = await captureRuntimeErrors(page);
  await page.goto('/#play');

  const examples = page.getByLabel('Beispiel laden');
  await examples.selectOption({ label: 'Geldbeträge' });
  await expect(page.getByPlaceholder(/Muster/)).toHaveValue(/\\d\+/);

  const functionSelect = page.getByLabel('Regex-Funktion');
  await functionSelect.selectOption('sub');
  await page.getByRole('button', { name: /^i$/ }).click();
  await expect(page.locator('#view-play').getByText(/flags=re\.I/)).toBeVisible();

  await functionSelect.selectOption('split');
  await expect(page.locator('#view-play').getByText(/flags=re\.I/)).toBeVisible();

  expect(errors).toEqual([]);
});

test('Playground bricht starkes Backtracking ab und startet den Worker neu', async ({ page }) => {
  const errors = await captureRuntimeErrors(page);
  await page.goto('/#play');

  const pattern = page.getByRole('textbox', { name: 'Regulärer Ausdruck' });
  const text = page.getByRole('textbox', { name: 'Testtext' });
  const result = page.getByRole('status');

  await pattern.fill('(a+)+$');
  await text.fill('a'.repeat(100_000) + '!');
  await expect(result).toContainText('Auswertung nach 600 ms abgebrochen', { timeout: 3_000 });

  await pattern.fill('a+');
  await text.fill('aaaa!');
  await expect(result).toHaveText("['aaaa']");
  await page.waitForTimeout(800);
  await expect(result).toHaveText("['aaaa']");
  expect(errors).toEqual([]);
});

test('Quizantworten bleiben als bedienbare Buttons zugänglich', async ({ page }) => {
  const errors = await captureRuntimeErrors(page);
  await page.goto('/#quiz');

  const answers = page.locator('.quiz-options button');
  await expect(answers).toHaveCount(4);
  for (let i = 0; i < 4; i++) await expect(answers.nth(i)).toBeEnabled();

  expect(errors).toEqual([]);
});

test('Schnellquiz enthält zehn eindeutige Fragen und die Tagesfrage wird angepinnt', async ({ page }) => {
  await page.goto('/#quiz/quick');
  await expect(page.locator('.quiz-meta .tag').first()).toHaveText('Frage 1 / 10');
  const ids = await page.evaluate(() => RT.quiz.map(question => question.id));
  expect(new Set(ids).size).toBe(ids.length);

  await page.goto('/#quiz/daily-q37');
  const expectedQuestion = await page.evaluate(() => RT.quiz.find(question => question.id === 'q37').q.replace(/<[^>]+>/g, ''));
  await expect(page.locator('#quiz-question')).toContainText(expectedQuestion);
});

test('beworbener file-Direktstart lädt die Anwendung', async ({ page }) => {
  const errors = await captureRuntimeErrors(page);
  const indexPath = path.join(__dirname, '..', '..', 'index.html');
  await page.goto(pathToFileURL(indexPath).href);

  await expect(page.getByRole('heading', { name: 'Regex verstehen. Nicht nur auswendig lernen.' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('Manifest stellt die installierbaren Raster-Icons bereit', async ({ request }) => {
  const response = await request.get('/manifest.json');
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest.icons).toEqual(expect.arrayContaining([
    expect.objectContaining({ src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' }),
    expect.objectContaining({ src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' })
  ]));
  for (const icon of manifest.icons) {
    const iconResponse = await request.get('/' + icon.src);
    expect(iconResponse.ok()).toBe(true);
    expect(iconResponse.headers()['content-type']).toContain('image/png');
  }
});

test('installierte App startet nach dem ersten Laden offline', async ({ page, context }) => {
  const errors = await captureRuntimeErrors(page);
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);

  await context.setOffline(true);
  try {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Regex verstehen. Nicht nur auswendig lernen.' })).toBeVisible();
  } finally {
    await context.setOffline(false);
  }

  expect(errors).toEqual([]);
});

test('Systemtheme folgt dem Betriebssystem und respektiert eine manuelle Wahl', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.goto('/');
  await waitForStableRender(page, 'light');

  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await waitForStableRender(page, 'dark');

  await page.getByRole('button', { name: 'Helles Design' }).click();
  await waitForStableRender(page, 'light');
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await waitForStableRender(page, 'light');
});

test('alle Bereiche bestehen stabilisiert in Dark und Light den WCAG-A/AA-Check', async ({ page }) => {
  test.setTimeout(30_000);
  for (const scheme of ['dark', 'light']) {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
    for (const route of ['start', 'learn', 'ref', 'play', 'train', 'quiz']) {
      await page.goto('/#' + route);
      await expect(page.locator('#view-' + route)).toHaveClass(/\bon\b/);
      await waitForStableRender(page, scheme);
      await expectNoSeriousAxeViolations(page, `${scheme}: ${route}`);
    }

    if (scheme === 'light') {
      await page.goto('/#learn');
      const chapters = page.locator('.learn-nav button');
      for (let index = 0, count = await chapters.count(); index < count; index++) {
        await chapters.nth(index).click();
        await waitForStableRender(page, scheme);
        await expectNoSeriousAxeViolations(page, `light: Lektion ${index + 1}`);
      }

      await page.goto('/#play');
      await page.getByRole('textbox', { name: 'Regulärer Ausdruck' }).fill('(');
      await expect(page.locator('#view-play .result.bad')).toBeVisible();
      await waitForStableRender(page, scheme);
      await expectNoSeriousAxeViolations(page, 'light: Playground-Fehlerzustand');

      await page.goto('/#train/l2-10');
      await page.getByRole('textbox', { name: 'Dein regulärer Ausdruck' }).fill('\\d+');
      await expect(page.locator('.verdict-live')).toContainText('Aktiviere das geforderte Flag a.');
      await waitForStableRender(page, scheme);
      await expectNoSeriousAxeViolations(page, 'light: Training-Anforderungszustand');
    }
  }
});

test('mobile Navigation bleibt bedienbar und erzeugt keinen Seiten-Overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = await captureRuntimeErrors(page);
  await page.goto('/');

  const nav = page.locator('#nav');
  await nav.getByRole('button', { name: 'Üben', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Üben', exact: true })).toBeVisible();

  const overflows = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflows).toBe(false);
  expect(errors).toEqual([]);
});
