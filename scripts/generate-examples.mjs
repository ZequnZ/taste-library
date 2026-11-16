import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';

export async function generateExamples(collection) {
  const studies = new Map();
  for (const entry of collection.entries.filter(item => item.variant)) {
    if (!studies.has(entry.study)) studies.set(entry.study, await readFile(`examples/idea-${entry.study}.html`, 'utf8'));
    const source = studies.get(entry.study);
    const articles = [...source.matchAll(/<article class="variant">[\s\S]*?<\/article>/g)];
    let article = articles.find(match => match[0].includes(`id="variant-${entry.variant}"`))?.[0];
    assert(article, `Missing variant: ${entry.id}`);
    // One treatment per entry: letter motions drop the underline; underlines keep still letters.
    article = entry.study === 'motion'
      ? article.replace(/<svg class="idea-line[\s\S]*?<\/svg>/, '')
      : article.replace(' data-motion="doodle"', '');
    assert(entry.study === 'motion' ? !article.includes('idea-line') : !article.includes('data-motion'), `Mixed treatment: ${entry.id}`);
    const family = entry.study === 'motion' ? 'Letter motion' : 'Dashed line';
    let html = source.replace(/<div class="grid">[\s\S]*?<\/article><\/div>/, `<div class="grid">${article.replace('aria-pressed="false"', 'aria-pressed="true"')}</div>`);
    html = html.replaceAll(`${family} · Taste Library`, `${entry.title} · Taste Library`)
      .replace(`${family}: an interactive Taste Library study.`, `${entry.title}: an individual Taste Library study.`)
      .replace(`<h1>${family}</h1>`, `<h1>${entry.title}</h1>`)
      .replace(/<p class="lede">[\s\S]*?<\/p>/, `<p class="lede">${entry.description} Hover, focus, or use Replay.</p>`)
      .replace(/Selected · <strong>[^<]*<\/strong>/, `Selected · <strong>${entry.title}</strong>`)
      .replace('prepare();', 'prepare();\nselect(controls[0]);')
      .replace(/<p class="note" id="motion-note">[\s\S]*?<\/p>/, '<p class="note" id="motion-note">Replay restarts this treatment. Hover or focus to keep the preview active.</p>')
      .replace("control.addEventListener('click', () => { select(control); active(control, true); });", "control.addEventListener('click', () => { select(control); replay(control); });")
      .replace('</style>', '\n.lab .grid{grid-template-columns:minmax(0,1fr)}\n.lab .stage{height:220px}\nbody.embedded{background:var(--paper)}\nbody.embedded .variant.embedded{min-height:0}\nbody.embedded .stage{height:100vh}\nbody.embedded .variant-copy,body.embedded .note,body.embedded .replay{display:none}\n</style>');
    await writeFile(entry.example, html);
  }
}
