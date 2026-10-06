import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  'extension/manifest.json',
  'extension/background/service-worker.js',
  'extension/content/content.js',
  'extension/assets/icon-16.png',
  'extension/assets/icon-32.png',
  'extension/assets/icon-48.png',
  'extension/assets/icon-128.png',
  'README.md',
  'SECURITY.md',
  'PRIVACY.md',
  'FEATURES.md',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'LICENSE'
];

for (const rel of required) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    throw new Error(`Missing required file: ${rel}`);
  }
}

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'extension/manifest.json'), 'utf8'));
if (manifest.manifest_version !== 3) {
  throw new Error('Manifest must target Manifest V3.');
}

if (manifest.content_scripts?.length || manifest.side_panel) {
  throw new Error('The analyzer should load on demand as a floating on-page tool.');
}

const contentScript = fs.readFileSync(path.join(root, 'extension/content/content.js'), 'utf8');
if (!contentScript.includes('startDragging') || !contentScript.includes('© 2026 Kmoon1025')) {
  throw new Error('The floating panel must be draggable and show Kmoon1025 copyright credit.');
}
for (const requiredTab of ['overview', 'network', 'inspector', 'copier', 'live-security', 'extensions', 'logs', 'workspace', 'history', 'storage', 'source', 'search', 'executor', 'settings']) {
  if (!contentScript.includes(`data-tab="${requiredTab}"`)) {
    throw new Error(`Missing requested analyzer tab: ${requiredTab}`);
  }
}

if (manifest.homepage_url !== 'https://github.com/kcrespo1025/Kmoon-Web-Analyzer') {
  throw new Error('Manifest must point to the user-specified official GitHub repository.');
}
for (const permission of ['webRequest', 'webNavigation', 'downloads', 'management', 'storage', 'scripting']) {
  if (!manifest.permissions.includes(permission)) {
    throw new Error(`Manifest is missing the permission required for supported features: ${permission}`);
  }
}

const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (manifest.version !== packageJson.version) {
  throw new Error('package.json and extension manifest versions must match.');
}

const referencedFiles = [
  manifest.background.service_worker,
  ...(manifest.content_scripts || []).flatMap((script) => script.js),
  ...(manifest.side_panel ? [manifest.side_panel.default_path] : []),
  ...Object.values(manifest.icons),
  ...Object.values(manifest.action.default_icon)
];

for (const rel of referencedFiles) {
  if (!fs.existsSync(path.join(root, 'extension', rel))) {
    throw new Error(`Manifest references a missing file: ${rel}`);
  }
}

console.log('Project structure verification passed.');
