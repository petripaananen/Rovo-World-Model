/**
 * Custom UI bundler powered by esbuild.
 * Bundles `static/ui/src/cockpit.ts` (including `src/engine/*`, `src/mcp/manifest.ts`,
 * and `@forge/bridge`) into `static/ui/build/app.js`, plus `styles.css` and `index.html`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const buildDir = path.resolve(__dirname, 'build');

fs.mkdirSync(buildDir, { recursive: true });

await esbuild.build({
  entryPoints: [path.join(__dirname, 'src/cockpit.ts')],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2020'],
  minify: false,
  outfile: path.join(buildDir, 'app.js'),
  logLevel: 'silent',
});

// Copy styles.css
const cssContent = fs.readFileSync(path.join(__dirname, 'src/styles.css'), 'utf8');
fs.writeFileSync(path.join(buildDir, 'styles.css'), cssContent, 'utf8');

// Write index.html
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Rovo-World-Model</title>
  <link rel="stylesheet" href="./styles.css" />
</head>
<body>
  <div id="app-root"></div>
  <script src="./app.js"></script>
</body>
</html>
`;

fs.writeFileSync(path.join(buildDir, 'index.html'), htmlContent, 'utf8');
console.log('[PWM Custom UI Build] Built static/ui/build/{index.html, styles.css, app.js} via esbuild.');
