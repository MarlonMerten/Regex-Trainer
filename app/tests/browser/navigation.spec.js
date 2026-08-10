const { test, expect } = require('@playwright/test');

async function captureRuntimeErrors(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try { localStorage.clear(); } catch (_) {}
  });
});

test('View- und Kapitelwechsel lassen sich innerhalb der App zurücknavigieren', async ({ page }) => {
  const errors = await captureRuntimeErrors(page);
  await page.goto('/');
  const initialHash = await page.evaluate(() => location.hash);
  expect(initialHash).toMatch(/^#learn\//);

  const nav = page.locator('#nav');
  await nav.getByRole('button', { name: 'Playground', exact: true }).click();
  await expect(page).toHaveURL(/#play$/);
  await nav.getByRole('button', { name: 'Training', exact: true }).click();
  await expect(page).toHaveURL(/#train\/l1-01$/);

  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Playground', exact: true })).toBeVisible();
  await expect(page).toHaveURL(/#play$/);
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Lernpfad', exact: true })).toBeVisible();
  expect(await page.evaluate(() => location.hash)).toBe(initialHash);

  const chapters = page.locator('.learn-nav button');
  await chapters.nth(1).click();
  const secondHash = await page.evaluate(() => location.hash);
  await chapters.nth(2).click();
  expect(await page.evaluate(() => location.hash)).not.toBe(secondHash);

  await page.goBack();
  await expect(chapters.nth(1)).toHaveAttribute('aria-current', 'step');
  expect(await page.evaluate(() => location.hash)).toBe(secondHash);
  expect(errors).toEqual([]);
});

test('Skip-Link fokussiert den Inhalt, ohne die Router-History zu verändern', async ({ page }) => {
  await page.goto('/#learn/quantifizierer');
  const before = await page.evaluate(() => location.hash);

  const skip = page.locator('.skip-link');
  await skip.focus();
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
  expect(await page.evaluate(() => location.hash)).toBe(before);

  await page.locator('#nav').getByRole('button', { name: 'Playground', exact: true }).click();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Quantifizierer', exact: true })).toBeVisible();
  expect(await page.evaluate(() => location.hash)).toBe(before);
});

test('ungültige Views und Unterrouten werden im aktuellen Eintrag kanonisiert', async ({ page }) => {
  const cases = [
    ['/#learn/toString', /^#learn\/(?!toString$).+/],
    ['/#train/constructor', /^#train\/l\d-\d+$/],
    ['/#play/nicht-vorhanden', /^#play$/],
    ['/#quiz/__proto__', /^#quiz$/],
    ['/#nicht-vorhanden/toString', /^#learn\/.+/]
  ];

  for (const [url, canonicalHash] of cases) {
    await page.goto(url);
    await expect.poll(() => page.evaluate(() => location.hash)).toMatch(canonicalHash);
    await expect(page.locator('.view.on')).toHaveCount(1);
  }
});

test('Nachschlage-Eintrag schließen und Browser-Zurück stellen den Zustand wieder her', async ({ page }) => {
  await page.goto('/#ref');
  const first = page.locator('.ref-head').first();
  await first.click();
  const openHash = await page.evaluate(() => location.hash);
  expect(openHash).toMatch(/^#ref\/.+/);
  await expect(page.locator('.ref-item.open')).toHaveCount(1);

  await page.locator('.ref-head').first().click();
  await expect(page).toHaveURL(/#ref$/);
  await expect(page.locator('.ref-item.open')).toHaveCount(0);

  await page.goBack();
  await expect.poll(() => page.evaluate(() => location.hash)).toBe(openHash);
  await expect(page.locator('.ref-item.open')).toHaveCount(1);
  await page.goBack();
  await expect(page).toHaveURL(/#ref$/);
  await expect(page.locator('.ref-item.open')).toHaveCount(0);

  await page.goForward();
  await expect.poll(() => page.evaluate(() => location.hash)).toBe(openHash);
  await expect(page.locator('.ref-item.open')).toHaveCount(1);
  await page.goForward();
  await expect(page).toHaveURL(/#ref$/);
  await expect(page.locator('.ref-item.open')).toHaveCount(0);
});

test('Import lehnt Prototype-Schlüssel ab und akzeptiert echte IDs', async ({ page }) => {
  await page.goto('/');
  const outcome = await page.evaluate(() => {
    function withId(field, id, value) {
      const map = Object.create(null);
      map[id] = value;
      const doc = {};
      doc[field] = map;
      try {
        RT.store.importJSON(JSON.stringify(doc));
        return 'accepted';
      } catch (error) {
        return error.message;
      }
    }

    const rejected = ['toString', 'constructor', '__proto__'].map(id => ({
      id,
      solved: withId('solved', id, true),
      lesson: (() => {
        try {
          RT.store.importJSON(JSON.stringify({ lastLesson: id }));
          return 'accepted';
        } catch (error) {
          return error.message;
        }
      })()
    }));

    RT.store.importJSON(JSON.stringify({
      solved: { 'l1-01': true },
      lastLesson: RT.lessons[0].id,
      lastLevel: RT.levels[0].id
    }));
    return {
      rejected,
      validSolved: RT.store.isSolved('l1-01'),
      nullPrototype: Object.getPrototypeOf(RT.store.all().solved) === null
    };
  });

  for (const item of outcome.rejected) {
    expect(item.solved, `${item.id} in solved`).not.toBe('accepted');
    expect(item.lesson, `${item.id} als lastLesson`).not.toBe('accepted');
  }
  expect(outcome.validSolved).toBe(true);
  expect(outcome.nullPrototype).toBe(true);
});
