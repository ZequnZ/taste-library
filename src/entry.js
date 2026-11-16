import { setupNavigation } from './navigation.js';

setupNavigation();

const tabs = [...document.querySelectorAll('.preview-tab')];
const selectTab = tab => {
  for (const candidate of tabs) {
    const selected = candidate === tab;
    candidate.setAttribute('aria-selected', String(selected));
    candidate.tabIndex = selected ? 0 : -1;
    document.getElementById(candidate.getAttribute('aria-controls')).hidden = !selected;
  }
};
for (const tab of tabs) {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs.at(-1) : tabs[(tabs.indexOf(tab) + (event.key === 'ArrowLeft' ? -1 : 1) + tabs.length) % tabs.length];
    selectTab(next);
    next.focus();
  });
}

const status = document.querySelector('#copy-status');
const button = document.querySelector('#copy-source');
const source = document.querySelector('#source-code').textContent;
button.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(source);
    button.querySelector('span').textContent = 'Source copied';
    status.textContent = 'Complete HTML copied to your clipboard.';
  } catch {
    status.textContent = 'Clipboard access is unavailable. Open the source inspector to copy manually.';
  }
});
