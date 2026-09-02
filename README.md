# FocusReels

FocusReels is a macOS Electron overlay that shows a small stream of vertical
videos while an AI task is running in an IDE. It appears and disappears with
the existing IDE event adapters, never receives prompt or source-code content,
and keeps the overlay motion local to one BrowserWindow.

## Video architecture

The shipped source is a maintainer-curated YouTube Shorts catalog:

```text
verified channels → maintainer collector → validated catalog → HTTPS catalog
→ YoutubeCatalogProvider → renderer → official YouTube IFrame Player
```

`YoutubeCatalogProvider` owns catalog selection, validation, remote/cache/fallback
handling, ranking, broken-video history and local feedback persistence. Playback
uses the official YouTube IFrame Player API; the app does not download videos,
extract media URLs, scrape YouTube or provide YouTube recommendations.

The public catalog is currently 66 videos from 12 reviewed channels. Runtime can
use the HTTPS catalog at:

`https://dzndorosh.github.io/doomscrolling/catalog/youtube-catalog.json`

The app uses this Pages URL by default and refreshes it in the background.
`FOCUSREELS_REMOTE_CATALOG_URL` is an optional override for development and forks;
if the network is unavailable, the provider uses its cache and bundled 66-video
fallback catalog.

The ordinary user needs no API key, OAuth or account. `YOUTUBE_API_KEY` is used
only by maintainer-side GitHub Actions/local collector commands and never ships
in the desktop bundle or renderer.

## Development

```bash
npm install
npm start
```

Run `npm test`, `npm run typecheck` and `npm run build` before publishing changes.
Maintainers update the catalog with `YOUTUBE_API_KEY=... npm run catalog:youtube:collect`.
The review and candidate commands are maintainer-only and are not part of the
user flow. Development-only E2E fixtures use explicit environment variables and
are never production catalog input.

## Privacy and security

IDE adapters send only sanitized turn lifecycle metadata over a local Unix socket.
The YouTube iframe is isolated from Node.js through the preload/context-isolation
boundary. Local feedback (impressions, completions, skips and hidden IDs) stays in
the user's application data directory and is not sent to YouTube or a FocusReels
server.

YouTube branding, ads and player notices may still appear because the embedded
player is an official cross-origin surface and cannot be masked safely.

## Research

The historical Bluesky investigation is documented under `docs/research/` and is
marked `REJECTED_AS_PRIMARY_SOURCE`; it is not a runtime dependency.
