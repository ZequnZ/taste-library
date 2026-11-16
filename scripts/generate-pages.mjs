import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { renderHomeHeader, renderNavigation, renderEntry } from '../src/navigation.js';
import { generateExamples } from './generate-examples.mjs';

const collection = createRequire(import.meta.url)('../collection.json');
await generateExamples(collection);
const overview = `<main id="main-content" class="library-canvas"><header class="library-heading"><div><p class="eyebrow">Personal design archive</p><h1>Taste Library</h1></div><p>A small, working archive of details worth keeping.</p></header><div class="library-modes" role="group" aria-label="Library view"><button class="selected" data-library-mode="collection" aria-pressed="true">Collection <span>02</span></button><button data-library-mode="demonstrations" aria-pressed="false">Demonstrations <span>05</span></button></div><div class="gallery-toolbar"><nav id="categories" aria-label="Filter by category"></nav></div><div id="gallery" class="grid" aria-live="polite"></div><p id="view-note" class="demo-note"></p><footer class="content-footer"><span>Built for people and agents.</span><a href="/llm.txt">Read the index</a></footer></main>`;
const htmlPage = ({ title, description, body, script }) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="${description}">
  <title>${title}</title>
  <link rel="icon" href="data:,">
  <link rel="stylesheet" href="/src/style.css">
  <link rel="stylesheet" href="/src/detail.css">
</head>
<body>
  <a class="skip-link" href="#main-content">Skip to this page</a>
  ${body}
  <script type="module" src="${script}"></script>
</body>
</html>
`;

for (const entry of [...collection.entries, ...collection.demonstrations]) {
  const directory = `entries/${entry.id}`;
  await mkdir(directory, { recursive: true });
  const source = await readFile(entry.example, 'utf8');
  const body = `<div data-site-shell>${renderNavigation({ activeId: entry.id })}<main id="main-content" data-page-content>${renderEntry(entry, source)}</main></div></div>`;
  await writeFile(`${directory}/index.html`, htmlPage({
    title: `${entry.title} — Taste Library`,
    description: `${entry.title}: ${entry.description} A study in the Taste Library design archive.`,
    body,
    script: '/src/entry.js',
  }));
}
await writeFile('index.html', htmlPage({
  title: 'Taste Library',
  description: 'A personal collection of design references, visual families, and interactive elements.',
  body: `${renderHomeHeader()}${overview.replace('Collection <span>02</span>', `Collection <span>${String(collection.entries.length).padStart(2, '0')}</span>`)}`,
  script: '/src/main.js',
}));
console.log(`Generated the library overview and ${collection.entries.length + collection.demonstrations.length} permanent study pages.`);
