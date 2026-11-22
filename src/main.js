import collection from '../collection.json';
import * as html from './render/html.js';

const app = document.querySelector('#app');
const byId = new Map(collection.entries.map(entry => [entry.id, entry]));
// One renderer per entry kind. React entries get a renderer when the first one is added.
const renderers = { html };
// Raw text of every element file, keyed by repository path, loaded on first use.
const rawFiles = import.meta.glob('/elements/*/*', { query: '?raw', import: 'default' });
const sources = new Map();

const escape = text => text.replace(/[&<>"']/g, ch => `&#${ch.charCodeAt(0)};`);
const renderer = id => {
  const { kind } = byId.get(id);
  if (!renderers[kind]) throw new Error(`No gallery renderer for ${kind} entries yet: ${id}`);
  return renderers[kind];
};
const source = id => {
  if (!sources.has(id)) sources.set(id, rawFiles[`/${byId.get(id).files[0]}`]());
  return sources.get(id);
};
const mount = async (host, id) => renderer(id).mount(host, await source(id));
const setOn = (host, id, on) => renderer(id).setOn(host, on);

function gallery() {
  document.title = 'Taste Library';
  app.classList.remove('has-detail');
  app.innerHTML = `
    <header class="intro">
      <h1>Taste Library</h1>
      <p>Small details worth keeping. Each one is a single HTML + CSS snippet, ready to copy.</p>
    </header>
    ${collection.families.map(family => {
      const entries = collection.entries.filter(entry => entry.family === family.id);
      return `<section class="family" aria-labelledby="family-${family.id}">
        <h2 id="family-${family.id}">${family.title} <span>${entries.length}</span></h2>
        <ul class="grid">${entries.map(entry => `
          <li><a class="card" href="#/${entry.id}" data-entry="${entry.id}">
            <span class="stage"><span class="preview" inert></span></span>
            <span class="card-title">${entry.title}</span>
            <span class="card-text">${entry.description}</span>
          </a></li>`).join('')}
        </ul>
      </section>`;
    }).join('')}`;
  for (const card of app.querySelectorAll('.card')) {
    const host = card.querySelector('.preview');
    mount(host, card.dataset.entry);
    for (const [type, on] of [['pointerenter', true], ['pointerleave', false], ['focus', true], ['blur', false]]) {
      card.addEventListener(type, () => setOn(host, card.dataset.entry, on));
    }
  }
}

function revealCurrentElement() {
  const list = app.querySelector('.element-nav-scroll');
  if (!list) return;
  const current = list.querySelector('[aria-current="page"]');
  const listRect = list.getBoundingClientRect();
  const currentRect = current.getBoundingClientRect();
  if (currentRect.bottom > listRect.bottom || currentRect.top < listRect.top) {
    list.scrollTop += currentRect.top - listRect.top - (list.clientHeight - currentRect.height) / 2;
  }
}

async function detail(entry) {
  document.title = `${entry.title} — Taste Library`;
  const family = collection.families.find(item => item.id === entry.family);
  const index = collection.entries.indexOf(entry);
  const prev = collection.entries.at(index - 1);
  const next = collection.entries[(index + 1) % collection.entries.length];
  const code = await source(entry.id);
  app.classList.add('has-detail');
  app.innerHTML = `
    <div class="detail-layout">
    <button class="element-nav-toggle" type="button" aria-label="Show all elements" aria-expanded="false" aria-controls="element-nav"><span class="element-nav-toggle-icon" aria-hidden="true"></span></button>
    <span class="element-nav-divider" aria-hidden="true"></span>
    <nav class="element-nav" id="element-nav" aria-labelledby="element-nav-title">
      <p class="element-nav-title" id="element-nav-title">All elements <span>${collection.entries.length}</span></p>
      <div class="element-nav-scroll" tabindex="0" role="region" aria-label="Element list">
        <ul class="element-groups">${collection.families.map(group => {
          const entries = collection.entries.filter(item => item.family === group.id);
          const current = entries.find(item => item.id === entry.id);
          return `<li class="element-group">
            <button class="element-group-toggle" type="button" id="nav-group-${group.id}" aria-expanded="true" aria-controls="nav-items-${group.id}">
              <span>${group.title}</span><span class="element-group-count">${entries.length}</span><svg class="element-group-chevron" aria-hidden="true" viewBox="0 0 8 8" fill="none"><path d="M2.5 1.5 5.5 4 2.5 6.5"/></svg>
            </button>
            <div class="element-group-items" id="nav-items-${group.id}"><div>
              <ul aria-labelledby="nav-group-${group.id}">${entries.map(item => `
                <li><a href="#/${item.id}"${item.id === entry.id ? ' aria-current="page"' : ''}>${item.title}</a></li>`).join('')}
              </ul>
            </div></div>
            <p class="element-group-current"${current ? '' : ' hidden'}>${current?.title ?? ''}</p>
          </li>`;
        }).join('')}</ul>
      </div>
    </nav>
    <article class="detail">
      <a class="back" href="#/">← All details</a>
      <header class="detail-head">
        <p class="kicker">${family.title}</p>
        <h1>${entry.title}</h1>
        <p>${entry.description}</p>
      </header>
      <section class="workbench" aria-label="Preview and code">
        <div class="toolbar">
          <div role="tablist" aria-label="View">
            <button type="button" role="tab" id="tab-preview" aria-controls="panel-preview" aria-selected="true">Preview</button>
            <button type="button" role="tab" id="tab-code" aria-controls="panel-code" aria-selected="false" tabindex="-1">Code</button>
          </div>
          <div class="toolbar-actions">
            <button type="button" id="hold" aria-pressed="false">Hold active</button>
            <button type="button" id="copy">Copy</button>
          </div>
        </div>
        <div role="tabpanel" id="panel-preview" aria-labelledby="tab-preview">
          <div class="stage stage-large"><span class="preview"></span></div>
        </div>
        <div role="tabpanel" id="panel-code" aria-labelledby="tab-code" hidden>
          <pre tabindex="0"><code id="source">${escape(code)}</code></pre>
        </div>
        <p class="workbench-foot"><span id="hint">Hover or focus the word.</span><span>${code.length.toLocaleString('en')} bytes · ${collection.kinds.find(kind => kind.id === entry.kind).title}</span></p>
      </section>
      <p id="copy-status" class="status" role="status"></p>
      <footer class="detail-foot">
        <p>Related: ${entry.related.map(id => `<a href="#/${id}">${byId.get(id).title}</a>`).join(' · ')}</p>
        <nav aria-label="Browse details"><a href="#/${prev.id}">← ${prev.title}</a><a href="#/${next.id}">${next.title} →</a></nav>
      </footer>
    </article>
    </div>`;
  const nav = app.querySelector('.element-nav');
  const navToggle = app.querySelector('.element-nav-toggle');
  const narrowNav = matchMedia('(max-width: 1527px)');
  const setNavOpen = open => {
    const expanded = narrowNav.matches && open;
    nav.hidden = narrowNav.matches && !expanded;
    navToggle.setAttribute('aria-expanded', String(expanded));
    navToggle.setAttribute('aria-label', expanded ? 'Hide all elements' : 'Show all elements');
    if (!nav.hidden) setTimeout(revealCurrentElement);
  };
  const syncNav = () => setNavOpen(false);
  syncNav();
  narrowNav.addEventListener('change', syncNav);
  navToggle.addEventListener('click', () => setNavOpen(navToggle.getAttribute('aria-expanded') !== 'true'));
  for (const toggle of app.querySelectorAll('.element-group-toggle')) {
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
    });
  }
  app.onkeydown = event => {
    if (event.key !== 'Escape' || !narrowNav.matches) return;
    setNavOpen(false);
    navToggle.focus();
  };
  requestAnimationFrame(revealCurrentElement);
  const host = app.querySelector('.preview');
  await mount(host, entry.id);
  const tabs = [...app.querySelectorAll('[role="tab"]')];
  const hint = app.querySelector('#hint');
  const select = tab => {
    for (const item of tabs) {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      app.querySelector(`#${item.getAttribute('aria-controls')}`).hidden = !selected;
    }
    const preview = tab.id === 'tab-preview';
    app.querySelector('#hold').hidden = !preview;
    hint.hidden = !preview;
  };
  for (const tab of tabs) {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      const other = tabs[(tabs.indexOf(tab) + 1) % tabs.length];
      select(other);
      other.focus();
    });
  }
  const hold = app.querySelector('#hold');
  hold.addEventListener('click', () => {
    const on = hold.getAttribute('aria-pressed') !== 'true';
    hold.setAttribute('aria-pressed', String(on));
    setOn(host, entry.id, on);
  });
  app.querySelector('#copy').addEventListener('click', async () => {
    const status = app.querySelector('#copy-status');
    try {
      await navigator.clipboard.writeText(code);
      status.textContent = 'Copied to clipboard.';
    } catch {
      status.textContent = 'Clipboard unavailable. Select the code above to copy it.';
    }
  });
}

function route() {
  const entry = byId.get(location.hash.replace(/^#\/?/, ''));
  if (entry) detail(entry);
  else gallery();
  scrollTo(0, 0);
}

const theme = document.querySelector('#theme');
const applyTheme = dark => {
  document.documentElement.classList.toggle('dark', dark);
  theme.setAttribute('aria-pressed', String(dark));
};
applyTheme(localStorage.getItem('theme') === 'dark');
theme.addEventListener('click', () => {
  const dark = !document.documentElement.classList.contains('dark');
  applyTheme(dark);
  localStorage.setItem('theme', dark ? 'dark' : 'light');
});

addEventListener('hashchange', route);
addEventListener('resize', revealCurrentElement);
route();
