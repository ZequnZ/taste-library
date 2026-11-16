import assert from 'node:assert/strict';
import { readFile, access, mkdir, copyFile } from 'node:fs/promises';
import { generateExamples } from './generate-examples.mjs';

const collection = JSON.parse(await readFile('collection.json', 'utf8'));
await generateExamples(collection);
const index = await readFile('llm.txt', 'utf8');
const categoryIds = new Set(collection.categories.map(category => category.id));
assert.equal(categoryIds.size, collection.categories.length);
const entries = [...collection.entries, ...collection.demonstrations];
assert.equal(new Set(entries.map(entry => entry.id)).size, entries.length);
for (const category of collection.categories) assert(index.includes(category.title), `Missing category: ${category.title}`);
for (const entry of entries) {
  assert(categoryIds.has(entry.category), `Unknown category: ${entry.category}`);
  assert(['family', 'element'].includes(entry.kind), `Unknown kind: ${entry.kind}`);
  assert(entry.title && entry.description);
  await access(entry.example);
  assert(index.includes(entry.example), `Missing index link: ${entry.example}`);
  for (const id of entry.related) assert(entries.some(candidate => candidate.id === id), `Unknown related entry: ${id}`);
}
assert(index.includes(`Confirmed collection: ${collection.entries.length} entries`));
for (const entry of collection.entries) await access(`entries/${entry.id}.md`);
await access('skills/taste-library/SKILL.md');
await access('docs/authoring.md');
await mkdir('public/examples', { recursive: true });
await copyFile('llm.txt', 'public/llm.txt');
await mkdir('public/entries', { recursive: true });
for (const entry of collection.entries) await copyFile(`entries/${entry.id}.md`, `public/entries/${entry.id}.md`);
for (const entry of entries) await copyFile(entry.example, `public/${entry.example}`);
await import('./generate-pages.mjs');
console.log(`Validated ${collection.categories.length} categories, ${collection.entries.length} confirmed entries, ${collection.demonstrations.length} demonstrations; published index and example files generated.`);
