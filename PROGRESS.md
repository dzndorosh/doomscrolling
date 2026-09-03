# FocusReels progress

## Сделано

- Native scroll-snap production path включён по умолчанию; legacy path сохранён через `FOCUSREELS_LEGACY_SCROLL=1`.
- Phase B YouTube lifecycle исправлен: exclusive audio, reset playback position, native auto-next.
- Control Center: master toggle, sources, sound, Always on top, Launch at login.
- Автоматические проверки: tests, typecheck, build, native rollout, Control Center wiring, runtime bundle.
- Packaging config and local unsigned DMG command added; runtime bundle validation passes.
- Local arm64 unsigned DMG built successfully at `release/FocusReels-0.1.0-arm64.dmg`; `hdiutil imageinfo` confirms a valid UDZO image.
- DMG mounted read-only, verified as arm64 `FocusReels.app` version 0.1.0, copied to a fresh `/tmp` install directory, and detached cleanly.
- README and maintenance docs aligned with native production default and legacy escape.
- Unified non-interactive release gate added as `npm run check:release`.
- `npm run check:release` passed end-to-end (config, wiring, rollout, bundle, tests, typecheck).
- Added `docs/maintenance/release-checklist.md` with automated, manual and distribution-only gates.
- Dock visibility changed to normal macOS `regular` activation policy while retaining the menu-bar item.
- Dock reopen fixed with macOS `activate` handler; closing Control Center and clicking the Dock icon now recreates/focuses it.
- Dock reopen fix rebuilt into the unsigned arm64 DMG after `npm test`, `npm run typecheck`, `npm run build`, and `npm run check:release` passed.
- Local packaging output `release/` is ignored by Git; final `npm run check:release` still passes.
- Control Center now uses the same macOS screen-saver window level while open, so it remains accessible above an active always-on-top video; Control Center check, typecheck, build, and tests pass.

## Допущения

- Произвольные приложения не добавляются в UI до появления event adapters: один сохранённый app name без события не сможет запускать видео.
- Packaging-подготовка остаётся локальной и обратимой; публикация и установка вне репозитория не выполняются.

## На моё решение

- Local DMG build must disable automatic signing; distribution signing/notarization remains a release step.
- `npm audit --omit=dev` is clean; full audit reports dev-tool transitive vulnerabilities from electron-builder and was not auto-fixed because `--force` could introduce breaking changes.

## Заблокировано

- Unsigned DMG clean install and launch-at-login still require manual macOS verification.
- Manual source verification across Cursor/VS Code/JetBrains remains outstanding.
- Manual Dock verification remains: close Control Center with the red button, then click the FocusReels Dock icon and confirm the window reappears/focuses.
- Clean-copy verification is complete; full app launch from the copied bundle was not run to avoid touching the user's live broker/tray session.
- First signed attempt reached local Apple Development code-signing and was cancelled after keychain stall; the explicit unsigned retry succeeded.
- Packaging recursion bug found and fixed: release artifacts now go to `release/`, outside the `dist/**/*` app input.
- Added explicit excludes for stale DMG/app artifacts under `dist/`; previous generated artifacts were moved (not deleted) to a temporary archive.
- Rebuilt clean arm64 DMG at `release/FocusReels-0.1.0-arm64.dmg`; app.asar is 444K and no nested DMG/mac artifact remains.
- Unified `npm run check:release` passed after the packaging fix.
