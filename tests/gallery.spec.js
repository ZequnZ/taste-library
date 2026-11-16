import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const collection = JSON.parse(readFileSync('collection.json', 'utf8'));

test('opens permanent entry pages from the overview, without a dialog', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Taste Library' })).toBeVisible();
  await expect(page.locator('[data-entry]')).toHaveCount(collection.entries.length);
  await expect(page.locator('#library-navigation')).toHaveCount(0);
  await page.getByRole('button', { name: /Demonstrations/ }).click();
  await page.locator('.entry h2 a[href="/entries/lift-button/"]').click();
  await page.waitForURL('**/entries/lift-button/');
  await expect(page.getByRole('heading', { name: 'Lift button', exact: true })).toBeVisible();
  await expect(page.locator('#library-navigation a[aria-current="page"]')).toHaveText('Lift button');
  await expect(page.locator('.example-stage iframe')).toBeVisible();
  expect(await page.title()).toBe('Lift button — Taste Library');
  expect(await page.getByRole('dialog').count()).toBe(0);

  await page.getByText('Inspect source', { exact: true }).click();
  await expect(page.locator('#source-code')).toContainText('lift-button');
  await page.getByRole('button', { name: 'Copy source', exact: true }).click();
  await expect(page.locator('#copy-status')).toHaveText('Complete HTML copied to your clipboard.');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(readFileSync('examples/lift-button.html', 'utf8'));
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Lift button', exact: true })).toBeVisible();
  await page.goBack();
  expect(page.url()).toContain('/');
  expect(errors).toEqual([]);
});

test('all static pages expose real content, navigation, and entry sections', async ({ page, request }) => {
  for (const entry of [...collection.entries, ...collection.demonstrations]) {
    const url = `/entries/${entry.id}/`;
    const response = await request.get(url);
    expect(response.ok()).toBe(true);
    const html = await response.text();
    expect(html).toContain(`<h1>${entry.title}</h1>`);
    expect(html).toContain('id="overview"');
    expect(html).toContain('id="notes"');
    expect(html).toContain('id="reuse"');
    expect(html).toContain(collection.demonstrations.some(item => item.id === entry.id) ? 'Unapproved demonstration' : 'Confirmed collection');
    await page.goto(url);
    await expect(page.locator('#library-navigation .item-link')).toHaveCount(collection.demonstrations.length + collection.entries.length * (collection.entries.some(item => item.id === entry.id) ? 1 : 2));
    await expect(page.locator('#library-navigation a[aria-current="page"]')).toHaveAttribute('href', url);
    await page.getByRole('button', { name: 'Switch to dark theme' }).click();
    await expect(page.locator('body')).toHaveClass('dark');
    await page.reload();
    await expect(page.locator('body')).toHaveClass('dark');
    await page.getByRole('button', { name: 'Switch to light theme' }).click();
    await expect(page.locator('body')).not.toHaveClass('dark');
  }
});
