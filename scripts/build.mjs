import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const extensionDir = path.join(rootDir, 'extension');
const outputDir = path.join(rootDir, 'dist');
const unpackedDir = path.join(outputDir, 'unpacked');
const downloadDir = path.join(outputDir, 'download', 'KMoon-Web-Analyzer');

fs.mkdirSync(outputDir, { recursive: true });

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

fs.rmSync(unpackedDir, { recursive: true, force: true });
copyDir(extensionDir, unpackedDir);

fs.rmSync(downloadDir, { recursive: true, force: true });
fs.mkdirSync(downloadDir, { recursive: true });
copyDir(extensionDir, path.join(downloadDir, 'extension'));
fs.copyFileSync(path.join(rootDir, 'LICENSE'), path.join(downloadDir, 'LICENSE'));
for (const documentationFile of [
  'README.md',
  'SECURITY.md',
  'PRIVACY.md',
  'FEATURES.md',
  'CHANGELOG.md',
  'CONTRIBUTING.md'
]) {
  fs.copyFileSync(path.join(rootDir, documentationFile), path.join(downloadDir, documentationFile));
}

const installerScript = `Option Explicit
Dim shell, fso, projectDir, extensionDir, chromePath, candidates, candidate
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
projectDir = fso.GetParentFolderName(WScript.ScriptFullName)
extensionDir = fso.BuildPath(projectDir, "extension")

If Not fso.FileExists(fso.BuildPath(extensionDir, "manifest.json")) Then
  MsgBox "The extension files are missing. Extract the complete KMoon Web Analyzer download first.", 16, "KMoon Web Analyzer"
  WScript.Quit 1
End If

candidates = Array( _
  shell.ExpandEnvironmentStrings("%ProgramFiles%") & "\\Google\\Chrome\\Application\\chrome.exe", _
  shell.ExpandEnvironmentStrings("%ProgramFiles(x86)%") & "\\Google\\Chrome\\Application\\chrome.exe", _
  shell.ExpandEnvironmentStrings("%LOCALAPPDATA%") & "\\Google\\Chrome\\Application\\chrome.exe")
chromePath = ""
For Each candidate In candidates
  If fso.FileExists(candidate) Then
    chromePath = candidate
    Exit For
  End If
Next

If MsgBox("This opens Chrome's extension page and the correct extension folder." & vbCrLf & vbCrLf & _
  "In Chrome, turn on Developer mode, click Load unpacked, and select the folder that opens. " & _
  "Chrome requires this one-time approval for locally installed extensions.", _
  vbOKCancel + vbInformation, "Install KMoon Web Analyzer") <> vbOK Then
  WScript.Quit 0
End If

If chromePath <> "" Then
  shell.Run """" & chromePath & """ chrome://extensions", 1, False
Else
  shell.Run "chrome://extensions", 1, False
End If
shell.Run "explorer.exe """ & extensionDir & """", 1, False
`;

fs.writeFileSync(path.join(downloadDir, 'Install in Chrome.vbs'), installerScript, 'utf8');
fs.writeFileSync(path.join(downloadDir, 'INSTALL.txt'), [
  'KMoon Web Analyzer - local install',
  '',
  '1. Double-click "Install in Chrome.vbs".',
  '2. In Chrome, enable Developer mode.',
  '3. Click "Load unpacked".',
  '4. Select the extension folder that opened (the folder containing manifest.json).',
  '5. Visit a normal website and click the KMoon Web Analyzer toolbar icon.',
  '',
  'Chrome requires the one-time Load unpacked approval for local extensions. This download does not need CMD, Node.js, npm, or an administrator account.',
  'For updates, replace the extension folder and click Reload for the extension on chrome://extensions.'
].join('\r\n'), 'utf8');

const manifest = JSON.parse(fs.readFileSync(path.join(extensionDir, 'manifest.json'), 'utf8'));
const packageInfo = { name: manifest.name, version: manifest.version, author: 'Kmoon1025' };
fs.writeFileSync(path.join(outputDir, 'build-info.json'), JSON.stringify(packageInfo, null, 2));

console.log(`Build completed. Load this unpacked folder in Chrome: ${unpackedDir}`);
