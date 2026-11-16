# Taste Library

A personal design collection with category browsing, whole visual families, individual interactive examples, and portable agent guidance.

## Run

Requires Node.js 20.19+ or Node.js 22+ for the current Playwright release; Vite 6 supports Node.js 20.

```bash
npm install
npm run validate
npm run dev
```

Open http://127.0.0.1:4173.

## Review

The gallery includes five clearly labeled demonstrations: a complete editorial page, a lift button, an animated toggle, a typography study, and a tonal palette. Try their controls, filter by category, switch between whole styles and elements, inspect source, and toggle the gallery theme.

The user-approved collection contains 13 individually browsable Idea navigation treatments: seven letter motions and six underlines. Demonstrations establish no personal preferences. Collection population follows user confirmation.

## Verify

```bash
npx playwright install chromium
npm test
npm run build
```

Browser tests cover category filters, whole-style/element views, source inspection, real clipboard writing, live example interactions, theme switching, and overflow at phone, tablet, desktop, and wide viewport widths. Validation checks category and entry identities, related links, local assets, and index coverage.

## Files

- `collection.json`: categories, confirmed entries, demonstration registry.
- `llm.txt`: agent discovery and example links.
- `skills/taste-library/SKILL.md`: portable design and save-confirmation workflow.
- `docs/authoring.md`: entry creation and publishing guidance.
- `examples/`: runnable, copyable demonstration source.
- `src/`: gallery rendering and styling.
- `scripts/validate.mjs`: metadata checks and publishable asset generation.
- `tests/`: real browser and index tests.

The user performs commits and pushes. Profile installation and public website integration require separate instructions.
