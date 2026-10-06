# KMoon Web Analyzer

> **Official project:** [github.com/kcrespo1025/Kmoon-Web-Analyzer](https://github.com/kcrespo1025/Kmoon-Web-Analyzer) · **Owner:** Kmoon1025
>
> Similar names, forks, and repackaged builds may exist. Verify downloads against this repository. The current local metadata check is not a cryptographic signature and cannot prove that source files were not changed.

KMoon Web Analyzer is a local-by-default Chrome extension for website analysis, debugging, and authorized security research. This is an early implementation of the supplied feature specification; the feature status and current limitations below are intentional and not claims that every requested advanced tool is complete.

## Features

- Live website activity monitoring
- Network request visibility with URL, method, and status tracking
- Click, navigation, DOM-mutation summaries, request status/timing, redirects, and main-response security-header metadata
- Searchable and filterable logs with JSON, TXT, CSV, HTML, and Markdown exports
- Local analysis history and deletable current-page HTML snapshots
- Same-origin local/session storage, IndexedDB-name, and Cache Storage-name inspection (cookie values are not read)
- User-confirmed one-off page JavaScript executor with local saved scripts
- Installed-extension listing and enable/disable controls
- Basic HTTPS/third-party/security-header indicators with an explicit no-guarantee warning
- Draggable floating in-page interface with a left-side tab bar and persistent Kmoon1025 credit
- Pause/resume, local history, theme, and a basic import/export shortcut workspace
- Privacy protections: no keyboard-character or form-body capture; sensitive query parameter redaction

See [FEATURES.md](FEATURES.md) for the detailed implemented/partial/missing requirement checklist. This is not yet the full advanced product described in the planning document; major missing items include multi-page site crawling/resource archives, reliable offline replay, original-vs-copy diffing, certificate inspection, deep source/JavaScript tracing, an extension-review marketplace, the visual workflow editor, and cryptographic official-build signing.

## Installation

1. Download and extract the ready-to-use package. Double-click `Install in Chrome.vbs`.
2. On `chrome://extensions`, enable Developer mode.
3. Click **Load unpacked** (not “Pack extension” or an upload button).
4. Select the `extension` folder opened by the installer and click **Select Folder**. Select the folder that contains `manifest.json`, not the project root or the ZIP file.
5. Pin **KMoon Web Analyzer** from Chrome's Extensions menu and open a normal website. Click the extension icon to show the floating panel, then click **Start monitoring** inside it.

This install flow does not require CMD, Node.js, npm, an administrator account, or a CRX. Chrome does require this one-time manual approval for a locally installed extension. After updating an already-loaded unpacked copy, click its **Reload** button on `chrome://extensions`.

### Quick test

1. Open `https://example.com` in a regular Chrome tab.
2. Click the extension icon to open the on-page panel, then select **Start monitoring**.
3. Click the page and follow a link. Use the tabs on the panel's left to check activity and network requests.
4. Click **Stop monitoring** when finished. Drag the top bar to move the panel or minimize it into a small reopen button.

Chrome blocks extensions from running on browser-internal pages such as `chrome://extensions`, the Chrome Web Store, and some protected pages. Test on a normal website instead.

## Usage

- Click the KMoon Web Analyzer toolbar icon while on a normal webpage to open its floating interface.
- Use **Start monitoring** inside the overlay; opening the interface alone does not start capture.
- The left-hand tabs include activity, network, inspector, single-page copy, security indicators, installed extensions, logs, workspace, history, storage, source references, search, and code execution.
- Drag the top bar to reposition the overlay or minimize it while viewing the site.
- The footer credits Kmoon1025.

## Privacy and Security

This project is designed for local analysis and educational use. It does not automatically upload data to a remote server. Sensitive values are masked by default, but users must still avoid entering confidential data while the extension is active.

## Building

Run the following commands from the project root:

```bash
npm run build
npm run package-crx
```

`npm run build` creates a complete unpacked extension in `dist/unpacked` and a ready-to-distribute package in `dist/download/KMoon-Web-Analyzer`.
`npm run package-crx` creates `build/KMoon-Web-Analyzer.crx` when Chrome or Edge is installed. For normal personal testing, **Load unpacked** is recommended.

Chrome may block direct installation of a `.crx` file that was not distributed through the Chrome Web Store. The unpacked install above is the supported way to test this project locally.

### Permissions

- `activeTab`, `scripting`: user-clicked floating UI, inspection, snapshots, and user-confirmed client-side code execution on the current tab.
- `<all_urls>`, `webRequest`, `webNavigation`: opt-in request metadata/redirect/header analysis for supported pages.
- `storage`: local settings, bounded logs, scripts, history, and workspace data.
- `downloads`: user-requested log exports and page snapshots.
- `management`: list installed extensions and let the user enable/disable them from the UI.

The extension does not read cookies, record typed characters, or store network request/response bodies. Browser-internal and protected pages are not available. See [PRIVACY.md](PRIVACY.md).

## Repository and Attribution

- Project author: Kmoon1025
- Official repository: https://github.com/kcrespo1025/Kmoon-Web-Analyzer
- License: MIT
- Release checksum: GitHub release archives include SHA-256 checksums. Checksums verify file integrity, not publisher identity; no cryptographic release signature is currently provided.
- Feature coverage: see [FEATURES.md](FEATURES.md) for known gaps against the full planning document.

## License

This project is distributed under the MIT license. See [LICENSE](LICENSE).
