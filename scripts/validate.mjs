import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import { basename, dirname, posix } from 'node:path';
import { transformWithEsbuild } from 'vite';
import { validatePlayground } from '../src/playground/config.js';

const collection = JSON.parse(await readFile('collection.json', 'utf8'));
const index = await readFile('llm.txt', 'utf8');
const packages = JSON.parse(await readFile('package.json', 'utf8'));
const families = new Set(collection.families.map(family => family.id));
const kinds = new Set(collection.kinds.map(kind => kind.id));
const ids = new Set(collection.entries.map(entry => entry.id));
const list = async dir => (await readdir(dir)).filter(name => !name.startsWith('.'));
const noComments = text => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const scoped = (name, id) => name === id || name.startsWith(`${id}-`);

assert.equal(ids.size, collection.entries.length, 'Duplicate entry id');
await access(collection.requires.file);
await access(collection.requires.license);

const rules = {
  async html(entry) {
    assert.deepEqual(entry.files, [`elements/${entry.id}/${entry.id}.html`], `HTML entry must be one file named <id>.html: ${entry.id}`);
    const html = await readFile(entry.files[0], 'utf8');
    assert(!/<script/i.test(html), `Snippet must be HTML + CSS only: ${entry.id}`);
    assert(html.includes(':is(:hover, :focus-visible)'), `Snippet needs a hover/focus trigger: ${entry.id}`);
    assert(html.includes('prefers-reduced-motion'), `Snippet needs a reduced-motion rule: ${entry.id}`);
    assert(Buffer.byteLength(html) < 2000, `Snippet is not concise (${Buffer.byteLength(html)} bytes): ${entry.id}`);
  },
  async react(entry) {
    await access('src/render/react.jsx');
    for (const dependency of ['react', 'react-dom']) {
      assert(packages.dependencies?.[dependency], `React gallery needs a runtime dependency: ${dependency}`);
    }
    const main = entry.files[0];
    const component = basename(main, '.jsx');
    assert(/^[A-Z][A-Za-z0-9]*\.jsx$/.test(basename(main)), `React main file must be <ComponentName>.jsx: ${entry.id}`);
    const cssFile = entry.files.find(file => file.endsWith('.css'));
    assert(entry.files.filter(file => file.endsWith('.css')).length <= 1, `React entry accepts one plain CSS file: ${entry.id}`);
    if (cssFile) assert.equal(basename(cssFile), `${component}.css`, `CSS must match component name: ${entry.id}`);
    let combinedJS = '';
    for (const file of entry.files) {
      assert(/\.(jsx|css)$/.test(file) && !file.endsWith('.module.css'), `React files must be JSX or plain CSS: ${file}`);
      const text = noComments(await readFile(file, 'utf8'));
      if (file.endsWith('.css')) {
        assert(text.includes('prefers-reduced-motion'), `React CSS needs a reduced-motion rule: ${entry.id}`);
        // Inspect selector preludes, not declarations (where decimals are not classes).
        for (const [, selector] of text.matchAll(/([^{}]+)\{/g)) {
          for (const [, name] of selector.matchAll(/\.([A-Za-z_][\w-]*)/g)) {
            assert(scoped(name, entry.id), `CSS class must use entry prefix: ${name} (${entry.id})`);
          }
        }
        assert(!/@import\b|@apply\b/.test(text), `React CSS must be self-contained, without imports or Tailwind: ${file}`);
        continue;
      }
      combinedJS += text;
      // Vite's compiler checks valid plain JSX and rejects leftover TS syntax.
      const result = await transformWithEsbuild(text, file, { loader: 'jsx', jsx: 'transform' });
      if (file === main) {
        assert(/\bexport\s*\{[^}]*\bas\s+default\b|\bexport\s+default\b/.test(result.code), `React main file needs a default export: ${entry.id}`);
      }
      assert(!/\brequire\s*\(|\bimport\s*\(/.test(text), `React entry must use static imports: ${file}`);
      const imports = [...result.code.matchAll(/\b(?:import|export)\s+(?:[^;]*?\s+from\s*)?["']([^"']+)["']/g)].map(match => match[1]);
      for (const specifier of imports) {
        if (specifier === 'react') continue;
        if (specifier.startsWith('./')) {
          assert(!specifier.slice(2).includes('/'), `React import must stay in the same folder: ${specifier}`);
          assert(entry.files.includes(posix.join(dirname(file), specifier)), `React import must be a listed file: ${specifier}`);
          continue;
        }
        const dependency = specifier.startsWith('@') ? specifier.split('/').slice(0, 2).join('/') : specifier.split('/')[0];
        assert(entry.dependencies?.[dependency] && packages.dependencies?.[dependency], `React import needs an approved, declared dependency: ${specifier} (${entry.id})`);
      }
      if (file === main && cssFile) assert(imports.includes(`./${basename(cssFile)}`), `Component must import its CSS: ${entry.id}`);
      // Check literal class tokens, including the fixed part of template strings.
      for (const [, quote, classes] of text.matchAll(/\bclassName\s*=\s*\{?\s*(["'`])([\s\S]*?)\1/g)) {
        const literal = quote === '`' ? classes.replace(/\$\{[^}]*\}/g, '') : classes;
        for (const name of literal.trim().split(/\s+/).filter(Boolean)) {
          assert(scoped(name, entry.id), `JSX class must use entry prefix: ${name} (${entry.id})`);
        }
      }
    }
    assert(combinedJS.includes('prefers-reduced-motion'), `React JS needs reduced-motion handling: ${entry.id}`);
    // No-required-props and actual reduced-motion behaviour are covered by browser tests.
  },
};

for (const entry of collection.entries) {
  assert(/^[a-z][a-z0-9-]*$/.test(entry.id), `Invalid entry id: ${entry.id}`);
  assert(entry.title && entry.description, `Missing text: ${entry.id}`);
  assert(families.has(entry.family), `Unknown family: ${entry.family}`);
  assert(kinds.has(entry.kind) && rules[entry.kind], `Unknown kind: ${entry.kind} (${entry.id})`);
  const origin = entry.origin ?? collection.origin;
  for (const key of ['source', 'context', 'permission']) {
    assert(typeof origin?.[key] === 'string' && origin[key].trim(), `Missing origin ${key}: ${entry.id}`);
  }
  assert(Array.isArray(entry.related), `Missing related entries: ${entry.id}`);
  for (const id of entry.related) assert(ids.has(id), `Unknown related entry: ${id}`);
  assert(entry.files?.length, `Missing files: ${entry.id}`);
  for (const file of entry.files) {
    assert(file.startsWith(`elements/${entry.id}/`) && file.split('/').length === 3 && posix.normalize(file) === file && !file.includes('\\'), `File outside elements/${entry.id}/: ${file}`);
    await access(file);
  }
  const listed = (await list(`elements/${entry.id}`)).map(name => `elements/${entry.id}/${name}`);
  assert.deepEqual(listed.sort(), [...entry.files].sort(), `Folder and files list differ: ${entry.id}`);
  await rules[entry.kind](entry);
  if (entry.playground !== undefined) {
    assert.equal(entry.kind, 'react', `Playgrounds are for React entries: ${entry.id}`);
    validatePlayground(entry.playground);
    if (entry.playground.demo) await access(`src/playground/demos/${entry.playground.demo}.jsx`);
  }
  assert(index.includes(`](${entry.files[0]})`), `Missing link in llm.txt: ${entry.files[0]}`);
}

for (const folder of await list('elements')) assert(ids.has(folder), `Folder without a collection entry: elements/${folder}`);

const localPath = /(?:\/Users\/|\/home\/|[A-Z]:\\Users\\)[^\s"]+/;
for (const [name, text] of [['collection.json', JSON.stringify(collection)], ['llm.txt', index]]) {
  assert(!localPath.test(text), `Local filesystem path in ${name}: ${text.match(localPath)?.[0]}`);
}

console.log(`Validated ${collection.entries.length} entries in ${families.size} families.`);
