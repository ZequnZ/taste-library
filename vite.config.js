import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';
import { defineConfig } from 'vite';

// Element sources and llm.txt live outside public/ so the gallery can import them
// (React components need compiling). This plugin also publishes them unchanged, so
// /llm.txt and /elements/<id>/<file> are plain files on the site, as in the repository.
const root = process.cwd();
const types = { '.html': 'text/html', '.css': 'text/css', '.txt': 'text/plain' };
const published = () => [
  'llm.txt',
  ...readdirSync('elements', { recursive: true })
    .map(path => join('elements', path))
    .filter(path => statSync(path).isFile()),
].map(path => path.split(sep).join('/'));

function publishSources() {
  return {
    name: 'publish-sources',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const [path, query] = req.url.split('?');
        // Queried requests and script-module fetches need Vite compilation.
        // Direct navigation / fetch still returns unchanged source (including JSX/CSS).
        if (query !== undefined || req.headers['sec-fetch-dest'] === 'script' || !(path === '/llm.txt' || path.startsWith('/elements/'))) return next();
        const file = resolve(root, decodeURIComponent(path).slice(1));
        if (relative(root, file).startsWith('..')) return next();
        try {
          const body = readFileSync(file);
          res.setHeader('Content-Type', `${types[extname(file)] ?? 'text/plain'}; charset=utf-8`);
          res.end(body);
        } catch {
          next();
        }
      });
    },
    generateBundle() {
      for (const fileName of published()) this.emitFile({ type: 'asset', fileName, source: readFileSync(fileName) });
    },
  };
}

export default defineConfig({
  plugins: [publishSources()],
  optimizeDeps: { include: ['react', 'react-dom/client'] },
});
