import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

 test('preview/code tabs preserve live state and support keyboard navigation', async ({ page }) => {
  await page.goto('/entries/orbit-toggle/');
  const toggle = page.frameLocator('.example-stage iframe').getByRole('button');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('tab', { name: 'Code', exact: true }).click();
  await expect(page.locator('#preview-panel')).toBeHidden();
  await expect(page.locator('#code-panel')).toBeVisible();
  await expect(page.locator('#code-panel code')).toHaveText(readFileSync('examples/orbit-toggle.html', 'utf8'));
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('tab', { name: 'Preview', exact: true })).toBeFocused();
  await expect(page.getByRole('tab', { name: 'Preview', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('End');
  await expect(page.getByRole('tab', { name: 'Code', exact: true })).toBeFocused();
  await page.keyboard.press('Home');
  await expect(page.getByRole('tab', { name: 'Preview', exact: true })).toBeFocused();
 });

 test('detail page returns to the gallery and navigates from the collection tree', async ({ page }) => {
   await page.goto('/entries/lift-button/');
   await page.getByRole('link', { name: 'Orbit toggle', exact: true }).click();
   await expect(page).toHaveURL(/\/entries\/orbit-toggle\/$/);
   await page.getByRole('link', { name: 'Gallery', exact: true }).click();
   await expect(page).toHaveURL(/\/$/);
 });

for (const width of [320, 390, 768, 1024, 1440, 1920]) {
  test(`detail layout and code panel have no overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const id of ['quiet-editorial', 'lift-button', 'orbit-toggle', 'editorial-type', 'tonal-palette']) {
      await page.goto(`/entries/${id}/`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.getByRole('tab', { name: 'Code', exact: true }).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (width >= 860) {
        const sidebar = await page.locator('#library-navigation').boundingBox();
        await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
        expect(Math.abs((await page.locator('#library-navigation').boundingBox()).y - sidebar.y)).toBeLessThan(1);
      }
    }
    if ([390, 768, 1024, 1440].includes(width)) {
      await page.goto('/entries/lift-button/');
      await page.screenshot({ path: `.verification/detail-${width}.png`, fullPage: true });
    }
  });
}
