import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const collection = JSON.parse(readFileSync('collection.json', 'utf8'));

test('saved studies lead the gallery and demonstrations stay separate', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('[data-entry]')).toHaveCount(13);
  await expect(page.locator('[data-entry="letter-wave"] iframe')).toBeVisible();
  await expect(page.locator('[data-entry="line-wavy"] iframe')).toBeVisible();
  await page.locator('[data-entry="letter-wave"] .live-preview').hover();
  await expect.poll(async () => page.locator('[data-entry="letter-wave"] iframe').evaluate(frame => frame.contentDocument.querySelector('#variant-wave .idea-link').classList.contains('active'))).toBe(true);
  await page.getByRole('button', { name: 'Demonstrations 05' }).click();
  await expect(page.locator('[data-entry]')).toHaveCount(5);
  await expect(page.locator('[data-entry="letter-wave"]')).toHaveCount(0);
  expect(page.url()).toContain('view=demonstrations');
  await page.getByRole('button', { name: 'Collection 13' }).click();
  await expect(page.locator('[data-entry]')).toHaveCount(13);
  expect(errors).toEqual([]);
});

test('all seven letter motions can be selected, keyboard focused, and replayed', async ({ page }) => {
  await page.goto('/examples/idea-motion.html');
  const controls = page.locator('.variant-select');
  await expect(controls).toHaveCount(7);
  await expect(page.locator('.letter')).toHaveCount(28);
  for (const control of await controls.all()) {
    await control.focus();
    await expect(control.locator('.idea-link')).toHaveClass(/active/);
    const replay = page.locator(`[aria-controls="${await control.getAttribute('id')}"]`);
    await replay.click();
    await expect(control).toHaveAttribute('aria-pressed', 'true');
    await expect(control.locator('.idea-link')).toHaveClass(/active/);
  }
});

test('all six line variants display the correct SVG and replay', async ({ page }) => {
  await page.goto('/examples/idea-line.html');
  await expect(page.locator('.variant-select')).toHaveCount(6);
  for (const control of await page.locator('.variant-select').all()) {
    await control.focus();
    await expect(control.locator('svg')).toBeVisible();
    await expect(control.locator('path')).toHaveAttribute('d', /M/);
    await page.locator(`[aria-controls="${await control.getAttribute('id')}"]`).click();
    await expect(control).toHaveAttribute('aria-pressed', 'true');
  }
});

test('reduced motion retains visible final underline states without animations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/examples/idea-line.html');
  const control = page.locator('#variant-wavy');
  await control.focus();
  await expect(control.locator('path')).toHaveCSS('opacity', '0.9');
  expect(await control.locator('path').evaluate(path => getComputedStyle(path).animationName)).toBe('none');
  await page.goto('/examples/idea-motion.html');
  await page.locator('#variant-wave').focus();
  expect(await page.locator('#variant-wave .letter').first().evaluate(letter => getComputedStyle(letter).animationName)).toBe('none');
});

test('gallery live previews, touch, and layouts work from 320 to 1920 pixels', async ({ page }) => {
  test.setTimeout(120000);
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const entry of collection.entries) {
      const frame = page.locator(`[data-entry="${entry.id}"] iframe`);
      await frame.scrollIntoViewIfNeeded();
      await expect(frame).toBeVisible();
      expect(await frame.evaluate(el => el.contentDocument.documentElement.scrollWidth <= el.clientWidth)).toBe(true);
    }
    if ([390, 1440].includes(width)) await page.screenshot({ path: `.verification/collection-${width}.png`, fullPage: true });
  }
});

test('each variant has a single example, replay and copied source', async ({ page }) => {
  test.setTimeout(120000);
  for (const entry of collection.entries) {
    await page.goto(`/entries/${entry.id}/`);
    await expect(page.getByRole('heading', { name: entry.title, exact: true })).toBeVisible();
    const example = page.frameLocator('.example-stage iframe');
    await expect(example.locator('.variant-select')).toHaveCount(1);
    const control = example.locator(`#variant-${entry.variant}`);
    // Detail preview shows only the element: no lab header, caption or replay chrome.
    await expect(example.locator('.lab-head')).toBeHidden();
    await expect(example.locator('.variant-copy')).toBeHidden();
    await expect(example.locator('.idea-line')).toHaveCount(entry.study === 'motion' ? 0 : 1);
    if (entry.study === 'line') await expect(example.locator('[data-motion]')).toHaveCount(0);
    await control.focus();
    await expect(control.locator('.idea-link')).toHaveClass(/active/);
    await control.click();
    await expect(control).toHaveAttribute('aria-pressed', 'true');
    await expect(control.locator('.idea-link')).toHaveClass(/active/);
    await page.getByRole('tab', { name: 'Code', exact: true }).click();
    const source = readFileSync(entry.example, 'utf8');
    expect((source.match(/class="variant-select"/g) || []).length).toBe(1);
    await expect(page.locator('#code-panel code')).toHaveText(source);
    await page.getByRole('button', { name: 'Copy source', exact: true }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(source);
    await page.getByRole('tab', { name: 'Preview', exact: true }).click();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await control.focus();
    expect(await control.locator('.letter').first().evaluate(letter => getComputedStyle(letter).animationName)).toBe('none');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  }
});
