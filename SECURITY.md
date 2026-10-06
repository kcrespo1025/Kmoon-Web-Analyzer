# Security

## Purpose

KMoon Web Analyzer is intended for website debugging, analysis, copy research, and cybersecurity education. It is not intended for credential theft, user surveillance, or logging private user data.

## Sensitive-data protections

- The extension does not read cookies, request/response bodies, authorization headers, or keyboard characters. It does not intentionally collect password or credit-card field values.
- URL user-info is removed, and query parameters with names matching a sensitive-key heuristic are redacted. This is not comprehensive: ordinary URL paths, page titles, site-generated error text, and proprietary identifiers can still contain sensitive data.
- Likely sensitive-key values are masked in the storage inspector. Review exported logs and page snapshots before sharing them.
- No remote upload is implemented. Activity data stays in browser extension storage unless the user explicitly downloads an export or page snapshot.
- The UI reports project name and repository metadata. This is an attribution check only: because the extension and its verifier are client-side open source, it cannot resist a deliberate source modification and is not a cryptographic authenticity check.
- The extension may fetch official repository metadata for comparison, but it never fetches or executes replacement code from GitHub.
- The WebCode Executor runs code only after an explicit user action and confirmation; use it only on sites you own or are authorized to test.

## Permissions

The Manifest V3 extension requests access to supported websites for opt-in inspection; web request/navigation metadata; local extension storage; downloads initiated by the user; and Chrome's extension-management API for listing and enabling/disabling installed extensions. It does not request cookie access.

## Reporting a vulnerability

If enabled on the repository, use the **Report a vulnerability** feature on the [official repository's Security tab](https://github.com/kcrespo1025/Kmoon-Web-Analyzer/security). Otherwise, contact the maintainer privately through the account associated with the official repository. Include affected version, impact, and safe reproduction steps.

Do not publish a public issue for a vulnerability before the maintainers have had a chance to review the report.
