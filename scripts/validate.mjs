import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';

const collection = JSON.parse(await readFile('collection.json', 'utf8'));
const index = await readFile('llm.txt', 'utf8');
const families = new Set(collection.families.map(family => family.id));
const kinds = new Set(collection.kinds.map(kind => kind.id));
const ids = new Set(collection.entries.map(entry => entry.id));
const list = async dir => (await readdir(dir)).filter(name => !name.startsWith('.'));

assert.equal(ids.size, collection.entries.length, 'Duplicate entry id');
await access(collection.requires.file);
await access(collection.requires.license);

// Rules per entry kind. React entries need a gallery renderer before they can be accepted.
const rules = {
  async html(entry) {
    assert.deepEqual(entry.files, [`elements/${entry.id}/${entry.id}.html`], `HTML entry must be one file named <id>.html: ${entry.id}`);
    const html = await readFile(entry.files[0], 'utf8');
    assert(!/<script/i.test(html), `Snippet must be HTML + CSS only: ${entry.id}`);
    assert(html.includes(':is(:hover, :focus-visible)'), `Snippet needs a hover/focus trigger: ${entry.id}`);
    assert(html.includes('prefers-reduced-motion'), `Snippet needs a reduced-motion rule: ${entry.id}`);
    assert(html.length < 2000, `Snippet is not concise (${html.length} bytes): ${entry.id}`);
  },
  async react(entry) {
    assert.fail(`React entries are not rendered by the gallery yet; add src/render/react.jsx first: ${entry.id}`);
  },
};

for (const entry of collection.entries) {
  assert(entry.title && entry.description, `Missing text: ${entry.id}`);
  assert(families.has(entry.family), `Unknown family: ${entry.family}`);
  assert(kinds.has(entry.kind), `Unknown kind: ${entry.kind} (${entry.id})`);
  for (const id of entry.related) assert(ids.has(id), `Unknown related entry: ${id}`);
  assert(entry.files?.length, `Missing files: ${entry.id}`);
  for (const file of entry.files) {
    assert(file.startsWith(`elements/${entry.id}/`), `File outside elements/${entry.id}/: ${file}`);
    await access(file);
  }
  const listed = (await list(`elements/${entry.id}`)).map(name => `elements/${entry.id}/${name}`);
  assert.deepEqual(listed.sort(), [...entry.files].sort(), `Folder and files list differ: ${entry.id}`);
  await rules[entry.kind](entry);
  assert(index.includes(`](${entry.files[0]})`), `Missing link in llm.txt: ${entry.files[0]}`);
}

for (const folder of await list('elements')) assert(ids.has(folder), `Folder without a collection entry: elements/${folder}`);

const localPath = /(?:\/Users\/|\/home\/|[A-Z]:\\Users\\)[^\s"]+/;
for (const [name, text] of [['collection.json', JSON.stringify(collection)], ['llm.txt', index]]) {
  assert(!localPath.test(text), `Local filesystem path in ${name}: ${text.match(localPath)?.[0]}`);
}

console.log(`Validated ${collection.entries.length} entries in ${families.size} families.`);
