# Google Docs requirements status

This is a progress checklist, not a claim that every planned feature is finished.

## Working in the current build

- Manifest V3 Chrome extension with user-clicked injection of the draggable, resizable, on-page panel; left navigation; minimize/reopen; Kmoon1025 copyright footer.
- Start/stop and pause/resume controls; click and pointer metadata; DOM mutation summaries; page navigation/hash events; JavaScript error/rejection notices.
- Network request method, URL with sensitive query-name redaction, status, timing, redirect events, cross-origin indicator, and main-document security-header presence.
- Live/searchable/filterable logs, individual deletion, clear-all confirmation, and JSON/TXT/CSV/HTML/Markdown export.
- Local session history, current-page HTML snapshot download with form fields removed, and basic copy report limitations.
- Current-page element selection and limited computed-style/markup inspection.
- HTTPS and observed third-party signal summary; local/session storage, IndexedDB database names, and Cache Storage names; URL/resource-reference list and basic text/log search.
- User-confirmed, one-off client-side JavaScript execution; local saved scripts.
- Installed-extension inventory and Chrome enable/disable action; basic local shortcut workspace import/export/reorder; theme selection.
- Local-only by default; no keyboard-character, cookie, or request/response-body collection.
- Project, privacy, security, contribution, changelog, license, CI, and release-archive/checksum documentation and automation.

## Partial or limited

- Site Copier captures one sanitized current-page HTML file only. It does not crawl a site, gather assets, create an offline site archive, impose crawler limits, or guarantee offline replay.
- Live Security uses HTTPS, observed response headers, and a short hard-coded domain list. It cannot inspect certificate chains or establish a trustworthy safe/malicious verdict.
- Inspector, storage, source-reference, JavaScript, and search panels expose only the limited information described above; they are not full DevTools/source debuggers.
- The workspace is a list of reorderable shortcut labels, not a node graph/workflow builder.
- Extensions can be listed and enabled/disabled, but there is no extension sandbox, approval marketplace, install/uninstall workflow, or secure submission-review service.
- Build identity compares visible project metadata. It is not tamper-resistant cryptographic verification; SHA-256 release checksums detect accidental changes but do not prove publisher identity.
- GitHub workflows test and build tagged releases with SHA-256 checksums. Signing keys, branch protection, and private vulnerability-reporting settings must be configured by the repository owner in GitHub settings.

## Not implemented

- Bounded same-origin crawler with include/exclude patterns, request-rate, depth, page, and total-data limits; full-site/resource copying; offline rewrite/preview; copy reports and original-vs-copy diffing.
- Full DOM/event-listener/timer tracing, full console/stack trace capture, JavaScript call-chain reconstruction, WebSocket message monitoring, and exhaustive source content explorer.
- Full redirect-chain visualization, tracker database/category service, certificate viewer, detailed site permission analysis, comprehensive threat-risk model, or downloadable security report.
- Extensions marketplace/review approvals, automatic extension removal, custom tool execution sandbox, extension themes library.
- Automatic JavaScript execution, script history/count dashboard, and fully featured executor pause/stop modes.
- Drag-connect workspace nodes, conditions, loops, timers, workflow templates, custom executable buttons, and workflow sandboxing.
- Cryptographic release signatures or verifier capable of resisting deliberate source modification.

## Browser/GitHub administration required

- Chrome requires the user to approve **Load unpacked** once for a locally tested extension. This cannot be silently bypassed by the project.
- GitHub branch rules, private vulnerability disclosure, and release permissions require repository-owner configuration; the workflow cannot silently enable account-level settings.
