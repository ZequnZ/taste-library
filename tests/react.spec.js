import { test, expect } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const folder = 'elements/orbit-theme-toggle';
const switchIn = page => page.getByRole('switch', { name: 'Dark mode' });
const pivot = page => page.locator('.orbit-theme-toggle-pivot');

// A separate Vite page verifies copied files without any gallery renderer or styles.
test.beforeAll(() => {
  mkdirSync('.verification', { recursive: true });
  writeFileSync('.verification/react-standalone.html', `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Standalone React test</title></head>
<body style="color:rgb(20,40,60);--accent:#2468ac"><div id="test"></div>
<script type="module">
import React from 'react';
import { createRoot } from 'react-dom/client';
import OrbitThemeToggle from '/elements/orbit-theme-toggle/OrbitThemeToggle.jsx?gallery';
const params = new URLSearchParams(location.search);
function Harness() {
  const [dark, setDark] = React.useState(false);
  const [changes, setChanges] = React.useState(0);
  const controlled = params.has('controlled');
  const props = controlled ? { isDark: dark, onChange: value => { setDark(value); setChanges(count => count + 1); } } : {};
  if (params.has('tuned')) Object.assign(props, { size: 96, iconSize: 40, orbitRadius: 56, orbitAngle: 90, duration: 1600, easing: 'linear', fade: false, keepUpright: false });
  return React.createElement(React.Fragment, null,
    React.createElement(OrbitThemeToggle, props),
    controlled && React.createElement('output', null, String(dark) + ':' + changes));
}
createRoot(document.querySelector('#test')).render(React.createElement(Harness));
</script></body></html>`);
});

test('Components card previews on hover and keyboard focus, then opens the detail', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('[data-entry="orbit-theme-toggle"].card');
  const toggle = card.locator('[role="switch"]');
  await expect(page.locator('#family-components')).toHaveText('Components 1');
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await card.hover();
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await page.mouse.move(0, 0);
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await card.focus();
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Orbit theme toggle');
  await expect(switchIn(page)).toHaveAttribute('aria-checked', 'false');
});

test('React detail toggles by mouse and keyboard, reverses mid-spin, and holds', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/#/orbit-theme-toggle');
  const toggle = switchIn(page);
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  // Mid-transition, the orbit is not yet at either resting rotation.
  await expect.poll(() => pivot(page).evaluate(el => {
    const angle = Math.atan2(new DOMMatrix(getComputedStyle(el).transform).b, new DOMMatrix(getComputedStyle(el).transform).a) * 180 / Math.PI;
    return angle < -1 && angle > -74;
  })).toBe(true);
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await expect.poll(() => pivot(page).evaluate(el => getComputedStyle(el).transform)).toBe('matrix(1, 0, 0, 1, 0, 0)');
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  const hold = page.getByRole('button', { name: 'Hold active' });
  await hold.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await hold.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await page.getByRole('link', { name: '← All details', exact: true }).click();
  await page.locator('[data-entry="orbit-theme-toggle"].card').click();
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  expect(errors).toEqual([]);
});

test('React code selector displays and copies both exact source files', async ({ page, request }) => {
  await page.goto('/#/orbit-theme-toggle');
  await page.getByRole('tab', { name: 'Code', exact: true }).click();
  for (const file of ['OrbitThemeToggle.jsx', 'OrbitThemeToggle.css']) {
    const path = `${folder}/${file}`;
    await page.getByLabel('Code file').selectOption(path);
    const text = readFileSync(path, 'utf8');
    await expect.poll(() => page.locator('#source').textContent()).toBe(text);
    await page.getByRole('button', { name: 'Copy', exact: true }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(text);
    await expect(page.locator('#copy-status')).toHaveText(`Copied ${file} to clipboard.`);
    const response = await request.get(`/${path}`);
    expect(response.ok()).toBe(true);
    expect(await response.text()).toBe(text);
  }
  await expect(page.getByRole('button', { name: 'Hold active' })).toBeHidden();
});

test('copied React component works with no props and with controlled state', async ({ page }) => {
  await page.goto('/.verification/react-standalone.html');
  const toggle = switchIn(page);
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  expect(await toggle.evaluate(el => getComputedStyle(el).color)).toBe('rgb(20, 40, 60)');
  expect(await toggle.evaluate(el => getComputedStyle(el).borderTopColor)).toBe('rgb(36, 104, 172)');
  await toggle.focus();
  expect(await toggle.evaluate(el => getComputedStyle(el).outlineStyle)).toBe('solid');
  await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await page.goto('/.verification/react-standalone.html?controlled');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('output')).toHaveText('true:1');
  await toggle.click();
  await expect(page.locator('output')).toHaveText('false:2');
});

