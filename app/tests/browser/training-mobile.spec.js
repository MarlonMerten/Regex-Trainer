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

test('Trainingskatalog erfüllt Umfang, Gegenproben, Funktionen und Flag-Abdeckung', async ({ page }) => {
  await page.goto('/#train');
  const structure = await page.evaluate(() => {
    const levels = Object.fromEntries(RT.levels.map(level => [
      level.id,
      RT.exercises.filter(exercise => exercise.level === level.id).length
    ]));
    return {
      total: RT.exercises.length,
      uniqueIds: new Set(RT.exercises.map(exercise => exercise.id)).size,
      minimumCases: Math.min(...RT.exercises.map(exercise => exercise.cases.length)),
      levels,
      functions: [...new Set(RT.exercises.map(exercise => exercise.fn || 'findall'))].sort(),
      flags: [...new Set(RT.exercises.flatMap(exercise => [...(exercise.flags || '')]))].sort(),
      hasFlagRequirement: RT.exercises.some(exercise => exercise.requireFlags),
      hasWhitespaceRequirement: RT.exercises.some(exercise => exercise.requirePatternWhitespace),
      hasNamedGroupRequirement: RT.exercises.some(exercise => exercise.requireGroupNames)
    };
  });

  expect(structure.total).toBeGreaterThanOrEqual(50);
  expect(structure.uniqueIds).toBe(structure.total);
  expect(structure.minimumCases).toBeGreaterThanOrEqual(3);
  expect(Object.values(structure.levels).every(count => count >= 8)).toBe(true);
  expect(structure.functions).toEqual(['findall', 'finditer', 'fullmatch', 'match', 'search', 'split', 'sub']);
  expect(structure.flags).toEqual(['a', 'i', 'm', 's', 'x']);
  expect(structure.hasFlagRequirement).toBe(true);
  expect(structure.hasWhitespaceRequirement).toBe(true);
  expect(structure.hasNamedGroupRequirement).toBe(true);
});

test('strukturelle Trainingsanforderungen lassen sich nicht durch gleiche Ausgabe umgehen', async ({ page }) => {
  const errors = await captureRuntimeErrors(page);

  await page.goto('/#train/l2-10');
  let input = page.getByRole('textbox', { name: 'Dein regulärer Ausdruck' });
  await input.fill('\\d+');
  await expect(page.locator('.verdict-live')).toContainText('Aktiviere das geforderte Flag a.');
  await page.getByRole('button', { name: /^a$/ }).click();
  await expect(page.locator('.verdict.win')).toContainText('Alle Testtexte bestanden');

  await page.goto('/#train/l4-10');
  input = page.getByRole('textbox', { name: 'Dein regulärer Ausdruck' });
  await page.getByRole('button', { name: /^x$/ }).click();
  await input.fill('\\b(\\d{2})\\.(\\d{2})\\.(\\d{4})\\b');
  await expect(page.locator('.verdict-live')).toContainText('sichtbaren Whitespace');
  await input.fill('\\b (\\d{2}) \\. (\\d{2}) \\. (\\d{4}) \\b');
  await expect(page.locator('.verdict.win')).toContainText('Alle Testtexte bestanden');

  await page.goto('/#train/l5-09');
  input = page.getByRole('textbox', { name: 'Dein regulärer Ausdruck' });
  await page.getByRole('button', { name: /^m$/ }).click();
  await input.fill('^(\\d{2}:\\d{2}:\\d{2})[ \\t]+(INFO|WARN|ERROR)[ \\t]+(.+)$');
  await expect(page.locator('.verdict-live')).toContainText('benannten Gruppen');

  expect(errors).toEqual([]);
});

test('alle Lektionen bleiben bei 320 px ohne Seiten-Overflow bedienbar', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors = await captureRuntimeErrors(page);
  await page.goto('/#learn');

  const chapterCount = await page.evaluate(() => RT.lessons.length);
  const chapterSelect = page.getByLabel('Kapitel auswählen');
  await expect(chapterSelect.locator('option')).toHaveCount(chapterCount);

  for (let index = 0; index < chapterCount; index++) {
    const expected = await page.evaluate(i => RT.lessons[i].title, index);
    await chapterSelect.selectOption(String(index));
    await expect(page.locator('.lesson h2')).toHaveText(expected);
    const metrics = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
      lessonRight: Math.ceil(document.querySelector('.lesson').getBoundingClientRect().right)
    }));
    expect(metrics.document, `Seitenbreite in Lektion ${index + 1}`).toBeLessThanOrEqual(metrics.viewport + 1);
    expect(metrics.lessonRight, `Lektionskante in Lektion ${index + 1}`).toBeLessThanOrEqual(metrics.viewport + 1);
  }

  expect(errors).toEqual([]);
});

test('mobiles Training startet oben, ohne Tastatur-Sprung, und Controls sind touchfreundlich', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#train/random');
  await expect(page.getByRole('heading', { name: 'Üben', exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  const metrics = await page.evaluate(() => {
    const input = document.querySelector('#view-train input[aria-label="Dein regulärer Ausdruck"]');
    const controls = [...document.querySelectorAll('#view-train .ex-dot, #view-train .flag')];
    return {
      activeTag: document.activeElement && document.activeElement.tagName,
      inputFont: parseFloat(getComputedStyle(input).fontSize),
      smallestControl: Math.min(...controls.map(node => node.getBoundingClientRect().height)),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
    };
  });
  expect(metrics.activeTag).not.toBe('INPUT');
  expect(metrics.inputFont).toBeGreaterThanOrEqual(16);
  expect(metrics.smallestControl).toBeGreaterThanOrEqual(44);
  expect(metrics.overflow).toBe(false);
});
