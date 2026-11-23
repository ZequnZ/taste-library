# Taste Library

A personal collection of small interaction details. Each detail is copyable source: a self-contained HTML + CSS snippet or a React component with plain CSS.

## Run

Requires Node.js 20.19+ or 22+.

```bash
npm install
npm run dev
```

Open http://127.0.0.1:4173. The gallery groups entries by family; hover or focus a card to play it. Each detail page (`#/<id>`) shows a large preview, a Hold active toggle and the exact source with Copy. Multi-file entries have a Code file selector; copy each listed file. React previews also support their native click and keyboard interactions.

## Structure

```
llm.txt              agent index, served at /llm.txt
collection.json      authoritative metadata: families, kinds, entries, origin
elements/<id>/       one folder per entry, holding only that entry's files
public/fonts/        Fredoka SemiBold and its licence
src/                 gallery (main.js, style.css, render/html.js and react.jsx)
scripts/validate.mjs metadata and snippet rules
tests/               Playwright browser tests
```

`elements/` and `llm.txt` are outside `public/` so the gallery can import them through Vite (React components need compiling). A small plugin in `vite.config.js` also publishes them unchanged, so `/llm.txt` and `/elements/<id>/<file>` are plain files on the site, at the same paths as in the repository.

## Entry kinds

Each entry in `collection.json` has a `kind` and a `files` list. The first file is the one the gallery renders and copies.

### HTML + CSS (`"kind": "html"`)

`elements/<id>/<id>.html`, complete by itself:

- Markup: one `<a class="idea idea-<variant>">`. Letter motions pre-split the word into `<span style="--i:N">` so CSS can stagger per letter.
- Motion: CSS `transition`, `@keyframes` and `calc(var(--i) * …)` delays. Underlines are inline SVG paths animated with `stroke-dasharray` / `stroke-dashoffset` (and `clip-path` for Draw-in dashes).
- Trigger: `:hover` and `:focus-visible`. `prefers-reduced-motion` turns animation off.
- No `<script>`, under 2000 bytes.

The gallery renders each snippet in a shadow root and adds an `.is-on` state for card hover and Hold active; the file you copy is unchanged.

### React component (`"kind": "react"`)

```
elements/<id>/
  <ComponentName>.jsx   default export; listed first in files
  <ComponentName>.css   optional, imported by the component
```

- Renders with no required props. An optional `active` boolean forces the preview state, which the gallery uses for card hover and Hold active. Without it, the component uses its native interaction. Releasing Hold restores its own state.
- Styling is a plain CSS file with classes prefixed by the entry id (`.magnetic-button`, `.magnetic-button-dot`). No CSS Modules, Tailwind or CSS-in-JS, so the files drop into any React setup.
- Imports only `react` and files in its own folder. Any other package needs approval and is listed in the entry's `dependencies` (`{ "motion": "^12.0.0" }`).
- Honours `prefers-reduced-motion` in CSS and in any JavaScript-driven motion.

The gallery lazy-loads compiled components through `src/render/react.jsx` and unmounts their React roots when navigating. Source files are still served and copied unchanged. React and React DOM are runtime dependencies; no icon or animation package is needed for the first entry.

#### Orbit theme toggle

The **Components** group starts with `orbit-theme-toggle`. Copy `OrbitThemeToggle.jsx` and `OrbitThemeToggle.css` into the same folder, then use `<OrbitThemeToggle />`. It manages local light/dark state, or accepts controlled `isDark` and `onChange` props. It reports the selected theme without changing your app's theme automatically. Optional props retain the exploration's sizing, orbit, duration, easing, cross-fade, upright icons and custom icon controls. Bundled icons retain Lucide ISC and Feather MIT notices in the JSX. The detail page includes a live prop playground; its controls and orbit guide remain separate from the reusable element.

### React prop playgrounds

Add an optional `playground` to a React entry in `collection.json`. The shared gallery renderer handles live controls, labelled prop names, reset to defaults, and a **Copy usage** example listing only changed props. The toolbar's **Copy** still copies the exact selected element source. Settings are temporary, survive Preview/Code switching and Hold active, and reset when leaving the detail page. No preferences are recorded.

```json
"playground": {
  "controls": [
    { "name": "size", "label": "Size", "type": "range", "default": 72, "min": 44, "max": 120, "step": 1, "unit": "px" },
    { "name": "easing", "label": "Easing", "type": "select", "default": "linear", "options": [{ "label": "Linear", "value": "linear" }] },
    { "name": "fade", "label": "Cross-fade", "type": "boolean", "default": true }
  ],
  "notes": ["Describe callback, component-valued or styling props here."]
}
```

`name` is the component prop; defaults must match the component's defaults. Ranges use numbers, selects use string-valued options, and checkboxes use booleans. Every control updates the existing component without remounting it. Validation checks names, defaults, ranges and options. New ordinary playgrounds need only metadata, not a bespoke form.

For a custom preview, add `src/playground/demos/<demo>.jsx` and set `playground.demo` to its basename. The adapter receives `{ Component, props, active, demo }`; `props` holds editable props and `demo` holds controls with `"scope": "demo"`. Demo-only values are excluded from both component props and usage. The orbit adapter adds a local light/dark label and an unclipped orbit guide without modifying the app theme or copied source. Keep adapters and controls in `src/`, not in the entry's `files` list. Add Playwright coverage for each new playground.

### Shared rules

- Theming: `--accent` (default `#b88343`); text colour inherits.
- Font: elements ask for Fredoka and fall back to the system sans-serif when it is missing. The gallery loads Fredoka SemiBold from `public/fonts/fredoka-600.woff2` (SIL OFL 1.1, `public/fonts/Fredoka-OFL.txt`).

## Add an entry

1. Get the user's approval and record source, context and permission.
2. Create `elements/<id>/` with the entry's files, and add the entry (`kind`, `files`) to `collection.json`.
3. Add a link `- [Title](elements/<id>/<main file>): Kind. Description.` to `llm.txt`.
4. Run `npm run validate`, `npm test` and `npm run build`.

The validator fails if a folder has no entry, if a folder and its `files` list differ, or if `llm.txt` is missing the link.

Privacy: record where material came from in words, never as a local path. `npm run validate` rejects filesystem paths.

## For agents

`/llm.txt` (source: `llm.txt` at the repository root) lists every element with a link to its main file, plus the kind conventions and font. Links are relative, so they work both on the site and in the repository.
