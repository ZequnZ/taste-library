import * as React from 'react';
import { createRoot } from 'react-dom/client';
import Playground from '../playground/Playground.jsx';

// A query keeps compiled gallery imports separate from the unchanged public JSX.
const components = import.meta.glob('/elements/*/*.jsx', { query: '?gallery' });
const states = new WeakMap();
const render = state => {
  if (!state.root || !state.Component) return;
  state.root.render(state.controlsHost
    ? <Playground Component={state.Component} entry={state.entry} active={state.active} controlsHost={state.controlsHost} />
    : <state.Component active={state.active} />);
};

export async function mount(host, _code, entry) {
  const state = states.get(host) ?? {};
  states.set(host, state);
  const { default: Component } = await components[`/${entry.files[0]}`]();
  if (!host.isConnected || states.get(host) !== state) return;
  state.Component = Component;
  state.entry = entry;
  state.controlsHost = entry.playground ? host.closest('#panel-preview')?.querySelector('[data-playground-controls]') : null;
  state.root = createRoot(host);
  render(state);
}

export function setOn(host, on) {
  const state = states.get(host) ?? {};
  // Releasing Hold restores interactive local state; cards always preview light/dark.
  state.active = on || host.closest('.card') ? on : undefined;
  states.set(host, state);
  render(state);
}

export function unmount(host) {
  states.get(host)?.root?.unmount();
  states.delete(host);
}
