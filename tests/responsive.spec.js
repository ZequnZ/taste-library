import { test, expect } from '@playwright/test';

for (const width of [320, 390, 768, 1024, 1440, 1920]) {
  test(`gallery, detail navigation, and live examples work at ${width}px`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.locator('#library-navigation')).toHaveCount(0);
    await expect(page.locator('[data-entry]')).toHaveCount(13);
    await expect(page.locator('.entry h2 a[href^="/entries/"]')).toHaveCount(13);
    await page.getByRole('button', { name: /Demonstrations/ }).click();
    await expect(page.locator('[data-entry]')).toHaveCount(5);
    await page.getByRole('button', { name: /Motion & interaction/ }).click();
    await expect(page.locator('[data-entry]')).toHaveCount(2);
    await page.getByRole('button', { name: /All/ }).click();
    await expect(page.locator('[data-entry]')).toHaveCount(5);
    await page.goto('/entries/lift-button/');
    const lift = page.frameLocator('.example-stage iframe').getByRole('button');
    await lift.click();
    await expect(lift).toHaveText('A little higher ✓');
    await page.goto('/entries/orbit-toggle/');
    const toggle = page.frameLocator('.example-stage iframe').getByRole('button');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await page.goto('/entries/tonal-palette/');
    const palette = page.frameLocator('.example-stage iframe');
    await palette.getByRole('button', { name: '#5e704d' }).click();
    await expect(palette.locator('output')).toHaveText('#5e704d');
    if (width < 860) {
      await expect(page.locator('#library-navigation')).toHaveAttribute('inert', '');
      await page.getByRole('button', { name: 'Open collection tree' }).click();
      await expect(page.getByRole('button', { name: 'Open collection tree' })).toHaveAttribute('aria-expanded', 'true');
      await expect(page.getByRole('button', { name: 'Close collection tree' })).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('button', { name: 'Open collection tree' })).toBeFocused();
      await page.getByRole('button', { name: 'Open collection tree' }).click();
      await page.getByRole('link', { name: 'Lift button', exact: true }).click();
      await expect(page).toHaveURL(/\/entries\/lift-button\/$/);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}
