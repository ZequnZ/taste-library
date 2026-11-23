import { test, expect } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { defaultsFor, usageFor, validatePlayground, valuesFor } from '../src/playground/config.js';

const collection = JSON.parse(readFileSync('collection.json', 'utf8'));
const entry = collection.entries.find(entry => entry.id === 'orbit-theme-toggle');
const config = entry.playground;
const toggleIn = page => page.getByRole('switch', { name: 'Dark mode' });
const controlIn = (page, name) => page.locator(`#playground-${name}`);
const usageIn = page => page.locator('.playground-usage code');

async function moveRange(page, name, value) {
  const control = controlIn(page, name);
  await control.focus();
  await control.press('Home');
  const metadata = config.controls.find(control => control.name === name);
  const steps = (value - metadata.min) / (metadata.step ?? 1);
  for (let index = 0; index < steps; index++) await control.press('ArrowRight');
  await expect(control).toHaveValue(String(value));
}

test.beforeAll(() => {
  mkdirSync('.verification', { recursive: true });
  writeFileSync('.verification/playground-generic.html', `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Generic playground test</title><link rel="stylesheet" href="/src/style.css"></head><body><div id="preview"></div><div id="controls"></div>
<script type="module">
import React from 'react';
import { createRoot } from 'react-dom/client';
import Playground from '/src/playground/Playground.jsx';
function Sample({ count = 3, tone = 'soft', enabled = true }) {
  const [clicks, setClicks] = React.useState(0);
  return React.createElement('button', { onClick: () => setClicks(value => value + 1) }, count + ':' + tone + ':' + enabled + ':' + clicks);
}
const entry = { files: ['Sample.jsx'], playground: { controls: [
  { name: 'count', label: 'Count', type: 'range', default: 3, min: 1, max: 5 },
  { name: 'tone', label: 'Tone', type: 'select', default: 'soft', options: [{ label: 'Soft', value: 'soft' }, { label: 'Bold', value: 'bold' }] },
  { name: 'enabled', label: 'Enabled', type: 'boolean', default: true }
] } };
createRoot(document.querySelector('#preview')).render(React.createElement(Playground, { Component: Sample, entry, controlsHost: document.querySelector('#controls') }));
</script></body></html>`);
});

test('shared panel works without a demo adapter and keeps arbitrary component state', async ({ page }) => {
  await page.goto('/.verification/playground-generic.html');
  const sample = page.locator('#preview button');
  await expect(sample).toHaveText('3:soft:true:0');
  await sample.click();
  await page.getByRole('slider', { name: 'Count' }).focus();
  await page.keyboard.press('ArrowRight');
  await page.getByLabel('Tone', { exact: false }).selectOption('bold');
  await page.getByRole('checkbox', { name: 'Enabled' }).uncheck();
  await expect(sample).toHaveText('4:bold:false:1');
  await expect(usageIn(page)).toHaveText('<Sample\n  count={4}\n  tone={"bold"}\n  enabled={false}\n/>');
  await page.getByRole('button', { name: 'Reset defaults' }).click();
  await expect(sample).toHaveText('3:soft:true:1');
  await expect(usageIn(page)).toHaveText('<Sample />');
});

