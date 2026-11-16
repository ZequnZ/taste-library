import collection from '../collection.json' with { type: 'json' };

const entityMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
export const escapeHtml = text => text.replace(/[&<>"']/g, character => entityMap[character] || '&#39;');

export function icon(name, extra = '') {
  return `<svg class="icon ${extra}" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><use href="#icon-${name}"></use></svg>`;
}

const symbols = `<svg class="icon-definitions" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><defs>
  <symbol id="icon-grid" viewBox="0 0 24 24"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></symbol>
  <symbol id="icon-menu" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></symbol>
  <symbol id="icon-close" viewBox="0 0 24 24"><path d="m6 6 12 12M6 18 18 6"/></symbol>
  <symbol id="icon-arrow" viewBox="0 0 24 24"><path d="M4 12h16m-6-6 6 6-6 6"/></symbol>
  <symbol id="icon-external" viewBox="0 0 24 24"><path d="M14 4h6v6M11 13l9-9M10 5H4v15h15v-6"/></symbol>
  <symbol id="icon-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></symbol>
  <symbol id="icon-copy" viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/></symbol>
  <symbol id="icon-download" viewBox="0 0 24 24"><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/></symbol>
  <symbol id="icon-code" viewBox="0 0 24 24"><path d="m8 7-6 5 6 5m8-10 6 5-6 5M14 4l-4 16"/></symbol>
</defs></svg>`;

export const notes = {
  'quiet-editorial': ['A complete page study: serif typography, olive tones, generous space.', 'Considered as one visual direction. The typography and palette are also available as independent studies; neither is confirmed as a reusable preference.', ['Serif headlines', 'Olive tones', 'Generous space']],
  'lift-button': ['A tactile hover with a gentle lift and a distinct pressed state.', 'Hover, press, and keyboard focus express the button’s state in different ways.', ['Gentle lift', 'Pressed state', 'Keyboard focus']],
  'orbit-toggle': ['A small switch with an expressive, spring-shaped transition.', 'The switch exposes its state to assistive technology. Its travel and soft spring are the central details.', ['Toggle state', 'Spring motion', 'Keyboard operable']],
  'editorial-type': ['An italic serif heading paired with restrained supporting text.', 'A compact reading measure, an italic display face, and restrained supporting copy.', ['Italic serif', 'Reading measure', 'Type hierarchy']],
  'tonal-palette': ['A single hue in five tones. Select a swatch to inspect its value.', 'Five related tones make the range visible. Selecting a swatch reveals its hexadecimal value.', ['One hue', 'Five tones', 'Click to inspect']],
  'letter-motion': ['Seven ways for a small navigation word to catch attention, one letter at a time.', 'From your Idea navigation study: four individual letters, Fredoka SemiBold and a warm underline. This saves the material to explore, not a final preferred motion. Select each treatment to see its one-shot sequence; wave and wobble run while active.', ['Seven variants', 'Letter by letter', 'Spring stagger', 'Keyboard preview']],
  'dashed-line': ['A hand-drawn underline that can travel, draw itself in, or gather into beads.', 'From the same Idea navigation study. Four dashed patterns and two solid pen alternatives, with identical Fredoka / Idea lettering and the original SVG paths. Both studies remain linked as one navigation detail.', ['Six variants', 'Inline SVG', 'Dash flow', 'Reduced-motion states']],
};

export function entryUrl(entry) {
  return `/entries/${entry.id}/`;
}

function header({ detail = false } = {}) {
  return `${symbols}<header class="site-header"><div class="header-left">${detail ? `<button class="icon-button" id="menu" aria-label="Open collection tree" aria-expanded="false" aria-controls="library-navigation">${icon('menu')}</button>` : ''}<a class="brand" href="/" aria-label="Taste Library home"><span class="wordmark">t.</span><span>Taste Library</span></a></div><div class="header-actions"><a class="agent-link" href="/llm.txt" target="_blank" rel="noopener">For agents ${icon('external')}</a><button class="theme-toggle" id="theme" aria-label="Switch to dark theme" aria-pressed="false">${icon('sun')}<span>Light</span></button></div></header>`;
}

export function renderHomeHeader() {
  return header();
}

export function renderNavigation({ activeId = '' } = {}) {
  const all = [...collection.entries, ...collection.demonstrations];
  const groups = collection.categories.map(category => ({
    ...category,
    entries: all.filter(entry => entry.category === category.id),
  })).filter(group => group.entries.length);
  const item = entry => `<li><a class="item-link${activeId === entry.id ? ' active' : ''}" href="${entryUrl(entry)}"${activeId === entry.id ? ' aria-current="page"' : ''} data-entry-id="${entry.id}"><span>${entry.title}</span></a></li>`;
  const confirmed = collection.entries.length ? `<ol class="item-list">${collection.entries.map(item).join('')}</ol>` : '<p>Nothing saved yet.</p>';
  const current = all.find(entry => entry.id === activeId);
  const currentGroup = current ? collection.categories.find(category => category.id === current.category) : null;
  return `${header({ detail: true })}<div class="scrim" hidden></div><div class="portfolio-layout"><aside class="library-sidebar" id="library-navigation" aria-label="Collection tree"><div class="sidebar-heading"><a class="overview-link" href="/">${icon('grid')}<span>All categories</span></a><button class="icon-button" id="close-navigation" aria-label="Close collection tree">${icon('close')}</button></div><p class="tree-current">${currentGroup ? currentGroup.title : 'Collection'}</p><nav aria-label="Items by category">${groups.map(group => `<section class="tree-group"><h2>${group.title}<span>${group.entries.length}</span></h2><ol class="item-list">${group.entries.map(item).join('')}</ol></section>`).join('')}<section class="tree-group confirmed-group"><h2>Confirmed collection<span>${collection.entries.length}</span></h2>${activeId && collection.entries.some(entry => entry.id === activeId) ? '<p>Shown in its category above.</p>' : confirmed}</section></nav></aside>`;
}

export function renderEntry(entry, source) {
  const all = [...collection.entries, ...collection.demonstrations];
  const category = collection.categories.find(item => item.id === entry.category);
  const related = entry.related.map(id => all.find(item => item.id === id)).filter(Boolean);
  const [description, context, details] = notes[entry.id] || [entry.description, entry.variant ? `An individual ${entry.study === 'motion' ? 'letter motion' : 'underline'} treatment from your Idea navigation study, shown on its own: ${entry.study === 'motion' ? 'the original underline is removed' : 'the letters stay still'}. Original Fredoka SemiBold lettering, ${entry.study === 'motion' ? 'animation timings' : 'SVG paths and timings'} are preserved. Saved material, not a confirmed preferred variant.` : '', entry.variant ? ['Single treatment', 'Keyboard preview', 'Reduced-motion states'] : []];
  const demonstration = collection.demonstrations.some(item => item.id === entry.id);
  return `<div class="entry-canvas"><a class="back-link" href="/">${icon('arrow', 'back-arrow')} Gallery</a><header class="entry-intro"><div><p class="entry-kicker">${category.title} · ${entry.kind === 'family' ? 'Whole style' : 'Element'}</p><h1>${entry.title}</h1><p class="entry-summary">${description}</p></div><span class="status-label"><span class="status-dot"></span>${demonstration ? 'Unapproved demonstration' : 'Confirmed collection'}</span></header>
  <article class="entry-document">
    <section class="entry-section overview-section" id="overview" aria-label="Example preview and code"><div class="preview-workbench"><div class="preview-toolbar"><div role="tablist" aria-label="Example view"><button class="preview-tab" id="preview-tab" role="tab" aria-selected="true" aria-controls="preview-panel">Preview</button><button class="preview-tab" id="code-tab" role="tab" aria-selected="false" aria-controls="code-panel" tabindex="-1">Code</button></div><a class="standalone-action" href="/${entry.example}" target="_blank" rel="noopener" aria-label="Open ${entry.title} standalone">${icon('external')}</a></div><div id="preview-panel" role="tabpanel" aria-labelledby="preview-tab"><figure class="example-stage"><iframe src="/${entry.example}${entry.variant ? `?variant=${entry.variant}` : ''}" title="${entry.title} interactive example" loading="eager"></iframe></figure></div><div id="code-panel" role="tabpanel" aria-labelledby="code-tab" tabindex="0" hidden><pre><code>${escapeHtml(source)}</code></pre></div></div></section>
    <section class="entry-section notes-section" id="notes" aria-labelledby="notes-title"><h2 id="notes-title">About this item</h2><div class="notes-columns"><div><p class="note-context">${context}</p><ul class="observation-tags">${details.map(detail => `<li>${detail}</li>`).join('')}</ul></div><dl class="entry-facts"><div><dt>Category</dt><dd>${category.title}</dd></div><div><dt>Format</dt><dd>${entry.kind === 'family' ? 'Whole style' : 'Individual element'}</dd></div><div><dt>Status</dt><dd>${demonstration ? 'Unapproved demonstration' : 'Confirmed'}</dd></div></dl></div>${related.length ? `<div class="related-block"><h3>Related</h3><div class="related-links">${related.map(item => `<a href="${entryUrl(item)}"><span>${item.title}</span>${icon('arrow')}</a>`).join('')}</div></div>` : ''}</section>
    ${renderSource(entry, source)}
  </article></div>`;
}

export function renderSource(entry, source) {
  return `<section class="entry-section reuse-section" id="reuse" aria-labelledby="reuse-title"><div class="section-heading"><h2 id="reuse-title">Source</h2><p>Complete, self-contained HTML.</p></div><div class="source-actions"><a class="text-action" href="/${entry.example}" target="_blank" rel="noopener">Open example ${icon('external')}</a><button class="primary-action" id="copy-source">${icon('copy')}<span>Copy source</span></button><a class="download-action" href="/${entry.example}" download="${entry.id}.html" aria-label="Download ${entry.title} HTML">${icon('download')}</a></div><details class="source-details"><summary>${icon('code')}<span>Inspect source</span><span class="summary-plus" aria-hidden="true">+</span></summary><pre><code id="source-code">${escapeHtml(source)}</code></pre></details><p id="copy-status" role="status" class="copy-status"></p></section>`;
}

export function setupNavigation() {
  const sidebar = document.querySelector('#library-navigation');
  const menu = document.querySelector('#menu');
  const close = document.querySelector('#close-navigation');
  const scrim = document.querySelector('.scrim');
  let returnFocus;
  const setMenu = open => {
    if (!sidebar || !menu) return;
    const mobile = innerWidth < 860;
    sidebar.classList.toggle('open', mobile && open);
    sidebar.inert = mobile && !open;
    document.body.classList.toggle('navigation-open', mobile && open);
    menu.setAttribute('aria-expanded', String(mobile && open));
    scrim.hidden = !mobile || !open;
    if (mobile && open) {
      returnFocus = document.activeElement;
      close.focus();
    } else if (returnFocus) {
      returnFocus.focus();
      returnFocus = null;
    }
  };
  if (sidebar && menu) {
    setMenu(false);
    menu.addEventListener('click', () => setMenu(!sidebar.classList.contains('open')));
    close.addEventListener('click', () => setMenu(false));
    scrim.addEventListener('click', () => setMenu(false));
    matchMedia('(min-width: 860px)').addEventListener('change', () => setMenu(false));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && sidebar.classList.contains('open')) setMenu(false);
      if (event.key !== 'Tab' || !sidebar.classList.contains('open')) return;
      const focusable = [...sidebar.querySelectorAll('a, button')];
      if (event.shiftKey && document.activeElement === focusable[0]) {
        event.preventDefault();
        focusable.at(-1).focus();
      } else if (!event.shiftKey && document.activeElement === focusable.at(-1)) {
        event.preventDefault();
        focusable[0].focus();
      }
    });
  }
  const applyTheme = dark => {
    document.body.classList.toggle('dark', dark);
    const button = document.querySelector('#theme');
    if (!button) return;
    button.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
    button.querySelector('span').textContent = dark ? 'Dark' : 'Light';
    button.setAttribute('aria-pressed', String(dark));
    // Element-only previews hide their own theme control, so they follow the site theme.
    for (const frame of document.querySelectorAll('iframe[src*="?variant="]')) {
      const sync = () => frame.contentDocument?.body?.classList.toggle('dark', dark);
      sync();
      frame.addEventListener('load', sync, { once: true });
    }
  };
  const stored = localStorage.getItem('theme');
  applyTheme(stored ? stored === 'dark' : false);
  document.querySelector('#theme')?.addEventListener('click', () => {
    const next = !document.body.classList.contains('dark');
    applyTheme(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  });
}
