import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const collection = JSON.parse(readFileSync(resolve(root, 'collection.json'), 'utf8'));
const inputs = [...collection.entries, ...collection.demonstrations].map(entry => resolve(root, `entries/${entry.id}/index.html`));

export default defineConfig({
  build: {
    rollupOptions: {
      input: [resolve(root, 'index.html'), ...inputs],
    },
  },
});