test('generic playground metadata validates types, defaults and usage without demo leakage', () => {
  validatePlayground(config);
  const defaults = defaultsFor(config);
  expect(usageFor('OrbitThemeToggle', config, defaults)).toBe('<OrbitThemeToggle />');
  const changed = { ...defaults, duration: 1200, easing: 'linear', fade: false, showOrbit: true };
  expect(usageFor('OrbitThemeToggle', config, changed)).toBe('<OrbitThemeToggle\n  duration={1200}\n  easing={"linear"}\n  fade={false}\n/>');
  expect(valuesFor(config, changed)).not.toHaveProperty('showOrbit');
  expect(valuesFor(config, changed, 'demo')).toEqual({ showOrbit: true });
  const make = control => ({ controls: [control] });
  const range = { name: 'size', label: 'Size', type: 'range', min: 10, max: 50, step: 2, default: 20 };
  for (const invalid of [
    make({ ...range, min: 50 }), make({ ...range, default: 80 }), make({ ...range, step: 0 }), make({ ...range, default: 21 }),
    make({ ...range, name: 'not-a-prop' }), make({ ...range, name: undefined }), { controls: [range, range] },
    make({ name: 'fade', label: 'Fade', type: 'boolean', default: 'true' }),
    make({ name: 'easing', label: 'Easing', type: 'select', default: 'ease', options: [{ label: 'Linear', value: 'linear' }] }),
    make({ name: 'guide', label: 'Guide', type: 'boolean', default: false, scope: 'demo' }),
  ]) expect(() => validatePlayground(invalid)).toThrow();
});

test('orbit playground exposes every control and live defaults match component defaults', async ({ page }) => {
  await page.goto('/#/orbit-theme-toggle');
  await expect(page.getByRole('heading', { name: 'Play with the props' })).toBeVisible();
  for (const control of config.controls) {
    const input = controlIn(page, control.name);
    await expect(input).toHaveAccessibleName(new RegExp(control.label));
    if (control.type === 'boolean') {
      if (control.default) await expect(input).toBeChecked();
      else await expect(input).not.toBeChecked();
    } else await expect(input).toHaveValue(String(control.default));
  }
  await expect(usageIn(page)).toHaveText('<OrbitThemeToggle />');
  await expect(page.getByRole('button', { name: 'Reset defaults' })).toBeDisabled();
  await expect(page.locator('.orbit-demo-state')).toHaveText('Light mode');
  await toggleIn(page).click();
  await expect(page.locator('.orbit-demo-state')).toHaveText('Dark mode');
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  await page.getByText('More options & notes', { exact: true }).click();
  await expect(page.locator('.playground-notes')).toContainText('sunIcon and moonIcon');
});

test('live controls preserve native state, tabs and Hold; reset restores props without remount', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#/orbit-theme-toggle');
  const toggle = toggleIn(page);
  await toggle.click();
  await toggle.evaluate(el => { window.originalToggle = el; });
  await moveRange(page, 'orbitAngle', 90);
  await moveRange(page, 'orbitRadius', 56);
  await moveRange(page, 'duration', 1200);
  await moveRange(page, 'size', 96);
  await moveRange(page, 'iconSize', 40);
  await controlIn(page, 'easing').selectOption('linear');
  await controlIn(page, 'fade').uncheck();
  await controlIn(page, 'keepUpright').uncheck();
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  expect(await toggle.evaluate(el => el === window.originalToggle)).toBe(true);
  expect((await toggle.boundingBox()).width).toBe(96);
  await expect(toggle.locator('.orbit-theme-toggle-icon svg').first()).toHaveAttribute('width', '40');
  expect(await toggle.locator('.orbit-theme-toggle-pivot').evaluate(el => el.style.transform)).toBe('rotate(-90deg)');
  expect(await toggle.locator('.orbit-theme-toggle-position').first().evaluate(el => el.style.transform)).toBe('rotate(0deg) translateY(-56px)');
  expect(await toggle.evaluate(el => getComputedStyle(el).getPropertyValue('--orbit-theme-toggle-easing'))).toBe('linear');
  expect(await toggle.locator('.orbit-theme-toggle-icon').last().evaluate(el => el.style.opacity)).toBe('1');
  expect(await toggle.locator('.orbit-theme-toggle-icon').first().evaluate(el => el.style.transform)).toBe('translate(-50%, -50%) rotate(0deg)');
  await expect(usageIn(page)).toContainText('duration={1200}');
  await expect(usageIn(page)).toContainText('keepUpright={false}');
  await page.getByRole('tab', { name: 'Code', exact: true }).click();
  await expect(page.locator('.playground')).toBeHidden();
  await page.getByRole('tab', { name: 'Preview', exact: true }).click();
  await expect(controlIn(page, 'size')).toHaveValue('96');
  await toggle.click();
  const hold = page.getByRole('button', { name: 'Hold active' });
  await hold.click();
  await expect(page.locator('.orbit-demo-state')).toHaveText('Dark mode · Held active');
  await controlIn(page, 'fade').check();
  await hold.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await toggle.click();
  await page.getByRole('button', { name: 'Reset defaults' }).click();
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  expect(await toggle.evaluate(el => el === window.originalToggle)).toBe(true);
  await expect(usageIn(page)).toHaveText('<OrbitThemeToggle />');
  await expect(controlIn(page, 'size')).toHaveValue('72');
  await page.getByRole('link', { name: '← All details', exact: true }).click();
  await page.locator('.card[data-entry="orbit-theme-toggle"]').click();
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await expect(controlIn(page, 'size')).toHaveValue('72');
});

