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

The public catalog is refreshed by the daily maintainer build and its size may
change over time. The current published snapshot is generated from 12 reviewed
channels. Runtime can use the HTTPS catalog at:

`https://dzndorosh.github.io/doomscrolling/catalog/youtube-catalog.json`

The app uses this Pages URL by default and refreshes it in the background.
`FOCUSREELS_REMOTE_CATALOG_URL` is an optional override for development and forks;
if the network is unavailable, the provider uses its cache and bundled catalog
snapshot for offline fallback.

The ordinary user needs no API key, OAuth or account. `YOUTUBE_API_KEY` is used
only by maintainer-side GitHub Actions/local collector commands and never ships
in the desktop bundle or renderer.

## Development

```bash
npm install
npm start
```

Click the FocusReels menu-bar icon to open the Control Center. Its master
`FocusReels enabled` switch is persisted in `settings.json`; when off, new AI
turns are ignored and any visible feed is hidden.

The Control Center also exposes `Always on top` and `Launch at login`. The
latter uses macOS Login Items and is off by default until enabled by the user.
FocusReels also appears in the Dock; the menu-bar item remains available as a
secondary quick access point.

The native vertical-scroll path is now enabled by default. To smoke-test the
legacy path explicitly, run:

```bash
FOCUSREELS_LEGACY_SCROLL=1 npm start
```

Packaged production builds use the same native path. The legacy pane/gesture
path remains available only through the explicit escape flag.

The accepted development configuration (native scrolling with direct iframe
hover and chromeless YouTube controls) can also be launched explicitly with:

```bash
npm run start:native
```

This is the same native configuration used by the current packaged build.

Before changing the production scroll path, run the native seam check:

```bash
npm run check:native-rollout
```

The Control Center wiring can be checked without launching Electron:

```bash
npm run check:control-center
```

Before creating a macOS package, verify the built runtime bundle:

```bash
npm run check:package
```

Validate the macOS packaging configuration:

```bash
npm run check:packaging-config
```

Run the complete non-interactive release gate:

```bash
npm run check:release
```

Build a local unsigned DMG when a packaging run is desired:

```bash
npm run package:mac
```

The DMG is written to `release/` and is unsigned/notarized in local development;
distribution signing is a separate release step.

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
