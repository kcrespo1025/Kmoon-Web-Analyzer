# Privacy

## What is collected

This project is designed to collect browser activity locally for analysis and debugging. It may record:

- Requests and navigation activity
- DOM mutation counts and limited element metadata
- JavaScript error/rejection notices (not console arguments or source execution traces; site-generated messages may contain arbitrary text)
- Timing and event metadata
- Local storage and cache metadata in the browser context

## What is not collected

- Cookie values
- Request/response bodies or authorization headers
- Typed keyboard characters
- Request or response bodies
- Cookie values

## Where data is stored

Activity events, settings, saved scripts, history, and workspace labels are stored locally in the browser's extension storage, on the user's device, unless the user explicitly exports them.

When the user requests a page snapshot, a current-page HTML file is saved using Chrome Downloads. Form field values are removed from that saved snapshot. Page HTML may contain site-provided script/state text, so users should only create snapshots for sites they are authorized to copy and should review the file before sharing it.

## When data leaves the device

By default, nothing is uploaded or sent externally. Any export or sharing action is under the user's control and should be clearly initiated by the user.

### Known limitations

URL user-info is removed and query parameters with sensitive-looking names are redacted. This is a best-effort filter, not a guarantee that every site's proprietary identifier will be recognized. Password and credit-card field values are not intentionally read, but do not monitor pages where ordinary URL paths, page titles, or site-generated error text may expose confidential data. Storage inspection shows values only after the user opens that tool; likely sensitive-key values are masked.
