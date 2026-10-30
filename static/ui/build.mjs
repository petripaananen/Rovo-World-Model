/**
 * Zero-dependency Custom UI bundler using TypeScript's compiler API.
 * Bundles `src/engine/*`, `static/ui/src/components/*.tsx`,
 * and `static/ui/src/cockpit.ts` into `static/ui/build/app.js`, `styles.css`, and `index.html`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');
const buildDir = path.resolve(__dirname, 'build');

fs.mkdirSync(buildDir, { recursive: true });

// Ordered module list (dependency order) to bundle into a single IIFE for Custom UI
const modulesToBundle = [
  { id: 'engine/types', file: path.join(repoRoot, 'src/engine/types.ts') },
  { id: 'engine/dag', file: path.join(repoRoot, 'src/engine/dag.ts') },
  { id: 'engine/simulator', file: path.join(repoRoot, 'src/engine/simulator.ts') },
  { id: 'ui/components/tooltip', file: path.join(__dirname, 'src/components/tooltip.ts') },
  { id: 'ui/components/HeaderBar', file: path.join(__dirname, 'src/components/HeaderBar.tsx') },
  {
    id: 'ui/components/TimelineScrubber',
    file: path.join(__dirname, 'src/components/TimelineScrubber.tsx'),
  },
  { id: 'ui/components/DagCanvas', file: path.join(__dirname, 'src/components/DagCanvas.tsx') },
  {
    id: 'ui/components/ScenarioPanel',
    file: path.join(__dirname, 'src/components/ScenarioPanel.tsx'),
  },
  { id: 'ui/cockpit', file: path.join(__dirname, 'src/cockpit.ts') },
];

const transpiledChunks = [];

for (const mod of modulesToBundle) {
  const rawTs = fs.readFileSync(mod.file, 'utf8');
  const withoutImports = rawTs
    .replace(/^\s*import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/export\s+default\s+/g, '')
    .replace(
      /export\s+(async\s+function|function|const|let|class|interface|type)\s+/g,
      '$1 '
    );

  const transpiled = ts.transpileModule(withoutImports, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.None,
      removeComments: false,
    },
  });

  transpiledChunks.push(`// === Module: ${mod.id} ===\n${transpiled.outputText}`);
}

const mcpManifestInline = `
const MCP_TOOLS_MANIFEST = [
  { name: 'pwm_simulate_intervention' },
  { name: 'pwm_get_critical_path' },
  { name: 'pwm_simulate_delay_impact' },
  { name: 'pwm_analyze_critical_path' },
  { name: 'pwm_seed_demo_scenario' },
  { name: 'pwm_get_causal_graph' }
];
`;

const bundleJs = `(() => {\n"use strict";\n${mcpManifestInline}\n${transpiledChunks.join('\n\n')}\n})();\n`;

fs.writeFileSync(path.join(buildDir, 'app.js'), bundleJs, 'utf8');

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
console.log('[PWM Custom UI Build] Built static/ui/build/{index.html, styles.css, app.js} successfully.');
