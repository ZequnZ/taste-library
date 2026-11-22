import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const collection = JSON.parse(readFileSync('collection.json', 'utf8'));

test('element navigation lists the group hierarchy and tracks the current page', async ({ page }) => {
  await page.goto('/#/letter-wave');
  const toggle = page.getByRole('button', { name: 'Show all elements' });
  if (await toggle.isVisible()) await toggle.click();
  const nav = page.getByRole('navigation', { name: 'All elements' });
  await expect(nav.getByRole('link')).toHaveCount(collection.entries.length);
  for (const family of collection.families) {
    const group = nav.locator('.element-group').filter({ has: page.locator(`#nav-group-${family.id}`) });
    await expect(group.getByRole('link')).toHaveText(collection.entries.filter(entry => entry.family === family.id).map(entry => entry.title));
    expect(await group.locator('ul').evaluate(el => el.getBoundingClientRect().left > el.parentElement.getBoundingClientRect().left)).toBe(true);
  }
  await expect(nav.locator('[aria-current="page"]')).toHaveText('Wave');
  await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
  await nav.getByRole('link', { name: 'Stitch', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Stitch');
  await page.getByRole('button', { name: 'Show all elements' }).click();
  await expect(page.getByRole('navigation', { name: 'All elements' }).locator('[aria-current="page"]')).toHaveText('Stitch');
  await expect(page.getByRole('navigation', { name: 'All elements' }).locator('[aria-current="page"]')).toHaveCount(1);
  await page.goBack();
  await page.getByRole('button', { name: 'Show all elements' }).click();
  const restoredNav = page.getByRole('navigation', { name: 'All elements' });
  await expect(restoredNav.locator('[aria-current="page"]')).toHaveText('Wave');
  await restoredNav.getByRole('link', { name: 'Jelly', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Jelly');
  await page.getByRole('button', { name: 'Show all elements' }).click();
  await expect(page.getByRole('navigation', { name: 'All elements' }).locator('[aria-current="page"]')).toHaveText('Jelly');
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: '← All details', exact: true }).click();
  await expect(nav).toHaveCount(0);
});

test('element groups collapse compactly and preserve the current item', async ({ page }) => {
  await page.setViewportSize({ width: 1536, height: 900 });
  await page.goto('/#/letter-wave');
  const nav = page.getByRole('navigation', { name: 'All elements' });
  const letter = nav.getByRole('button', { name: /Letter motion/ });
  const group = letter.locator('..');
  const chevron = letter.locator('.element-group-chevron');
  expect(Math.round((await nav.boundingBox()).width)).toBe(176);
  const chevronBox = await chevron.boundingBox();
  const headingBox = await letter.boundingBox();
  expect(await chevron.getAttribute('viewBox')).toBe('0 0 8 8');
  expect(await chevron.locator('path').getAttribute('d')).toBe('M2.5 1.5 5.5 4 2.5 6.5');
  expect(chevronBox.width).toBe(8);
  expect(chevronBox.height).toBe(8);
  expect(Math.abs(chevronBox.y + chevronBox.height / 2 - (headingBox.y + headingBox.height / 2))).toBeLessThan(1);
  expect(Math.abs(chevronBox.x + chevronBox.width - (headingBox.x + headingBox.width))).toBeLessThan(1);
  await letter.click();
  await expect(letter).toHaveAttribute('aria-expanded', 'false');
  await expect(group.locator('.element-group-current')).toBeVisible();
  await expect(group.locator('.element-group-current')).toHaveText('Wave');
  await expect(group.getByRole('link', { name: 'Wave', exact: true })).not.toBeVisible();
  await expect.poll(() => chevron.evaluate(el => {
    const matrix = new DOMMatrix(getComputedStyle(el).transform);
    return Math.atan2(matrix.b, matrix.a) * 180 / Math.PI;
  })).toBe(0);
  const collapsedBox = await chevron.boundingBox();
  expect(Math.abs(collapsedBox.x - chevronBox.x)).toBeLessThan(1);
  expect(Math.abs(collapsedBox.y - chevronBox.y)).toBeLessThan(1);
  await letter.click();
  await expect(group.getByRole('link', { name: 'Wave', exact: true })).toBeVisible();
});

test('collapsed current element markers stay centered with their labels', async ({ page }) => {
  for (const width of [1536, 1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const id of ['letter-doodle', 'line-loop']) {
      await page.goto(`/#/${id}`);
      if (width < 1528) await page.getByRole('button', { name: 'Show all elements' }).click();
      const group = page.locator('.element-group').filter({ has: page.locator('[aria-current="page"]') });
      await group.getByRole('button').click();
      const current = group.locator('.element-group-current');
      await expect(current).toBeVisible();
      await expect.poll(() => current.evaluate(el => el.getBoundingClientRect().height)).toBe(24);
      const alignment = await current.evaluate(el => {
        const range = document.createRange();
        range.selectNodeContents(el);
        const label = range.getBoundingClientRect();
        const row = el.getBoundingClientRect();
        const marker = getComputedStyle(el, '::before');
        const transform = new DOMMatrix(marker.transform);
        return {
          labelCenter: label.top + label.height / 2,
          markerCenter: row.top + parseFloat(marker.top) + transform.f + parseFloat(marker.height) / 2,
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      expect(Math.abs(alignment.markerCenter - alignment.labelCenter)).toBeLessThan(1);
      expect(alignment.overflow).toBe(false);
      await current.screenshot({ path: `.verification/collapsed-${id}-${width}.png` });
    }
  }
});

test('element list scrolls independently and keeps the active link in view', async ({ page }) => {
  for (const viewport of [{ width: 1536, height: 320 }, { width: 390, height: 500 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/#/line-loop');
    if (viewport.width < 1528) await page.getByRole('button', { name: 'Show all elements' }).click();
    const list = page.getByRole('region', { name: 'Element list' });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Loop flourish');
    await expect.poll(() => list.evaluate(el => el.scrollHeight > el.clientHeight && el.scrollTop > 0)).toBe(true);
    await expect.poll(() => list.evaluate(el => {
      const current = el.querySelector('[aria-current="page"]').getBoundingClientRect();
      const bounds = el.getBoundingClientRect();
      return current.top >= bounds.top && current.bottom <= bounds.bottom;
    })).toBe(true);
    await list.evaluate(el => { el.scrollTop = 0; });
    await page.evaluate(() => scrollTo(0, 0));
    await list.hover();
    await page.mouse.wheel(0, 300);
    await expect.poll(() => list.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    expect(await page.evaluate(() => scrollY)).toBe(0);
    const nav = page.getByRole('navigation', { name: 'All elements' });
    const navBox = await nav.boundingBox();
    const articleBox = await page.locator('.detail').boundingBox();
    if (viewport.width >= 1528) {
      expect(navBox.x + navBox.width).toBeLessThan(articleBox.x);
      const dividerBox = await page.locator('.element-nav-divider').boundingBox();
      expect(dividerBox).toEqual({ x: 175, y: 0, width: 1, height: viewport.height });
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
      expect(await page.locator('.element-nav-divider').boundingBox()).toEqual(dividerBox);
      expect((await nav.boundingBox()).y).toBeGreaterThanOrEqual(23);
    } else {
      expect(navBox.x).toBe(0);
      await page.keyboard.press('Escape');
      await expect(nav).toBeHidden();
      await expect(page.getByRole('button', { name: 'Show all elements' })).toBeFocused();
    }
  }
});

test('detail matches the centered homepage with comfortable navigation outside it', async ({ page }) => {
  for (const width of [390, 1024, 1440, 1527, 1528, 1536, 1920, 2560]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const homeBox = await page.locator('#app').boundingBox();
    await page.goto('/#/letter-wave');
    const nav = page.getByRole('navigation', { name: 'All elements' });
    const detailBox = await page.locator('.detail').boundingBox();
    const headerBox = await page.locator('.site-header').boundingBox();
    expect(detailBox.width).toBe(homeBox.width);
    expect(detailBox.x).toBe(homeBox.x);
    expect(detailBox.x).toBe(width - detailBox.x - detailBox.width);
    expect(headerBox.x).toBe(detailBox.x);
    expect(headerBox.width).toBe(detailBox.width);
    for (const selector of ['.back', '.detail-head', '.workbench']) {
      expect((await page.locator(selector).boundingBox()).x).toBe(detailBox.x);
    }
    if (width >= 1528) {
      await expect(nav).toBeVisible();
      const navBox = await nav.boundingBox();
      expect(navBox.x).toBe(0);
      expect(navBox.width).toBe(176);
      expect(detailBox.x - navBox.width).toBeGreaterThanOrEqual(48);
      await expect(page.locator('.element-nav-toggle')).toBeHidden();
    } else {
      await expect(nav).toBeHidden();
      await page.getByRole('button', { name: 'Show all elements' }).click();
      await expect(nav).toBeVisible();
      expect((await page.locator('.detail').boundingBox()).x).toBe(homeBox.x);
      await page.keyboard.press('Escape');
      await expect(nav).toBeHidden();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `.verification/centered-a-${width}.png`, fullPage: true });
    await page.goto('/');
    expect((await page.locator('.site-header').boundingBox()).x).toBe(homeBox.x);
  }
});

test('small screens use an expandable element navigation drawer', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto('/#/letter-wave');
  const toggle = page.getByRole('button', { name: 'Show all elements' });
  const nav = page.getByRole('navigation', { name: 'All elements' });
  await expect(toggle).toHaveText('');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(nav).toBeHidden();
  await toggle.click();
  const closeToggle = page.getByRole('button', { name: 'Hide all elements' });
  await expect(closeToggle).toHaveAttribute('aria-expanded', 'true');
  await expect(nav).toBeVisible();
  expect((await nav.boundingBox()).width).toBe(320);
  await closeToggle.click();
  await expect(nav).toBeHidden();
});
