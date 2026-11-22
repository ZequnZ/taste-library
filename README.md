# Taste Library

A personal collection of small interaction details. Each detail is copyable source: a self-contained HTML + CSS snippet today, React components soon.

## Run

Requires Node.js 20.19+ or 22+.

```bash
npm install
npm run dev
```

Open http://127.0.0.1:4173. The gallery groups entries by family; hover or focus a card to play it. Each detail page (`#/<id>`) shows a large preview, a Hold active toggle, the exact source with Copy, and the font it needs.

## Structure

```
llm.txt              agent index, served at /llm.txt
collection.json      authoritative metadata: families, kinds, entries, origin
elements/<id>/       one folder per entry, holding only that entry's files
public/fonts/        Fredoka SemiBold and its licence
src/                 gallery (main.js, style.css, render/<kind>.js)
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

### React component (`"kind": "react"`, planned)

```
elements/<id>/
  <ComponentName>.jsx   default export; listed first in files
  <ComponentName>.css   optional, imported by the component
```

- Renders with no required props. An optional `active` boolean forces the active state, which the gallery uses for card hover and Hold active. Hover and focus still work without it.
- Styling is a plain CSS file with classes prefixed by the entry id (`.magnetic-button`, `.magnetic-button-dot`). No CSS Modules, Tailwind or CSS-in-JS, so the files drop into any React setup.
- Imports only `react` and files in its own folder. Any other package needs approval and is listed in the entry's `dependencies` (`{ "motion": "^12.0.0" }`).
- Honours `prefers-reduced-motion` in CSS and in any JavaScript-driven motion.

The gallery cannot render React entries yet, and `npm run validate` rejects them until it can. Adding the first one also means adding `react` / `react-dom`, a `src/render/react.jsx` renderer, React validation rules and tests.

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
