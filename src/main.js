import collection from '../collection.json';
import { setupNavigation, entryUrl, icon } from './navigation.js';

setupNavigation();
const gallery = document.querySelector('#gallery');
const categoryNav = document.querySelector('#categories');
const modeButtons = [...document.querySelectorAll('[data-library-mode]')];
const variants = Object.fromEntries(collection.entries.filter(entry => entry.variant).map(entry => [entry.id, entry.variant]));
let selectedMode = new URLSearchParams(location.search).get('view') === 'demonstrations' ? 'demonstrations' : 'collection';
let selectedCategory = 'all';
const group = () => selectedMode === 'collection' ? collection.entries : collection.demonstrations;

function play(id, frame, replay = false) {
  const doc = frame.contentDocument;
  if (!doc) return;
  const control = doc.querySelector(`#variant-${variants[id]} .idea-link`);
  control?.classList.toggle('active', true);
  if (replay) doc.querySelector(`.replay[aria-controls="variant-${variants[id]}"]`)?.click();
}
function stop(id, frame) {
  frame.contentDocument?.querySelector(`#variant-${variants[id]} .idea-link`)?.classList.remove('active');
}
function card(entry) {
  const article = document.createElement('article');
  article.className = 'entry';
  article.dataset.entry = entry.id;
  const category = collection.categories.find(item => item.id === entry.category);
  const live = Boolean(variants[entry.id]);
  article.innerHTML = `
    <div class="entry-preview${live ? ' live-preview' : ''}">
      <iframe src="/${entry.example}${live ? `?variant=${variants[entry.id]}&theme=${document.body.classList.contains('dark') ? 'dark' : 'light'}` : ''}" title="${entry.title} — interactive preview" tabindex="-1" loading="eager"></iframe>
    </div>
    <div class="entry-body">
      <p class="entry-kind">${category.title} · ${entry.kind === 'family' ? 'Whole style' : 'Element'}</p>
      <h2><a href="${entryUrl(entry)}">${entry.title}</a></h2>
      <p class="entry-description">${entry.description}</p>
      <div class="entry-bottom"><a class="entry-open" href="${entryUrl(entry)}">Open study ${icon('arrow')}</a>${live ? `<strong class="preview-label">LIVE</strong>` : ''}</div>
    </div>`;
  if (live) {
    const iframe = article.querySelector('iframe');
    const region = article.querySelector('.entry-preview');
    region.tabIndex = 0;
    region.setAttribute('aria-label', `${entry.title} preview. Focus or hover to animate.`);
    region.addEventListener('pointerenter', () => play(entry.id, iframe));
    region.addEventListener('pointerleave', () => stop(entry.id, iframe));
    region.addEventListener('focus', () => play(entry.id, iframe));
    region.addEventListener('blur', () => stop(entry.id, iframe));
    region.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        play(entry.id, iframe, true);
      }
    });
  }
  return article;
}
function render() {
  const entries = group();
  const categories = collection.categories.filter(category => entries.some(entry => entry.category === category.id));
  const visible = selectedCategory === 'all' ? entries : entries.filter(entry => entry.category === selectedCategory);
  for (const button of modeButtons) {
    const active = button.dataset.libraryMode === selectedMode;
    button.classList.toggle('selected', active);
    button.setAttribute('aria-pressed', String(active));
    const count = button.dataset.libraryMode === 'collection' ? collection.entries.length : collection.demonstrations.length;
    button.querySelector('span').textContent = String(count).padStart(2, '0');
  }
  categoryNav.replaceChildren(...[{ id: 'all', title: 'All' }, ...categories].map(category => {
    const button = document.createElement('button');
    const selected = selectedCategory === category.id;
    button.className = `category-filter${selected ? ' selected' : ''}`;
    button.setAttribute('aria-pressed', String(selected));
    button.textContent = category.title;
    const count = document.createElement('span');
    count.textContent = String(category.id === 'all' ? entries.length : entries.filter(entry => entry.category === category.id).length).padStart(2, '0');
    button.append(count);
    button.addEventListener('click', () => { selectedCategory = category.id; render(); });
    return button;
  }));
  gallery.replaceChildren(...visible.map(card));
  document.querySelector('#view-note').textContent = selectedMode === 'collection'
    ? 'Your material, kept as working studies. Hover or focus a preview; press Space to replay.'
    : 'Unapproved scaffold examples. These stay separate from your saved taste.';
  const url = new URL(location.href);
  if (selectedMode === 'demonstrations') url.searchParams.set('view', 'demonstrations');
  else url.searchParams.delete('view');
  history.replaceState(null, '', url);
}
for (const button of modeButtons) {
  button.addEventListener('click', () => { selectedMode = button.dataset.libraryMode; selectedCategory = 'all'; render(); });
}
render();
