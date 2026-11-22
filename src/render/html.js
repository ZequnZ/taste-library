const ACTIVE = ':is(:hover, :focus-visible)';

// Each snippet renders in its own shadow root so its generic class names stay isolated.
// Adding `.is-on` to the active selector lets a whole card or the Hold button drive the
// snippet; the copied source stays untouched.
export function mount(host, code) {
  const root = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
  root.innerHTML = code.replaceAll(ACTIVE, ':is(:hover, :focus-visible, .is-on)');
  root.addEventListener('click', event => event.preventDefault());
}

export const setOn = (host, on) => host.shadowRoot?.querySelector('.idea')?.classList.toggle('is-on', on);
