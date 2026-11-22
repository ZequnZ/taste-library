# Taste Library project instructions

Start with `llm.txt` (index of every element) and `collection.json` (authoritative metadata). `README.md` covers structure, entry kinds and the gallery.

## Elements
- Each entry has its own folder, `elements/<id>/`, holding only its files. `collection.json` gives its `kind` and `files`; the first file is the one rendered and copied.
- `html`: one file `<id>.html`, HTML + CSS only, no `<script>`, under 2000 bytes, with a `:is(:hover, :focus-visible)` trigger and a `prefers-reduced-motion` rule.
- `react`: `<ComponentName>.jsx` (default export, no required props, optional `active` prop) plus an optional plain `<ComponentName>.css` with classes prefixed by the entry id. Import only `react` and same-folder files; any other package needs approval and goes in the entry's `dependencies`. Respect `prefers-reduced-motion` in CSS and JS.
- The gallery renders React through `src/render/react.jsx` with `react` / `react-dom`. Keep validator rules and Playwright tests covering native interactions, reduced motion and exact source copying for each kind.
- All elements use `--accent` (default `#b88343`) and inherit text colour.
- Keep the gallery (`src/`) separate from element sources; the copied files must stay unchanged.

## Collection rules
- Ask for the user's approval before adding entries or recording any variant as a confirmed preference.
- Every entry keeps its source, original context and reuse permission in `collection.json`.
- A new entry needs: its `elements/<id>/` folder, a `collection.json` entry, and a markdown link to its main file in `llm.txt`.
- Never write local filesystem paths, usernames, emails or other personal details into tracked files. Describe private sources in words.

## Verification
- Run `npm run validate`, `npm test` and `npm run build` after changes.
- Browser checks use Playwright and cover real interactions and responsive overflow (320–1920px).
- Keep verification output in gitignored directories (`.verification/`, `test-results/`, `playwright-report/`).

## Git
- The user commits and pushes personally. Don't commit or push.
- Technical identifiers keep their original spelling.