test('usage copies current props; demo-only guide and original source stay separate', async ({ page }) => {
  await page.goto('/#/orbit-theme-toggle');
  await controlIn(page, 'fade').uncheck();
  await controlIn(page, 'showOrbit').check();
  await expect(page.locator('.orbit-demo-guide')).toBeVisible();
  expect(await toggleIn(page).evaluate(el => getComputedStyle(el).overflow)).toBe('visible');
  await expect(usageIn(page)).toHaveText('<OrbitThemeToggle\n  fade={false}\n/>');
  await page.getByRole('button', { name: 'Copy usage', exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('<OrbitThemeToggle\n  fade={false}\n/>');
  await expect(page.locator('.playground-copy-status')).toHaveText('Copied usage to clipboard.');
  await controlIn(page, 'showOrbit').uncheck();
  expect(await toggleIn(page).evaluate(el => getComputedStyle(el).overflow)).toBe('hidden');
  await page.getByRole('button', { name: 'Copy', exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(readFileSync(entry.files[0], 'utf8'));
  await page.getByRole('tab', { name: 'Code', exact: true }).click();
  await page.getByLabel('Code file').selectOption(entry.files[1]);
  await page.getByRole('button', { name: 'Copy', exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(readFileSync(entry.files[1], 'utf8'));
  await page.getByRole('tab', { name: 'Preview', exact: true }).click();
  await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('Blocked')) } }); });
  await page.getByRole('button', { name: 'Copy usage', exact: true }).click();
  await expect(page.locator('.playground-copy-status')).toContainText('Select the usage example');
});

test('motion controls honor reduced motion live and all responsive controls stay in bounds', async ({ page }) => {
  await page.goto('/#/orbit-theme-toggle');
  await moveRange(page, 'duration', 2000);
  await toggleIn(page).click();
  await expect.poll(() => toggleIn(page).locator('.orbit-theme-toggle-pivot').evaluate(el => getComputedStyle(el).transitionDuration)).toBe('2s');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => toggleIn(page).evaluate(el => el.style.getPropertyValue('--orbit-theme-toggle-duration'))).toBe('0ms');
  await moveRange(page, 'duration', 3000);
  await expect.poll(() => toggleIn(page).evaluate(el => el.style.getPropertyValue('--orbit-theme-toggle-duration'))).toBe('0ms');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect.poll(() => toggleIn(page).locator('.orbit-theme-toggle-pivot').evaluate(el => getComputedStyle(el).transitionDuration)).toBe('3s');
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const dark of [false, true]) {
      if ((await page.locator('html').getAttribute('class') ?? '').includes('dark') !== dark) await page.locator('#theme').click();
      await controlIn(page, 'showOrbit').check();
      await controlIn(page, 'orbitRadius').focus();
      await page.keyboard.press('End');
      for (const control of config.controls) {
        const box = await controlIn(page, control.name).boundingBox();
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}, dark=${dark}`).toBe(true);
      await controlIn(page, 'showOrbit').uncheck();
    }
  }
});
