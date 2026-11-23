import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const collection = JSON.parse(readFileSync('collection.json', 'utf8'));
const shadow = (page, selector, fn) => page.locator(selector).evaluate(fn);

test('gallery lists every entry, grouped by family, without errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('[data-entry]')).toHaveCount(collection.entries.length);
  expect(await page.locator('.family h2').evaluateAll(headings => headings.map(heading => heading.id)))
    .toEqual(['family-components', 'family-letter', 'family-underline']);
  for (const family of collection.families) {
    const count = collection.entries.filter(entry => entry.family === family.id).length;
    await expect(page.locator(`#family-${family.id} ~ .grid .card`)).toHaveCount(count);
  }
  // Letters sit flush: no whitespace between the per-letter spans.
  await expect.poll(() => page.locator('[data-entry="letter-wave"] .preview').evaluate(host => host.shadowRoot?.querySelectorAll('.idea span').length)).toBe(4);
  const gap = await page.locator('[data-entry="letter-wave"] .preview').evaluate(host => {
    const [a, b] = host.shadowRoot.querySelectorAll('.idea span');
    return b.getBoundingClientRect().left - a.getBoundingClientRect().right;
  });
  expect(Math.abs(gap)).toBeLessThan(1);
  expect(errors).toEqual([]);
});

test('hovering or focusing a card animates its own preview', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('[data-entry="letter-wave"]');
  await expect.poll(() => card.locator('.preview').evaluate(host => !!host.shadowRoot?.querySelector('.idea'))).toBe(true);
  const animation = () => card.locator('.preview').evaluate(host => getComputedStyle(host.shadowRoot.querySelector('.idea span')).animationName);
  expect(await animation()).toBe('none');
  await card.hover();
  await expect.poll(animation).toBe('idea-wave');
  await page.mouse.move(0, 0);
  await expect.poll(animation).toBe('none');
  await card.focus();
  await expect.poll(animation).toBe('idea-wave');
});

test('every detail page renders, holds, and copies the exact snippet', async ({ page }) => {
  for (const entry of collection.entries.filter(entry => entry.kind === 'html')) {
    await page.goto(`/#/${entry.id}`);
    await expect(page.getByRole('heading', { level: 1, name: entry.title })).toBeVisible();
    const source = readFileSync(entry.files[0], 'utf8');
    await expect(page.locator('#source')).toHaveText(source);
    const host = '.workbench .preview';
    await expect.poll(() => shadow(page, host, h => !!h.shadowRoot?.querySelector('.idea'))).toBe(true);
    await page.getByRole('button', { name: 'Hold active' }).click();
    await expect(page.getByRole('button', { name: 'Hold active' })).toHaveAttribute('aria-pressed', 'true');
    // Active state reaches the accent colour and, for underlines, shows the line.
    await expect.poll(() => shadow(page, host, h => getComputedStyle(h.shadowRoot.querySelector('.idea')).color)).toBe('rgb(184, 131, 67)');
    if (entry.family === 'underline') {
      await expect.poll(() => shadow(page, host, h => {
        const style = getComputedStyle(h.shadowRoot.querySelector('path'));
        // Visible, and either flowing or fully drawn in.
        return Number(style.opacity) > 0.5 && (style.animationName === 'idea-flow' || ['0px', '0'].includes(style.strokeDashoffset));
      })).toBe(true);
    }
    await page.getByRole('button', { name: 'Copy' }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(source);
    await expect(page.locator('#copy-status')).toHaveText('Copied to clipboard.');
    // Preview and code share one box: tabs swap panels, Hold only applies to Preview.
    await expect(page.locator('#source')).toBeHidden();
    await page.getByRole('tab', { name: 'Code' }).click();
    await expect(page.locator('#source')).toBeVisible();
    await expect(page.locator('#panel-preview')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Hold active' })).toBeHidden();
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByRole('tab', { name: 'Preview' })).toBeFocused();
    await expect(page.locator('#panel-preview')).toBeVisible();
  }
});

test('a standalone snippet works on its own page, with font and reduced motion', async ({ page }) => {
  const snippet = readFileSync('elements/letter-hop/letter-hop.html', 'utf8');
  await page.goto('/');
  await page.setContent(`<style>@font-face{font-family:Fredoka;src:url(http://127.0.0.1:4174/fonts/fredoka-600.woff2);font-weight:600}</style>${snippet}`);
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('600 36px Fredoka'))).toBe(true);
  await page.locator('.idea').focus();
  expect(await page.locator('.idea span').first().evaluate(el => getComputedStyle(el).animationName)).toBe('idea-hop');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.locator('.idea span').first().evaluate(el => getComputedStyle(el).animationName)).toBe('none');
});

test('llm.txt is served and every link in it resolves to the exact repository file', async ({ request }) => {
  const index = await request.get('/llm.txt');
  expect(index.ok()).toBe(true);
  expect(await index.text()).toBe(readFileSync('llm.txt', 'utf8'));
  const links = [...(await index.text()).matchAll(/\]\((elements\/[^)]+)\)/g)].map(match => match[1]);
  expect(links.length).toBeGreaterThanOrEqual(collection.entries.length);
  for (const link of links) {
    const response = await request.get(`/${link}`);
    expect(response.ok(), link).toBe(true);
    expect(await response.text(), link).toBe(readFileSync(link, 'utf8'));
  }
});

test('theme persists and layouts do not overflow from 320 to 1920 pixels', async ({ page }) => {
  await page.goto('/');
  const theme = page.getByRole('switch', { name: 'Toggle site theme' });
  await expect(theme).toHaveAttribute('aria-checked', 'false');
  await theme.click();
  await expect(theme).toHaveAttribute('aria-checked', 'true');
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.getByRole('switch', { name: 'Toggle site theme' })).toHaveAttribute('aria-checked', 'true');
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', '/#/line-loop', '/#/orbit-theme-toggle']) {
      await page.goto(path);
      await expect(page.locator('h1')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${path} at ${width}`).toBe(true);
    }
  }
});