test('original sizing and motion options work and reduced motion updates live', async ({ page }) => {
  await page.goto('/.verification/react-standalone.html?tuned');
  const toggle = switchIn(page);
  expect((await toggle.boundingBox()).width).toBe(96);
  await expect(page.locator('.orbit-theme-toggle-icon svg').first()).toHaveAttribute('width', '40');
  expect(await pivot(page).evaluate(el => getComputedStyle(el).transitionDuration)).toBe('1.6s');
  expect(await pivot(page).evaluate(el => getComputedStyle(el).transitionTimingFunction)).toBe('linear');
  expect(await page.locator('.orbit-theme-toggle-icon').last().evaluate(el => getComputedStyle(el).opacity)).toBe('1');
  await toggle.click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => pivot(page).evaluate(el => getComputedStyle(el).transitionDuration)).toBe('0s');
  await expect.poll(() => toggle.evaluate(el => el.style.getPropertyValue('--orbit-theme-toggle-duration'))).toBe('0ms');
  expect(await page.locator('.orbit-theme-toggle-icon').first().evaluate(el => getComputedStyle(el).transitionDuration)).toBe('0s');
  await toggle.click();
  expect(await pivot(page).evaluate(el => getComputedStyle(el).transform)).toBe('matrix(1, 0, 0, 1, 0, 0)');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect.poll(() => pivot(page).evaluate(el => getComputedStyle(el).transitionDuration)).toBe('1.6s');
});

test('delayed React imports preserve card focus and clean up during navigation', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let release;
  let requested;
  const pending = new Promise(resolve => { release = resolve; });
  const intercepted = new Promise(resolve => { requested = resolve; });
  await page.route('**/elements/orbit-theme-toggle/OrbitThemeToggle.jsx?gallery*', async route => {
    const response = await route.fetch();
    requested();
    await pending;
    await route.fulfill({ response });
  });
  await page.goto('/');
  await intercepted;
  const card = page.locator('.card[data-entry="orbit-theme-toggle"]');
  await card.focus();
  release();
  await expect(card.locator('[role="switch"]')).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('Enter');
  await expect(switchIn(page)).toHaveAttribute('aria-checked', 'false');
  // Navigate away before the asynchronously loaded detail can finish mounting.
  await page.evaluate(() => {
    location.hash = '/letter-wave';
    setTimeout(() => { location.hash = '/orbit-theme-toggle'; }, 0);
  });
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Orbit theme toggle');
  await expect(switchIn(page)).toHaveCount(1);
  await page.getByRole('link', { name: '← All details', exact: true }).click();
  await expect(card.locator('[role="switch"]')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('React preview and code have no responsive overflow in either theme', async ({ page }) => {
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/#/orbit-theme-toggle');
    await expect(switchIn(page)).toBeVisible();
    for (const dark of [false, true]) {
      if ((await page.locator('html').getAttribute('class') ?? '').includes('dark') !== dark) await page.locator('#theme').click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `preview at ${width}, dark=${dark}`).toBe(true);
      await page.getByRole('tab', { name: 'Code', exact: true }).click();
      await page.getByLabel('Code file').selectOption(`${folder}/OrbitThemeToggle.css`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `code at ${width}, dark=${dark}`).toBe(true);
      await page.getByRole('tab', { name: 'Preview', exact: true }).click();
    }
    if ([320, 1920].includes(width)) await page.screenshot({ path: `.verification/orbit-detail-${width}.png`, fullPage: true });
  }
});
