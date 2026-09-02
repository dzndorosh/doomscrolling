# YouTube Shorts catalog

FocusReels uses a shared editorial catalog, not YouTube recommendations. Bluesky
research remains in `docs/research/` and is marked `REJECTED_AS_PRIMARY_SOURCE` for
the product path. The app requires no YouTube login or API key: the key is used only
by the maintainer sync job to generate a public JSON catalog.

The bundled fallback is `config/youtube-catalog.fixture.json`, copied into `dist/config` during build. It contains the validated 66-video catalog so first launch works offline; Pages refreshes it in the background.
The player embeds IDs through the official YouTube IFrame API. Branding, ads and other
YouTube-controlled UI may still appear and must not be masked.

Maintainers set `YOUTUBE_API_KEY` and `YOUTUBE_PLAYLIST_ID`, then run
`npm run catalog:youtube:sync`. The manual GitHub Actions workflow does the same using
Secrets/Variables and uploads the catalog as an artifact; it does not push to the
default branch. Local feedback (likes, hides, skips and completion) is stored locally
and only changes FocusReels ordering.
