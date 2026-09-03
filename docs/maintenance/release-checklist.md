# Release checklist

## Automated

Run from the repository root:

```bash
npm run check:release
npm run package:mac
```

`check:release` covers the build, renderer assets, Control Center wiring, native
scroll seam, tests and TypeScript. `package:mac` produces an unsigned DMG for the
current macOS host architecture unless the builder configuration is changed.

## Manual macOS verification

- Mount the DMG and launch `FocusReels.app` from a fresh temporary profile.
- Open Control Center and verify the master switch, source switches, sound and
  Always on top survive a quit/relaunch.
- Enable Launch at login, log out/in, and verify the app starts without stealing
  focus from the editor.
- Run one AI turn in Cursor, VS Code and JetBrains; verify one active video,
  native paging and exclusive audio.
- Disable FocusReels and verify a new turn does not show the feed.

## Distribution-only

- Configure a real Developer ID Application identity.
- Sign and notarize the app/DMG.
- Test Gatekeeper approval on a clean macOS profile.
- Publish only after the signed artifact has passed the manual checklist.
