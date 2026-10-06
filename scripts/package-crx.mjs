import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const extensionDir = path.join(rootDir, 'extension');
const distDir = path.join(rootDir, 'dist');
const keyPath = path.join(rootDir, 'build', 'kmoon-web-analyzer.pem');
const outputCrx = path.join(rootDir, 'build', 'KMoon-Web-Analyzer.crx');

const browserCandidates = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'chrome',
  'google-chrome',
  'chromium',
  'chromium-browser',
  'msedge'
];

function findBrowser() {
  for (const candidate of browserCandidates) {
    if (path.isAbsolute(candidate) && fs.existsSync(candidate)) {
      return candidate;
    }
    try {
      const result = execFileSync('where.exe', [candidate], { stdio: 'pipe', encoding: 'utf8' });
      const hits = result.split(/\r?\n/).filter(Boolean);
      if (hits.length) {
        return hits[0];
      }
    } catch {
      // Candidate not installed.
    }
  }
  return null;
}

fs.mkdirSync(path.dirname(keyPath), { recursive: true });
if (!fs.existsSync(keyPath)) {
  const { privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
  fs.writeFileSync(keyPath, privateKey);
}

const browser = findBrowser();
if (!browser) {
  console.log('No Chrome or Chromium browser was found on this machine. Manual packaging is required on a Chrome-enabled system.');
  console.log(`Prepared key file: ${keyPath}`);
  console.log(`Use the built extension in: ${extensionDir}`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(outputCrx), { recursive: true });

const commandArgs = [
  `--pack-extension=${extensionDir}`,
  `--pack-extension-key=${keyPath}`
];

try {
  execFileSync(browser, commandArgs, { cwd: rootDir, stdio: 'inherit' });
  const generatedCrx = path.join(rootDir, 'extension.crx');
  if (!fs.existsSync(generatedCrx)) {
    throw new Error(`Chrome did not create the expected package: ${generatedCrx}`);
  }

  fs.copyFileSync(generatedCrx, outputCrx);
  fs.rmSync(generatedCrx, { force: true });
  console.log(`CRX package generated at ${outputCrx}`);
} catch (error) {
  console.error('Chrome packaging failed:', error.message);
  process.exit(1);
}
