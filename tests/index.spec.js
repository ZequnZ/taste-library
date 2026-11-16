import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const collection = JSON.parse(readFileSync('collection.json', 'utf8'));

 test('agent index lists every category, confirmed entry, and demonstration', async () => {
  const index = readFileSync('public/llm.txt', 'utf8');
  for (const category of collection.categories) expect(index).toContain(category.title);
  for (const entry of collection.demonstrations) expect(index).toContain(entry.example);
  for (const entry of collection.entries) expect(index).toContain(entry.example);
  expect(index).toContain(`Confirmed collection: ${collection.entries.length} entries`);
  expect(index).toContain('Demonstrations are unapproved scaffold examples');
 });
